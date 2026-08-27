// ====================================================================
// TaskFlow — Supabase Cloud Data Sync Service
// High-Performance On-Demand Cloud Sync with Zero UI Blocking
// ====================================================================

import {
  Task,
  Comment,
  TaskIssue,
  PermitDetails,
  TimeEntry,
  UserProfile,
  Team,
  Project,
  TaskAttachment,
  ActivityLog,
} from "@/lib/types/database.types";

export class SupabaseSyncService {
  private static pendingFetchPromise: Promise<any> | null = null;

  // 1. Fetch All Domain Data with Promise Deduplication & 8-Second Safety Timeout
  public static async fetchCloudData(orgId?: string) {
    if (this.pendingFetchPromise) {
      return this.pendingFetchPromise;
    }

    this.pendingFetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const syncUrl = orgId ? `/api/sync?org_id=${encodeURIComponent(orgId)}` : "/api/sync";
        const res = await fetch(syncUrl, {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          console.warn("[Sync Fetch HTTP Status]:", res.status);
          return null;
        }

        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
        return null;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          console.warn("[Sync Fetch Timeout]: Request took > 8s, skipped");
        } else {
          console.error("[Sync Fetch Error]:", err);
        }
        return null;
      } finally {
        this.pendingFetchPromise = null;
      }
    })();

    return this.pendingFetchPromise;
  }

  // 2. Persist Task via Server API (Non-blocking async)
  public static async saveTask(task: Partial<Task>, permitDetails?: Partial<PermitDetails>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_task",
          payload: { task, permitDetails },
        }),
      }).catch((err) => console.error("[Save Task Background Error]:", err));
    } catch (err) {
      console.error("[Save Task Error]:", err);
    }
  }

  // 3. Delete Task via Server API (Non-blocking async)
  public static async deleteTask(taskId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_task",
          payload: { taskId },
        }),
      }).catch((err) => console.error("[Delete Task Background Error]:", err));
    } catch (err) {
      console.error("[Delete Task Error]:", err);
    }
  }

  // 4. Save Comment via Server API (Non-blocking async)
  public static async saveComment(comment: Partial<Comment>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_comment",
          payload: { comment },
        }),
      }).catch((err) => console.error("[Save Comment Background Error]:", err));
    } catch (err) {
      console.error("[Save Comment Error]:", err);
    }
  }

  // 5. Save Issue via Server API (Non-blocking async)
  public static async saveIssue(issue: Partial<TaskIssue>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_issue",
          payload: { issue },
        }),
      }).catch((err) => console.error("[Save Issue Background Error]:", err));
    } catch (err) {
      console.error("[Save Issue Error]:", err);
    }
  }

  // 6. Save Time Entry via Server API (Non-blocking async)
  public static async saveTimeEntry(timeEntry: Partial<TimeEntry>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_time_entry",
          payload: { timeEntry },
        }),
      }).catch((err) => console.error("[Save Time Entry Background Error]:", err));
    } catch (err) {
      console.error("[Save Time Entry Error]:", err);
    }
  }

  // 7. Save User via Server API (Non-blocking async)
  public static async saveUser(user: Partial<UserProfile>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_user",
          payload: { user },
        }),
      }).catch((err) => console.error("[Save User Background Error]:", err));
    } catch (err) {
      console.error("[Save User Error]:", err);
    }
  }

  // 8. Delete User via Server API (Non-blocking async)
  public static async deleteUser(userId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_user",
          payload: { userId },
        }),
      }).catch((err) => console.error("[Delete User Background Error]:", err));
    } catch (err) {
      console.error("[Delete User Error]:", err);
    }
  }

  // 9. Save Team via Server API (Non-blocking async)
  public static async saveTeam(team: Partial<Team>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_team",
          payload: { team },
        }),
      }).catch((err) => console.error("[Save Team Background Error]:", err));
    } catch (err) {
      console.error("[Save Team Error]:", err);
    }
  }

  // 10. Delete Team via Server API (Non-blocking async)
  public static async deleteTeam(teamId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_team",
          payload: { teamId },
        }),
      }).catch((err) => console.error("[Delete Team Background Error]:", err));
    } catch (err) {
      console.error("[Delete Team Error]:", err);
    }
  }

  // 11. Save Attachment via Server API (Non-blocking async)
  public static async saveAttachment(attachment: Partial<TaskAttachment>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_attachment",
          payload: { attachment },
        }),
      }).catch((err) => console.error("[Save Attachment Background Error]:", err));
    } catch (err) {
      console.error("[Save Attachment Error]:", err);
    }
  }

  // 12. Delete Attachment via Server API (Non-blocking async)
  public static async deleteAttachment(attachmentId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_attachment",
          payload: { attachmentId },
        }),
      }).catch((err) => console.error("[Delete Attachment Background Error]:", err));
    } catch (err) {
      console.error("[Delete Attachment Error]:", err);
    }
  }

  // 14. Save Project via Server API (Non-blocking async)
  public static async saveProject(project: Partial<Project>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_project",
          payload: { project },
        }),
      }).catch((err) => console.error("[Save Project Background Error]:", err));
    } catch (err) {
      console.error("[Save Project Error]:", err);
    }
  }

  // 15. Delete Project via Server API (Non-blocking async)
  public static async deleteProject(projectId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_project",
          payload: { projectId },
        }),
      }).catch((err) => console.error("[Delete Project Background Error]:", err));
    } catch (err) {
      console.error("[Delete Project Error]:", err);
    }
  }

  // 16. Save Activity Log via Server API (Non-blocking async)
  public static async saveActivityLog(log: Partial<ActivityLog>) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_activity_log",
          payload: { log },
        }),
      }).catch((err) => console.error("[Save Activity Log Background Error]:", err));
    } catch (err) {
      console.error("[Save Activity Log Error]:", err);
    }
  }

  // 17. Delete Comment via Server API (Non-blocking async)
  public static async deleteComment(commentId: string) {
    try {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_comment",
          payload: { commentId },
        }),
      }).catch((err) => console.error("[Delete Comment Background Error]:", err));
    } catch (err) {
      console.error("[Delete Comment Error]:", err);
    }
  }
}
