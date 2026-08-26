// ====================================================================
// TaskFlow — Supabase Cloud Data Sync & Realtime Service
// Bridges client store with /api/sync and Supabase Broadcast channels
// ====================================================================

import { createClient } from "./client";
import {
  Task,
  Comment,
  TaskIssue,
  PermitDetails,
  TimeEntry,
} from "@/lib/types/database.types";

export class SupabaseSyncService {
  private static broadcastChannel: any = null;

  private static getClient() {
    try {
      return createClient();
    } catch {
      return null;
    }
  }

  // 1. Fetch All Domain Data via Server Sync API
  public static async fetchCloudData() {
    try {
      const res = await fetch("/api/sync", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

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
      console.error("[Sync Fetch Error]:", err);
      return null;
    }
  }

  // 2. Broadcast and Subscribe to Realtime Cross-Device Updates
  public static subscribeRealtime(onSyncRequired: () => void) {
    const supabase = this.getClient();
    if (!supabase) return () => {};

    try {
      const channel = supabase.channel("global-taskflow-sync", {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "database-updated" }, () => {
          console.log("⚡ [Realtime Sync]: Database change detected from another device!");
          onSyncRequired();
        })
        .subscribe();

      this.broadcastChannel = channel;

      return () => {
        supabase.removeChannel(channel);
        this.broadcastChannel = null;
      };
    } catch (err) {
      console.warn("[Realtime Channel Warning]:", err);
      return () => {};
    }
  }

  private static triggerBroadcast() {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: "broadcast",
          event: "database-updated",
          payload: { timestamp: Date.now() },
        });
      }
    } catch (err) {
      console.warn("[Broadcast Send Warning]:", err);
    }
  }

  // 3. Persist Task via Server API
  public static async saveTask(task: Partial<Task>, permitDetails?: Partial<PermitDetails>) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_task",
          payload: { task, permitDetails },
        }),
      });

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Task Error]:", err);
    }
  }

  // 4. Delete Task via Server API
  public static async deleteTask(taskId: string) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_task",
          payload: { taskId },
        }),
      });

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Delete Task Error]:", err);
    }
  }

  // 5. Save Comment via Server API
  public static async saveComment(comment: Partial<Comment>) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_comment",
          payload: { comment },
        }),
      });

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Comment Error]:", err);
    }
  }

  // 6. Save Issue via Server API
  public static async saveIssue(issue: Partial<TaskIssue>) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_issue",
          payload: { issue },
        }),
      });

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Issue Error]:", err);
    }
  }

  // 7. Save Time Entry via Server API
  public static async saveTimeEntry(timeEntry: Partial<TimeEntry>) {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_time_entry",
          payload: { timeEntry },
        }),
      });

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Time Entry Error]:", err);
    }
  }
}
