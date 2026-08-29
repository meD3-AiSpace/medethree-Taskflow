// ====================================================================
// TaskFlow — Supabase Cloud Data Sync Service
// High-Performance Resilient Sync with Offline Outbox & Deduplication
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
import { OfflineOutboxService } from "@/lib/sync/offline-outbox";

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

  // 2. Persist Task via Offline-Resilient Outbox Queue
  public static async saveTask(task: Partial<Task>, permitDetails?: Partial<PermitDetails>) {
    OfflineOutboxService.enqueue("save_task", { task, permitDetails });
  }

  // 3. Delete Task via Offline-Resilient Outbox Queue
  public static async deleteTask(taskId: string) {
    OfflineOutboxService.enqueue("delete_task", { taskId });
  }

  // 4. Save Comment via Offline-Resilient Outbox Queue
  public static async saveComment(comment: Partial<Comment>) {
    OfflineOutboxService.enqueue("save_comment", { comment });
  }

  // 5. Save Issue via Offline-Resilient Outbox Queue
  public static async saveIssue(issue: Partial<TaskIssue>) {
    OfflineOutboxService.enqueue("save_issue", { issue });
  }

  // 6. Save Time Entry via Offline-Resilient Outbox Queue
  public static async saveTimeEntry(timeEntry: Partial<TimeEntry>) {
    OfflineOutboxService.enqueue("save_time_entry", { timeEntry });
  }

  // 7. Save User via Offline-Resilient Outbox Queue
  public static async saveUser(user: Partial<UserProfile>) {
    OfflineOutboxService.enqueue("save_user", { user });
  }

  // 8. Delete User via Offline-Resilient Outbox Queue
  public static async deleteUser(userId: string) {
    OfflineOutboxService.enqueue("delete_user", { userId });
  }

  // 9. Save Team via Offline-Resilient Outbox Queue
  public static async saveTeam(team: Partial<Team>) {
    OfflineOutboxService.enqueue("save_team", { team });
  }

  // 10. Delete Team via Offline-Resilient Outbox Queue
  public static async deleteTeam(teamId: string) {
    OfflineOutboxService.enqueue("delete_team", { teamId });
  }

  // 11. Save Attachment via Offline-Resilient Outbox Queue
  public static async saveAttachment(attachment: Partial<TaskAttachment>) {
    OfflineOutboxService.enqueue("save_attachment", { attachment });
  }

  // 12. Delete Attachment via Offline-Resilient Outbox Queue
  public static async deleteAttachment(attachmentId: string) {
    OfflineOutboxService.enqueue("delete_attachment", { attachmentId });
  }

  // 14. Save Project via Offline-Resilient Outbox Queue
  public static async saveProject(project: Partial<Project>) {
    OfflineOutboxService.enqueue("save_project", { project });
  }

  // 15. Delete Project via Offline-Resilient Outbox Queue
  public static async deleteProject(projectId: string) {
    OfflineOutboxService.enqueue("delete_project", { projectId });
  }

  // 16. Save Activity Log via Offline-Resilient Outbox Queue
  public static async saveActivityLog(log: Partial<ActivityLog>) {
    OfflineOutboxService.enqueue("save_activity_log", { log });
  }

  // 17. Delete Comment via Offline-Resilient Outbox Queue
  public static async deleteComment(commentId: string) {
    OfflineOutboxService.enqueue("delete_comment", { commentId });
  }

  // 18. Update Permit Status via Offline-Resilient Outbox Queue
  public static async updatePermitStatus(taskId: string, permitStatus: string, revisionRound: number) {
    OfflineOutboxService.enqueue("update_permit_status", { taskId, permitStatus, revisionRound });
  }
}
