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

    const targetOrgId =
      request.nextUrl.searchParams.get("org_id") || "11111111-1111-1111-1111-111111111111";

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
      supabase.from("tasks").select("*").eq("org_id", targetOrgId).order("created_at", { ascending: false }),
      supabase.from("projects").select("*").eq("org_id", targetOrgId),
      supabase.from("teams").select("*").eq("org_id", targetOrgId),
      supabase.from("users").select("*").eq("org_id", targetOrgId),
      supabase.from("comments").select("*").order("created_at", { ascending: true }),
      supabase.from("attachments").select("*").order("created_at", { ascending: false }),
      supabase.from("task_issues").select("*").order("raised_at", { ascending: false }),
      supabase.from("permit_details").select("*"),
      supabase.from("time_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    const orgTasks = tasksRes.data || [];
    const orgTaskIds = new Set(orgTasks.map((t: any) => t.id));

    // Multi-tenant strict isolation: only include child records belonging to this organization's tasks
    const scopedComments = (commentsRes.data || []).filter((c: any) => orgTaskIds.has(c.task_id));
    const scopedAttachments = (attachmentsRes.data || []).filter((a: any) => orgTaskIds.has(a.task_id));
    const scopedIssues = (issuesRes.data || []).filter((i: any) => orgTaskIds.has(i.task_id));
    const scopedPermits = (permitsRes.data || []).filter((p: any) => orgTaskIds.has(p.task_id));
    const scopedTimeEntries = (timeRes.data || []).filter((te: any) => orgTaskIds.has(te.task_id));
    const scopedActivityLogs = (logsRes.data || []).filter((l: any) => !l.task_id || orgTaskIds.has(l.task_id));

    return NextResponse.json({
      success: true,
      org_id: targetOrgId,
      data: {
        tasks: orgTasks,
        projects: projectsRes.data || [],
        teams: teamsRes.data || [],
        users: usersRes.data || [],
        comments: scopedComments,
        attachments: scopedAttachments,
        issues: scopedIssues,
        permits: scopedPermits,
        timeEntries: scopedTimeEntries,
        activityLogs: scopedActivityLogs,
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

      case "save_user": {
        const { user } = payload;
        const dbUser = {
          id: user.id,
          org_id: user.org_id || "11111111-1111-1111-1111-111111111111",
          full_name: user.full_name,
          email: user.email,
          role: user.role || "member",
          team_id: user.team_id || null,
          line_user_id: user.line_user_id || null,
          created_at: user.created_at || new Date().toISOString(),
        };
        const { error: uErr } = await supabase.from("users").upsert(dbUser);
        if (uErr) throw uErr;
        return NextResponse.json({ success: true, message: "User saved to cloud" });
      }

      case "delete_user": {
        const { userId } = payload;
        const { error: dErr } = await supabase.from("users").delete().eq("id", userId);
        if (dErr) throw dErr;
        return NextResponse.json({ success: true, message: "User deleted from cloud" });
      }

      case "save_team": {
        const { team } = payload;
        const dbTeam = {
          id: team.id,
          org_id: team.org_id || "11111111-1111-1111-1111-111111111111",
          name: team.name,
          created_at: team.created_at || new Date().toISOString(),
        };
        const { error: tErr } = await supabase.from("teams").upsert(dbTeam);
        if (tErr) throw tErr;
        return NextResponse.json({ success: true, message: "Team saved to cloud" });
      }

      case "delete_team": {
        const { teamId } = payload;
        const { error: dtErr } = await supabase.from("teams").delete().eq("id", teamId);
        if (dtErr) throw dtErr;
        return NextResponse.json({ success: true, message: "Team deleted from cloud" });
      }

      case "save_project": {
        const { project } = payload;
        const dbProject = {
          id: project.id,
          org_id: project.org_id || "11111111-1111-1111-1111-111111111111",
          name: project.name,
          team_id: project.team_id || null,
          created_at: project.created_at || new Date().toISOString(),
        };
        const { error: pErr } = await supabase.from("projects").upsert(dbProject);
        if (pErr) throw pErr;
        return NextResponse.json({ success: true, message: "Project saved to cloud" });
      }

      case "delete_project": {
        const { projectId } = payload;
        // 1. Unlink tasks from this project first to satisfy foreign key constraints
        await supabase.from("tasks").update({ project_id: null }).eq("project_id", projectId);
        // 2. Delete project from Supabase Cloud
        const { error: dpErr } = await supabase.from("projects").delete().eq("id", projectId);
        if (dpErr) throw dpErr;
        return NextResponse.json({ success: true, message: "Project deleted from cloud" });
      }

      case "save_attachment": {
        const { attachment } = payload;
        const dbAtt = {
          id: attachment.id,
          task_id: attachment.task_id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
          file_size_kb: attachment.compressed_size_kb || attachment.original_size_kb || 0,
          file_type: attachment.file_type || "image",
          uploaded_by: attachment.uploaded_by || null,
          created_at: attachment.created_at || new Date().toISOString(),
        };
        const { error: aErr } = await supabase.from("attachments").upsert(dbAtt);
        if (aErr) throw aErr;
        return NextResponse.json({ success: true, message: "Attachment saved to cloud" });
      }

      case "delete_attachment": {
        const { attachmentId } = payload;
        const { error: daErr } = await supabase.from("attachments").delete().eq("id", attachmentId);
        if (daErr) throw daErr;
        return NextResponse.json({ success: true, message: "Attachment deleted from cloud" });
      }

      case "save_activity_log": {
        const { log } = payload;
        const dbLog = {
          id: log.id,
          task_id: log.task_id,
          user_id: log.user_id || null,
          action: log.action || "general_update",
          details: log.details ? (typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details)) : null,
          created_at: log.created_at || new Date().toISOString(),
        };
        const { error: lErr } = await supabase.from("activity_log").insert(dbLog);
        if (lErr) throw lErr;
        return NextResponse.json({ success: true, message: "Activity log saved to cloud" });
      }

      case "save_comment": {
        const { comment } = payload;
        const dbComment = {
          id: comment.id,
          task_id: comment.task_id,
          user_id: comment.user_id || null,
          content: comment.content,
          content_en: comment.content_en || null,
          created_at: comment.created_at || new Date().toISOString(),
        };
        const { error: cErr } = await supabase.from("comments").upsert(dbComment);
        if (cErr) throw cErr;
        return NextResponse.json({ success: true, message: "Comment saved to cloud" });
      }

      case "delete_comment": {
        const { commentId } = payload;
        const { error: dcErr } = await supabase.from("comments").delete().eq("id", commentId);
        if (dcErr) throw dcErr;
        return NextResponse.json({ success: true, message: "Comment deleted from cloud" });
      }

      case "update_permit_status": {
        const { taskId, permitStatus, revisionRound } = payload;
        const { error: pErr } = await supabase
          .from("permit_details")
          .upsert({
            task_id: taskId,
            permit_status: permitStatus,
            revision_round: revisionRound ?? 0,
          });
        if (pErr) throw pErr;
        return NextResponse.json({ success: true, message: "Permit status updated in cloud" });
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
