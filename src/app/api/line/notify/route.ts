import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

interface LineNotifyPayload {
  recipientLineUserIds: string[];
  title: string;
  message: string;
  taskTitle?: string;
  taskId?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  senderName?: string;
  projectName?: string;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 30 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`line-notify:${clientIp}`, 30, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many LINE push requests. Please try again later." },
        { status: 429 }
      );
    }

    const body: LineNotifyPayload = await req.json().catch(() => ({}));
    const {
      recipientLineUserIds = [],
      title,
      message,
      taskTitle,
      taskId,
      priority = "medium",
      senderName,
      projectName,
    } = body;

    // Filter valid line user IDs (must start with U and have length >= 20)
    const validRecipients = (Array.isArray(recipientLineUserIds) ? recipientLineUserIds : [])
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id.startsWith("U") && id.length >= 20);

    if (validRecipients.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "No valid Line User IDs provided to notify.",
      });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token || token.startsWith("mock-") || token === "your-line-channel-access-token") {
      return NextResponse.json(
        { success: false, error: "LINE Channel Access Token not configured on server" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medethree-taskflow.vercel.app";
    const taskLink = taskId ? `${appUrl}/tasks/${taskId}` : `${appUrl}/dashboard`;

    // Determine priority color
    const priorityColor =
      priority === "urgent"
        ? "#e11d48" // Rose red
        : priority === "high"
        ? "#ea580c" // Orange
        : priority === "medium"
        ? "#0284c7" // Sky blue
        : "#10b981"; // Emerald green

    const priorityBadge =
      priority === "urgent"
        ? "🚨 ด่วนที่สุด / URGENT"
        : priority === "high"
        ? "⚠️ ความสำคัญสูง / HIGH"
        : priority === "medium"
        ? "📌 ปานกลาง / MEDIUM"
        : "ℹ️ ทั่วไป / LOW";

    // Construct Rich Flex Message
    const flexMessage = {
      type: "flex",
      altText: `[Lighthouse] ${title || "แจ้งเตือนงาน"}: ${message || ""}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f8fafc",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "🏰 LIGHTHOUSE TASKFLOW",
                  weight: "bold",
                  color: "#059669",
                  size: "xxs",
                },
                {
                  type: "text",
                  text: priorityBadge,
                  weight: "bold",
                  color: priorityColor,
                  size: "xxs",
                  align: "end",
                },
              ],
            },
            {
              type: "text",
              text: title || "แจ้งเตือนงานจากระบบ",
              weight: "bold",
              size: "md",
              margin: "sm",
              wrap: true,
              color: "#0f172a",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: message || "-",
              size: "sm",
              color: "#334155",
              wrap: true,
            },
            ...(taskTitle
              ? [
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    paddingAll: "md",
                    backgroundColor: "#f1f5f9",
                    cornerRadius: "md",
                    contents: [
                      {
                        type: "text",
                        text: "📋 ชื่องาน / Task:",
                        size: "xxs",
                        color: "#64748b",
                        weight: "bold",
                      },
                      {
                        type: "text",
                        text: taskTitle,
                        size: "xs",
                        color: "#0f172a",
                        weight: "bold",
                        wrap: true,
                        margin: "xs",
                      },
                      ...(projectName
                        ? [
                            {
                              type: "text",
                              text: `🏗️ โครงการ: ${projectName}`,
                              size: "xxs",
                              color: "#475569",
                              margin: "xs",
                            },
                          ]
                        : []),
                      ...(senderName
                        ? [
                            {
                              type: "text",
                              text: `👤 ผู้ส่ง/ผู้รับผิดชอบ: ${senderName}`,
                              size: "xxs",
                              color: "#475569",
                              margin: "xs",
                            },
                          ]
                        : []),
                    ],
                  },
                ]
              : []),
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "uri",
                label: "🔍 เปิดดูรายละเอียดงาน",
                uri: taskLink,
              },
              color: "#059669",
            },
            {
              type: "text",
              text: "ระบบบริหารติดตามงาน • บ้านสวยแลนด์แอนด์เฮ้าส์",
              size: "xxs",
              color: "#94a3b8",
              align: "center",
              margin: "sm",
            },
          ],
        },
      },
    };

    // Send push to each valid recipient simultaneously
    const results = await Promise.allSettled(
      validRecipients.map(async (lineUserId) => {
        const res = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: lineUserId,
            messages: [flexMessage],
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `LINE API error ${res.status}`);
        }
        return { lineUserId, success: true };
      })
    );

    const successfulCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      totalRecipients: validRecipients.length,
      sentCount: successfulCount,
      failureCount,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[LINE Multi-Notify Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
