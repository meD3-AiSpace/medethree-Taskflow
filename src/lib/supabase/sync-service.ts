// ====================================================================
// TaskFlow — Supabase Cloud Data Sync & Realtime Service
// High-Performance Debounced Cloud Sync with Zero UI Blocking
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
  private static pendingFetchPromise: Promise<any> | null = null;
  private static debounceTimer: NodeJS.Timeout | null = null;

  private static getClient() {
    try {
      return createClient();
    } catch {
      return null;
    }
  }

  // 1. Fetch All Domain Data with Promise Deduplication (Prevents redundant simultaneous requests)
  public static async fetchCloudData() {
    if (this.pendingFetchPromise) {
      return this.pendingFetchPromise;
    }

    this.pendingFetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch("/api/sync", {
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

  // 2. Broadcast and Subscribe to Realtime Cross-Device Updates with Debouncing
  public static subscribeRealtime(onSyncRequired: () => void) {
    const supabase = this.getClient();
    if (!supabase) return () => {};

    try {
      const channel = supabase.channel("global-taskflow-sync", {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "database-updated" }, () => {
          // Debounce rapid sync notifications to prevent render cascades
          if (this.debounceTimer) clearTimeout(this.debounceTimer);
          this.debounceTimer = setTimeout(() => {
            onSyncRequired();
          }, 300);
        })
        .subscribe();

      this.broadcastChannel = channel;

      return () => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
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

  // 3. Persist Task via Server API (Non-blocking async)
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

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Task Error]:", err);
    }
  }

  // 4. Delete Task via Server API (Non-blocking async)
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

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Delete Task Error]:", err);
    }
  }

  // 5. Save Comment via Server API (Non-blocking async)
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

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Comment Error]:", err);
    }
  }

  // 6. Save Issue via Server API (Non-blocking async)
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

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Issue Error]:", err);
    }
  }

  // 7. Save Time Entry via Server API (Non-blocking async)
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

      this.triggerBroadcast();
    } catch (err) {
      console.error("[Save Time Entry Error]:", err);
    }
  }
}
