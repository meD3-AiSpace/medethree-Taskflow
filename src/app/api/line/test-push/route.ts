import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LINE_ACCESS_TOKEN =
  "8OBUXdfTk10sKwL/o1KvCTbx0C4TbUA/q+q2/Fb9jniS8AQCKmO/jUvxioGUflsM2iLIDricYT5Qt7H8EfjrUbiLncPUXbueDD0rjnjGu8xuiJ01r0w55V0SBHdaogsMTivcHwHxw71UmjhXjFIVHAdB04t89/1O/w1cDnyilFU=";
const DEFAULT_LINE_USER_ID = "Ud03173af920035ad7d808a0feb10327d";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lineUserId = body.lineUserId || body.userId || DEFAULT_LINE_USER_ID;
    const title = body.title || body.customTitle || "แจ้งเตือนจากระบบติดตามงาน TaskFlow";
    const message = body.message || body.customDesc || "มีการอัปเดตสถานะงานในระบบ";
    const { taskTitle, taskId } = body;
    const token = body.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || DEFAULT_LINE_ACCESS_TOKEN;

    if (!lineUserId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ LINE User ID (ขึ้นต้นด้วย U...)" },
        { status: 400 }
      );
    }

    if (!token || token.startsWith("mock-") || token === "your-line-channel-access-token") {
      return NextResponse.json(
        {
          success: false,
          error: "ยังไม่ได้ระบุ LINE Channel Access Token ที่ถูกต้อง",
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
      altText: `[TaskFlow] ${title || "แจ้งเตือนงาน"}: ${message || ""}`,
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
          contents: [
            {
              type: "text",
              text: message || "มีการแจ้งเตือนจากระบบติดตามงาน TaskFlow",
              wrap: true,
              size: "sm",
              color: "#374151",
            },
            ...(taskTitle
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
                        text: `ชื่องาน: ${taskTitle}`,
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

    // Call LINE Messaging API
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
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

    if (!response.ok) {
      const errorData = await response.json().catch(async () => ({ message: await response.text() }));
      console.error("[LINE Push API Error]:", errorData);
      
      let errorExplanation = "ส่งข้อความไม่สำเร็จจาก LINE API";
      if (response.status === 401) {
        errorExplanation = "Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401 Unauthorized)";
      } else if (response.status === 400) {
        errorExplanation = `LINE User ID ไม่ถูกต้อง หรือผู้ใช้ยังไม่ได้กด 'เพิ่มเพื่อน' กับ LINE Official Account นี้ (${JSON.stringify(errorData.details || errorData.message)})`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorExplanation,
          rawError: errorData,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `ส่งข้อความแจ้งเตือนไปยัง LINE User ID: ${lineUserId} สำเร็จเรียบร้อย!`,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[LINE Push Server Exception]:", errMsg);
    return NextResponse.json(
      { success: false, error: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${errMsg}` },
      { status: 500 }
    );
  }
}
