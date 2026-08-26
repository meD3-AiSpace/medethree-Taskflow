// ====================================================================
// TaskFlow Manager — In-App Notification Provider (Section 3.4 / E7)
// Stores alerts in the Supabase notifications table via Service Role
// ====================================================================

import { INotificationProvider, NotificationPayload } from "./adapter";
import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export class InAppNotificationProvider implements INotificationProvider {
  public name = "in_app";
  private supabase: SupabaseClient | null;

  constructor(supabaseClient?: SupabaseClient | null) {
    this.supabase = supabaseClient || createAdminClient();
  }

  public async send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      console.log(`[In-App Notification Dispatch] To: ${payload.recipientUserId} | ${payload.title}: ${payload.message}`);
      return { success: true };
    }

    try {
      const { error } = await this.supabase.from("notifications").insert({
        user_id: payload.recipientUserId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        read: false,
      });

      if (error) {
        console.warn("[In-App Notification DB Insert Warning]:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg };
    }
  }
}
