// ====================================================================
// TaskFlow — Supabase Cloud Data Sync & Realtime Service
// Bridges client store with live Supabase Database & WebSockets
// ====================================================================

import { createClient } from "./client";
import {
  Task,
  Comment,
  TaskIssue,
  PermitDetails,
  ActivityLog,
  TimeEntry,
  TaskAttachment,
  UserProfile,
  Team,
  Project,
} from "@/lib/types/database.types";

export class SupabaseSyncService {
  private static getClient() {
    try {
      return createClient();
    } catch (err) {
      console.warn("[Supabase Client Warning]:", err);
      return null;
    }
  }

  // 1. Fetch All Domain Data from Supabase Cloud
  public static async fetchCloudData() {
    const supabase = this.getClient();
    if (!supabase) return null;

    try {
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

      return {
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
      };
    } catch (err) {
      console.error("[Supabase Sync Fetch Error]:", err);
      return null;
    }
  }

  // 2. Subscribe to Realtime Postgres Changes across devices
  public static subscribeRealtime(callbacks: {
    onTaskChange?: (payload: any) => void;
    onCommentChange?: (payload: any) => void;
    onIssueChange?: (payload: any) => void;
    onPermitChange?: (payload: any) => void;
    onLogChange?: (payload: any) => void;
  }) {
    const supabase = this.getClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel("taskflow-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => callbacks.onTaskChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => callbacks.onCommentChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_issues" },
        (payload) => callbacks.onIssueChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "permit_details" },
        (payload) => callbacks.onPermitChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        (payload) => callbacks.onLogChange?.(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // 3. Persist Task to Supabase Cloud
  public static async saveTask(task: Partial<Task>, permitDetails?: Partial<PermitDetails>) {
    const supabase = this.getClient();
    if (!supabase) return;

    try {
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

      await supabase.from("tasks").upsert(dbTask);

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
    } catch (err) {
      console.error("[Supabase Save Task Error]:", err);
    }
  }

  // 4. Delete Task from Supabase Cloud
  public static async deleteTask(taskId: string) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from("tasks").delete().eq("id", taskId);
    } catch (err) {
      console.error("[Supabase Delete Task Error]:", err);
    }
  }

  // 5. Save Comment to Supabase Cloud
  public static async saveComment(comment: Partial<Comment>) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from("comments").insert({
        id: comment.id,
        task_id: comment.task_id,
        user_id: comment.user_id,
        content: comment.content,
      });
    } catch (err) {
      console.error("[Supabase Save Comment Error]:", err);
    }
  }

  // 6. Save Issue to Supabase Cloud
  public static async saveIssue(issue: Partial<TaskIssue>) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
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
    } catch (err) {
      console.error("[Supabase Save Issue Error]:", err);
    }
  }

  // 7. Save Time Entry to Supabase Cloud
  public static async saveTimeEntry(timeEntry: Partial<TimeEntry>) {
    const supabase = this.getClient();
    if (!supabase) return;
    try {
      await supabase.from("time_entries").insert({
        id: timeEntry.id,
        task_id: timeEntry.task_id,
        user_id: timeEntry.user_id,
        minutes: timeEntry.duration_minutes || (timeEntry.hours || 0) * 60 + (timeEntry.minutes || 0),
        description: timeEntry.note || "",
      });
    } catch (err) {
      console.error("[Supabase Save Time Entry Error]:", err);
    }
  }
}
