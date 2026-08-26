import { NextRequest, NextResponse } from "next/server";
import { validateStateTransition } from "@/lib/workflow/state-machine";
import { NotificationService } from "@/lib/notifications/adapter";
import { LineNotificationProvider } from "@/lib/notifications/line-provider";
import { InAppNotificationProvider } from "@/lib/notifications/inapp-provider";
import { UserRole } from "@/lib/types/database.types";
import { TransitionSchema, formatZodError } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Rate Limiting: 60 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`transition:${clientIp}`, 60, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Transition Requests. Please slow down.",
          retryAfter: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    // 2. Strict Zod Validation (targetStatus only — no client-supplied state or overrides)
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = TransitionSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: formatZodError(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { targetStatus } = parseResult.data;

    // 3. Cookie-bound Server-side Authentication & Session Resolution
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    const user = authData?.user;

    // Strict Deny: If no active session exists, return HTTP 401
    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    // 4. Resolve authenticated user profile from Database (Never trust request headers or body)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role, org_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profileError) {
      return NextResponse.json(
        { success: false, error: "User profile not found in organization" },
        { status: 403 }
      );
    }

    const actorId = profile.id;
    const actorRole = (profile.role as UserRole) || "member";
    const orgId = profile.org_id;

    // 5. Multi-Tenant Scoped Task Lookup from Database
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, org_id, title, status, deadline, created_by, status_changed_at, created_at")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .single();

    if (!task || taskError) {
      return NextResponse.json(
        { success: false, error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // 6. Fetch Database Assignees & Fresh Evidence Count
    const { data: assigneeRows } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", task.id);

    const assigneeIds = (assigneeRows || []).map((r) => r.user_id);

    const sinceTimestamp = task.status_changed_at || task.created_at;

    const { count: commentCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("task_id", task.id)
      .gt("created_at", sinceTimestamp);

    const { count: attachmentCount } = await supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("task_id", task.id)
      .gt("created_at", sinceTimestamp);

    const evidenceCount = (commentCount || 0) + (attachmentCount || 0);

    // 7. Enforce Pure State Machine Transition Rules on Server
    const validation = validateStateTransition({
      currentStatus: task.status,
      targetStatus,
      deadlineSet: !!task.deadline,
      assigneeIds,
      actorId,
      actorRole,
      evidenceCount,
    });

    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 403 }
      );
    }

    // 8. Update Task Status in Database
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: targetStatus,
        status_changed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", task.id)
      .eq("org_id", orgId);

    if (updateError) {
      console.error("[Transition DB Update Error]:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to persist state transition to database" },
        { status: 500 }
      );
    }

    // 9. Dispatch Notifications to Database-verified Recipients
    try {
      const notifService = new NotificationService();
      notifService.registerProvider(new InAppNotificationProvider());
      notifService.registerProvider(new LineNotificationProvider());

      const recipientId = task.created_by || actorId;

      await notifService.dispatch({
        type: "status_changed",
        recipientUserId: recipientId,
        taskId: task.id,
        taskTitle: task.title,
        title: "สถานะงานเปลี่ยนแปลง",
        message: `งาน "${task.title}" ได้เปลี่ยนสถานะเป็น ${targetStatus}`,
      });
    } catch (notifErr) {
      console.warn("[Notification Dispatch Warning]:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Status transition to ${targetStatus} approved and processed`,
      newStatus: targetStatus,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Transition API Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
