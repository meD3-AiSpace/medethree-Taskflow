// ====================================================================
// TaskFlow — Server-Side Cloud Sync & Mutation API
// Provides reliable, authorized read/write access to Supabase Cloud
// ====================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    let supabase = null;
    try {
      supabase = createAdminClient();
    } catch {
      // fallback
    }

    if (!supabase) {
      try {
        supabase = createServerClient();
      } catch {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
      }
    }

    const [
      tasksRes,
      projectsRes,
      teamsRes,
      usersRes,
      commentsRes,
      attachmentsRes,
      issuesRes,
      permitsRes,
      timeRes,
      logsRes,
    ] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*"),
      supabase.from("teams").select("*"),
      supabase.from("users").select("*"),
      supabase.from("comments").select("*").order("created_at", { ascending: true }),
      supabase.from("attachments").select("*").order("created_at", { ascending: false }),
      supabase.from("task_issues").select("*").order("raised_at", { ascending: false }),
      supabase.from("permit_details").select("*"),
      supabase.from("time_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasksRes.data || [],
        projects: projectsRes.data || [],
        teams: teamsRes.data || [],
        users: usersRes.data || [],
        comments: commentsRes.data || [],
        attachments: attachmentsRes.data || [],
        issues: issuesRes.data || [],
        permits: permitsRes.data || [],
        timeEntries: timeRes.data || [],
        activityLogs: logsRes.data || [],
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, payload } = body;

    let supabase = null;
    try {
      supabase = createAdminClient();
    } catch {
      // fallback
    }

    if (!supabase) {
      try {
        supabase = createServerClient();
      } catch {
        return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
      }
    }

    switch (action) {
      case "save_task": {
        const { task, permitDetails } = payload;
        const dbTask = {
          id: task.id,
          org_id: task.org_id || "11111111-1111-1111-1111-111111111111",
          project_id: task.project_id || null,
          category: task.category || "design",
          title: task.title,
          description: task.description || "",
          status: task.status || "todo",
          priority: task.priority || "medium",
          created_by: task.created_by || null,
          deadline: task.deadline || null,
          status_changed_at: task.status_changed_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: taskErr } = await supabase.from("tasks").upsert(dbTask);
        if (taskErr) throw taskErr;

        if (permitDetails && task.id) {
          await supabase.from("permit_details").upsert({
            task_id: task.id,
            permit_type: permitDetails.permit_type || "ใบอนุญาตก่อสร้าง (อ.1)",
            authority: permitDetails.authority || "สำนักงานเขต/เทศบาล",
            submitted_date: permitDetails.submitted_date || null,
            target_approval_date: permitDetails.target_approval_date || null,
            revision_round: permitDetails.revision_round || 0,
            permit_status: permitDetails.permit_status || "preparing",
          });
        }
        return NextResponse.json({ success: true, message: "Task saved to cloud" });
      }

      case "delete_task": {
        const { taskId } = payload;
        await supabase.from("tasks").delete().eq("id", taskId);
        return NextResponse.json({ success: true, message: "Task deleted from cloud" });
      }

      case "save_comment": {
        const { comment } = payload;
        await supabase.from("comments").insert({
          id: comment.id,
          task_id: comment.task_id,
          user_id: comment.user_id,
          content: comment.content,
        });
        return NextResponse.json({ success: true, message: "Comment saved to cloud" });
      }

      case "save_issue": {
        const { issue } = payload;
        await supabase.from("task_issues").upsert({
          id: issue.id,
          task_id: issue.task_id,
          issue_description: issue.issue_description,
          raised_by: issue.raised_by,
          is_resolved: issue.is_resolved || false,
          resolved_by: issue.resolved_by || null,
          resolved_at: issue.resolved_at || null,
          resolution_description: issue.resolution_description || null,
        });
        return NextResponse.json({ success: true, message: "Issue saved to cloud" });
      }

      case "save_time_entry": {
        const { timeEntry } = payload;
        await supabase.from("time_entries").insert({
          id: timeEntry.id,
          task_id: timeEntry.task_id,
          user_id: timeEntry.user_id,
          minutes: timeEntry.duration_minutes || (timeEntry.hours || 0) * 60 + (timeEntry.minutes || 0),
          description: timeEntry.note || "",
        });
        return NextResponse.json({ success: true, message: "Time entry saved to cloud" });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Sync API Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
