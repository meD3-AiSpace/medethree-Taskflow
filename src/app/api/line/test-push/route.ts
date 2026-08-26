import { NextRequest, NextResponse } from "next/server";
import { LineTestPushSchema, formatZodError } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

const DEFAULT_LINE_USER_ID = "Ud03173af920035ad7d808a0feb10327d";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 5 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`line-push:${clientIp}`, 5, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Push Requests. Please wait 1 minute before sending another test push.",
          retryAfter: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    // 2. Zod Validation
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = LineTestPushSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: formatZodError(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { lineUserId, title, message, taskTitle, taskId } = parseResult.data;

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!token || token.startsWith("mock-") || token === "your-line-channel-access-token") {
      return NextResponse.json(
        {
          success: false,
          error: "ยังไม่ได้ระบุ LINE Channel Access Token ใน .env.local ของเซิร์ฟเวอร์",
          isMissingToken: true,
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const taskLink = taskId ? `${appUrl}/tasks/${taskId}` : `${appUrl}/dashboard`;

    // Construct LINE Flex Message
    const flexMessage = {
      type: "flex",
      altText: `[Lighthouse] ${title || "แจ้งเตือนงาน"}: ${message || ""}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Lighthouse TaskFlow",
              weight: "bold",
              color: "#059669",
              size: "xs",
            },
            {
              type: "text",
              text: title || "แจ้งเตือนงานจากระบบ",
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
                    paddingAll: "sm",
                    backgroundColor: "#f1f5f9",
                    cornerRadius: "md",
                    contents: [
                      {
                        type: "text",
                        text: `ชื่องาน: ${taskTitle}`,
                        size: "xs",
                        color: "#0f172a",
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

    // Send real push notification via LINE Official Messaging API Gateway
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({
        to: lineUserId.trim(),
        messages: [flexMessage],
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[LINE Push API Error]:", responseData);
      return NextResponse.json(
        {
          success: false,
          error: responseData.message || `LINE API Error (${response.status})`,
          details: responseData.details,
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `ส่งการแจ้งเตือนเข้า LINE OA สำเร็จ (User ID: ${lineUserId})`,
      targetUserId: lineUserId,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[LINE Push Handler Exception]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
