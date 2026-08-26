import { NextRequest, NextResponse } from "next/server";
import { validateStateTransition } from "@/lib/workflow/state-machine";
import { NotificationService } from "@/lib/notifications/adapter";
import { LineNotificationProvider } from "@/lib/notifications/line-provider";
import { InAppNotificationProvider } from "@/lib/notifications/inapp-provider";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { targetStatus, userRole, userId, task, hasOutputCommentOrAttachment, hasAssigneeAndDeadline } = body;

    if (!targetStatus || !userRole || !userId || !task) {
      return NextResponse.json(
        { success: false, error: "Missing required transition parameters" },
        { status: 400 }
      );
    }

    // Enforce pure state machine logic on server
    const validation = validateStateTransition({
      task,
      targetStatus,
      userRole,
      userId,
      hasOutputCommentOrAttachment,
      hasAssigneeAndDeadline,
    });

    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 403 }
      );
    }

    // Initialize notification service & providers
    const notifService = new NotificationService();
    notifService.registerProvider(new InAppNotificationProvider());
    notifService.registerProvider(new LineNotificationProvider());

    // Dispatch notification
    await notifService.dispatch({
      type: "status_changed",
      recipientUserId: task.created_by || userId,
      recipientLineUserId: body.recipientLineUserId,
      taskId: task.id,
      taskTitle: task.title,
      title: "สถานะงานเปลี่ยนแปลง",
      message: `งาน "${task.title}" ได้เปลี่ยนสถานะเป็น ${targetStatus}`,
    });

    return NextResponse.json({
      success: true,
      message: `Status transition to ${targetStatus} approved and processed`,
      newStatus: targetStatus,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
