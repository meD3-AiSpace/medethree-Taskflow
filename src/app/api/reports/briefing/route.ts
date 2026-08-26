import { NextRequest, NextResponse } from "next/server";
import { ReportsBriefingSchema, formatZodError } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 10 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`briefing:${clientIp}`, 10, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Briefing Requests. Please wait 1 minute.",
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
    const parseResult = ReportsBriefingSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: formatZodError(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { periodLabel, tasksCount, completedCount, completedTitles, blockersList, totalHours, lang } = parseResult.data;

    const geminiKey = process.env.GEMINI_API_KEY || "";

    if (!geminiKey || geminiKey.startsWith("mock-") || geminiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ success: false, isFallback: true, message: "No server key configured" });
    }

    const prompt =
      lang === "en"
        ? `You are an Executive Project Director at MedTree Design & Build (Architecture & Construction).
Please analyze the operational data for the reporting period: "${periodLabel}"
- Total Tasks: ${tasksCount} (Completed: ${completedCount})
- Completed Task Titles: ${completedTitles || "None"}
- Active Blockers: ${blockersList || "None"}
- Total Logged Hours: ${totalHours} hours

Please respond in JSON ONLY (with fluent, professional English) following this exact structure:
{
  "achievements": ["Key accomplishment bullet 1", "Key accomplishment bullet 2", "Key accomplishment bullet 3"],
  "risks": ["Critical risk/blocker bullet 1", "Critical risk/blocker bullet 2"],
  "nextSteps": ["Strategic actionable next step 1", "Strategic actionable next step 2", "Strategic actionable next step 3"]
}`
        : `คุณคือผู้เชี่ยวชาญด้านการจัดการสถาปัตยกรรมและการก่อสร้าง (Executive Project Director) ของบริษัท MedTree Design & Build
กรุณาวิเคราะห์ข้อมูลการดำเนินงานประจำช่วงเวลา: "${periodLabel}"
- งานทั้งหมด: ${tasksCount} งาน (ปิดแล้ว: ${completedCount} งาน)
- รายชื่องานที่ปิดแล้ว: ${completedTitles || "ไม่มี"}
- ปัญหาที่ติดขัดอยู่ (Active Blockers): ${blockersList || "ไม่มีปัญหาติดขัด"}
- ชั่วโมงทำงานรวม: ${totalHours} ชั่วโมง

โปรดสรุปผลการวิเคราะห์ในรูปแบบ JSON ภาษาไทยเท่านั้น โดยมีโครงสร้าง:
{
  "achievements": ["ข้อความสรุปผลงานเด่น 1-3 ข้อ"],
  "risks": ["ข้อความจุดเสี่ยง/ปัญหาที่ต้องระวัง 1-2 ข้อ"],
  "nextSteps": ["ข้อเสนอแนะแผนปฏิบัติการสัปดาห์ถัดไป 2-3 ข้อ"]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const data = await response.json();
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        if (parsed.achievements && parsed.risks && parsed.nextSteps) {
          return NextResponse.json({ success: true, briefing: parsed });
        }
      }
    }

    return NextResponse.json({ success: false, isFallback: true });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Reports Briefing API Error]:", errMsg);
    return NextResponse.json({ success: false, isFallback: true, error: errMsg });
  }
}
