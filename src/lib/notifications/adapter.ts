// ====================================================================
// TaskFlow Manager — Notification Adapter Pattern (Section 3.4)
// Allows extensible multi-channel notifications (In-App, LINE OA, Email)
// ====================================================================

import { NotificationType } from "@/lib/types/database.types";

export interface NotificationPayload {
  type: NotificationType;
  recipientUserId: string;
  recipientLineUserId?: string | null;
  taskId?: string;
  taskTitle?: string;
  title: string;
  message: string;
  actionUrl?: string;
  extraMeta?: Record<string, unknown>;
}

export interface INotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }>;
}

export class NotificationService {
  private providers: INotificationProvider[] = [];

  public registerProvider(provider: INotificationProvider) {
    this.providers.push(provider);
  }

  public async dispatch(payload: NotificationPayload): Promise<Array<{ provider: string; success: boolean; error?: string }>> {
    const results = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const res = await provider.send(payload);
          return { provider: provider.name, success: res.success, error: res.error };
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          return { provider: provider.name, success: false, error: errMsg };
        }
      })
    );
    return results;
  }
}
