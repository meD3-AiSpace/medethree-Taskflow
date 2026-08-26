// ====================================================================
// TaskFlow Manager — In-App Notification Provider (Section 3.4)
// Stores alerts in the Supabase notifications table
// ====================================================================

import { INotificationProvider, NotificationPayload } from "./adapter";
import { SupabaseClient } from "@supabase/supabase-js";

export class InAppNotificationProvider implements INotificationProvider {
  public name = "in_app";
  private supabase: SupabaseClient | null;

  constructor(supabaseClient?: SupabaseClient | null) {
    this.supabase = supabaseClient || null;
  }

  public async send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      console.log(`[In-App Notification Mock] To: ${payload.recipientUserId} | ${payload.title}: ${payload.message}`);
      return { success: true };
    }

    try {
      const { error } = await this.supabase.from("notifications").insert({
        user_id: payload.recipientUserId,
        task_id: payload.taskId || null,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        is_read: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg };
    }
  }
}
