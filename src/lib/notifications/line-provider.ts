// ====================================================================
// TaskFlow Manager — LINE Messaging API Push Provider (Section 3.4)
// Pushes rich task alerts directly to user's LINE via LINE OA
// ====================================================================

import { INotificationProvider, NotificationPayload } from "./adapter";

export class LineNotificationProvider implements INotificationProvider {
  public name = "line_messaging_api";
  private channelAccessToken: string;

  constructor(channelAccessToken?: string) {
    this.channelAccessToken = channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  }

  public async send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    const lineUserId = payload.recipientLineUserId;

    if (!lineUserId) {
      // User has not linked LINE account yet
      return { success: false, error: "User has no linked line_user_id" };
    }

    if (!this.channelAccessToken || this.channelAccessToken.startsWith("mock-")) {
      console.log(`[LINE Mock Push] To: ${lineUserId} | ${payload.title}: ${payload.message}`);
      return { success: true };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const taskLink = payload.taskId ? `${appUrl}/tasks/${payload.taskId}` : `${appUrl}/dashboard`;

    // Construct LINE Flex Message
    const flexMessage = {
      type: "flex",
      altText: `[TaskFlow] ${payload.title}: ${payload.message}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "TaskFlow Manager",
              weight: "bold",
              color: "#059669",
              size: "xs",
            },
            {
              type: "text",
              text: payload.title,
              weight: "bold",
              size: "md",
              margin: "sm",
              wrap: true,
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: payload.message,
              wrap: true,
              size: "sm",
              color: "#374151",
            },
            ...(payload.taskTitle
              ? [
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    paddingAll: "md",
                    backgroundColor: "#F3F4F6",
                    cornerRadius: "md",
                    contents: [
                      {
                        type: "text",
                        text: `ชื่องาน: ${payload.taskTitle}`,
                        size: "xs",
                        color: "#1F2937",
                        weight: "bold",
                        wrap: true,
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#059669",
              height: "sm",
              action: {
                type: "uri",
                label: "เปิดดูงานในระบบ",
                uri: taskLink,
              },
            },
          ],
        },
      },
    };

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [flexMessage],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[LINE Push Error]:", errText);
        return { success: false, error: errText };
      }

      return { success: true };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[LINE Push Exception]:", errMsg);
      return { success: false, error: errMsg };
    }
  }
}
