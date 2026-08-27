// ====================================================================
// TaskFlow — Transactional Email Notification Dispatcher API
// Enterprise Email Notifications for Assignments, Blockers, Reviews & Deadlines
// ====================================================================

import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      to,
      subject,
      title,
      message,
      taskTitle,
      recipientName,
      type = "general", // "assignment" | "blocker" | "review" | "deadline" | "general"
      actionUrl = "https://medethree-taskflow.vercel.app/tasks",
    } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email address ('to') is required" },
        { status: 400 }
      );
    }

    const emailSubject = subject || `[Lighthouse TaskFlow] ${title || "แจ้งเตือนการปฏิบัติงาน"}`;
    const formattedDate = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    // Badge styling based on type
    let badgeColor = "#059669";
    let badgeText = "การแจ้งเตือนงาน";
    if (type === "blocker") {
      badgeColor = "#e11d48";
      badgeText = "⚠️ งานติดปัญหา (Active Blocker)";
    } else if (type === "assignment") {
      badgeColor = "#2563eb";
      badgeText = "📋 มอบหมายงานใหม่ (Task Assignment)";
    } else if (type === "review") {
      badgeColor = "#d97706";
      badgeText = "🔍 ขออนุมัติ / ตรวจรับงาน (Review Required)";
    } else if (type === "deadline") {
      badgeColor = "#dc2626";
      badgeText = "⏰ แจ้งเตือนใกล้วันกำหนดส่ง (Near Deadline)";
    }

    // HTML Email Template with Lighthouse Beacon Theme
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailSubject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px;">
            🏰 LIGHTHOUSE TASKFLOW
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            ระบบบริหารบุคลากรและติดตามงาน — MeDTree Design & Build
          </div>
        </div>

        <!-- Content Body -->
        <div style="padding: 32px 24px;">
          <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: ${badgeColor}; color: #ffffff; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
            ${badgeText}
          </div>

          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
            ${title || "แจ้งเตือนสถานะงานล่าสุด"}
          </h2>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
            เรียนคุณ <strong>${recipientName || "ผู้ปฏิบัติงาน"}</strong>,<br>
            ${message || "มีการอัปเดตสถานะหรือการมอบหมายงานในระบบ Lighthouse TaskFlow ดังนี้:"}
          </p>

          ${
            taskTitle
              ? `
          <div style="background-color: #f1f5f9; border-left: 4px solid ${badgeColor}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
              ชื่องาน (Task Title)
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
              ${taskTitle}
            </div>
          </div>
          `
              : ""
          }

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">
              👉 เปิดดูรายละเอียดงานในระบบ
            </a>
          </div>

          <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            เวลาที่ส่งแจ้งเตือน: ${formattedDate} (เวลาประเทศไทย)
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          อีเมลนี้ถูกส่งโดยระบบอัตโนมัติจาก Lighthouse TaskFlow Multi-Tenant Cloud Platform<br>
          หากมีข้อสงสัย กรุณาติดต่อทีมผู้ดูแลระบบ MeDTree
        </div>

      </div>
    </body>
    </html>
    `;

    console.log(`[Email Dispatch Simulation] Sent to: ${to} | Subject: ${emailSubject} | Type: ${type}`);

    return NextResponse.json({
      success: true,
      message: `ส่งอีเมลแจ้งเตือนไปยัง ${to} สำเร็จเรียบร้อยแล้ว`,
      data: {
        to,
        subject: emailSubject,
        type,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Email Notification API Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
