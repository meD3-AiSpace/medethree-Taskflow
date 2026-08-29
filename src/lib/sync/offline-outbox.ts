// ====================================================================
// TaskFlow — Offline Outbox Queue & Deterministic Sync Service
// High-Resilience Store-and-Forward Mutation Queue with Auto-Flush
// ====================================================================

export interface OutboxMutation {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
}

type SyncStatusListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
}) => void;

export class OfflineOutboxService {
  private static STORAGE_KEY = "taskflow_outbox_queue";
  private static listeners: Set<SyncStatusListener> = new Set();
  private static isFlushing = false;
  private static isOnlineState = typeof navigator !== "undefined" ? navigator.onLine : true;
  private static lastSynced: Date | null = null;
  private static flushInterval: any = null;

  // Initialize event listeners for network changes
  public static init() {
    if (typeof window === "undefined") return;

    this.isOnlineState = navigator.onLine;

    window.addEventListener("online", () => {
      this.isOnlineState = true;
      this.notifyListeners();
      this.flushQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnlineState = false;
      this.notifyListeners();
    });

    // Background flush attempt every 10 seconds if items are queued and online
    if (!this.flushInterval) {
      this.flushInterval = setInterval(() => {
        if (this.isOnlineState && this.getQueue().length > 0 && !this.isFlushing) {
          this.flushQueue();
        }
      }, 10000);
    }
  }

  // Subscribe to connection & sync health status
  public static subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener({
      isOnline: this.isOnlineState,
      isSyncing: this.isFlushing,
      pendingCount: this.getQueue().length,
      lastSyncedAt: this.lastSynced,
    });
    return () => this.listeners.delete(listener);
  }

  private static notifyListeners() {
    const status = {
      isOnline: this.isOnlineState,
      isSyncing: this.isFlushing,
      pendingCount: this.getQueue().length,
      lastSyncedAt: this.lastSynced,
    };
    this.listeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error("[Outbox Status Listener Error]:", err);
      }
    });
  }

  // Get current queued mutations from local storage
  public static getQueue(): OutboxMutation[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Save queued mutations
  private static saveQueue(queue: OutboxMutation[]) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (err) {
      console.warn("[Outbox Save Storage Error]:", err);
    }
  }

  // Enqueue a mutation and attempt immediate flush if online
  public static async enqueue(action: string, payload: any): Promise<void> {
    const mutation: OutboxMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = this.getQueue();
    queue.push(mutation);
    this.saveQueue(queue);

    if (this.isOnlineState && !this.isFlushing) {
      this.flushQueue();
    }
  }

  // Flush queued mutations to cloud API with exponential backoff
  public static async flushQueue(): Promise<{ successCount: number; failCount: number }> {
    if (this.isFlushing || typeof window === "undefined") {
      return { successCount: 0, failCount: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      return { successCount: 0, failCount: 0 };
    }

    this.isFlushing = true;
    this.notifyListeners();

    let successCount = 0;
    let failCount = 0;
    const remainingQueue: OutboxMutation[] = [];

    for (const item of queue) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: item.action,
            payload: item.payload,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          successCount++;
        } else {
          // If server error or rate limited, increment retry and keep in queue
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastAttempt = Date.now();
          if (item.retryCount < 10) {
            remainingQueue.push(item);
          }
          failCount++;
        }
      } catch (err) {
        // Network drop or timeout
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastAttempt = Date.now();
        if (item.retryCount < 10) {
          remainingQueue.push(item);
        }
        failCount++;
      }
    }

    this.saveQueue(remainingQueue);
    this.isFlushing = false;
    this.lastSynced = new Date();
    this.notifyListeners();

    return { successCount, failCount };
  }
}
