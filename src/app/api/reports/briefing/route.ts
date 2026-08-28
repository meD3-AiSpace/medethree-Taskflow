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

    // Truthful Immediate Response when 0 tasks exist (Zero Hallucination Guarantee)
    if (tasksCount === 0) {
      if (lang === "en") {
        return NextResponse.json({
          success: true,
          briefing: {
            achievements: [
              `No tasks or deliverables recorded in this reporting period (${periodLabel}).`,
              `Zero work hours logged in the system for this timeframe.`,
            ],
            risks: [
              "No active blockers or operational clashes reported.",
              "Project progress tracking is currently inactive due to zero registered tasks.",
            ],
            nextSteps: [
              "Click '+ Create Task' to register project milestones and assign team members.",
              "Define clear deadlines and allocate responsibilities across active projects.",
              "Log working hours (Time Log) and attach blueprints/deliverables as work begins.",
            ],
          },
        });
      }

      return NextResponse.json({
        success: true,
        briefing: {
          achievements: [
            `ยังไม่มีรายการงานที่สร้างหรือบันทึกในรอบรายงานนี้ (${periodLabel})`,
            `ยังไม่พบชั่วโมงทำงานที่ถูกบันทึกในระบบสำหรับช่วงเวลานี้`,
          ],
          risks: [
            "ไม่มีรายงานปัญหาติดขัดหรือข้อติดขัดในระบบ",
            "ระบบยังไม่สามารถประเมินอัตราความคืบหน้าได้เนื่องจากยังไม่มีรายการงานในรอบเวลานี้",
          ],
          nextSteps: [
            "กดปุ่ม '+ สร้างงานใหม่' ด้านบน เพื่อเริ่มต้นกำหนดงานและมอบหมายผู้รับผิดชอบ",
            "กำหนดวันส่งมอบงาน (Deadline) และจัดสรรบุคลากรในแต่ละโครงการ",
            "เมื่อเริ่มปฏิบัติงานจริง ให้ทีมงานบันทึกเวลาทำงาน (Time Log) และอัปโหลดแบบเพื่อประเมินผล",
          ],
        },
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY || "";

    if (!geminiKey || geminiKey.startsWith("mock-") || geminiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ success: false, isFallback: true, message: "No server key configured" });
    }

    const prompt =
      lang === "en"
        ? `You are an Executive Project Director at MedTree Design & Build (Architecture & Construction).
STRICT GROUNDING RULE: Analyze ONLY the provided real operational facts. DO NOT invent, hallucinate, or assume any deliverables, meetings, or problems that are not explicitly provided.

Operational Data for Period: "${periodLabel}"
- Total Tasks: ${tasksCount} (Completed: ${completedCount})
- Completed Task Titles: ${completedTitles || "None"}
- Active Blockers: ${blockersList || "None"}
- Total Logged Hours: ${totalHours} hours

Please respond in JSON ONLY (with fluent, professional English) following this exact structure:
{
  "achievements": ["Grounded accomplishment bullet based only on provided tasks and hours"],
  "risks": ["Grounded risk/blocker bullet based only on provided blockers list"],
  "nextSteps": ["Grounded actionable next step related to provided tasks"]
}`
        : `คุณคือผู้เชี่ยวชาญด้านการจัดการสถาปัตยกรรมและการก่อสร้าง (Executive Project Director) ของบริษัท MedTree Design & Build
กฎเหล็กด้านความจริงใจ (Strict Grounding): วิเคราะห์เฉพาะตัวเลข ชื่องาน และปัญหาที่ให้มาจริงเท่านั้น ห้ามแต่งเติมงานสมมุติ ห้ามสร้างการประชุมสมมุติ หรือปัญหาที่ไม่มีอยู่จริงโดยเด็ดขาด

ข้อมูลการดำเนินงานประจำช่วงเวลา: "${periodLabel}"
- งานทั้งหมด: ${tasksCount} งาน (ปิดแล้ว: ${completedCount} งาน)
- รายชื่องานที่ปิดแล้ว: ${completedTitles || "ไม่มี"}
- ปัญหาที่ติดขัดอยู่ (Active Blockers): ${blockersList || "ไม่มีปัญหาติดขัด"}
- ชั่วโมงทำงานรวม: ${totalHours} ชั่วโมง

โปรดสรุปผลการวิเคราะห์ในรูปแบบ JSON ภาษาไทยเท่านั้น โดยมีโครงสร้าง:
{
  "achievements": ["ข้อความสรุปผลงานตามข้อมูลจริง 1-3 ข้อ"],
  "risks": ["ข้อความจุดเสี่ยง/ปัญหาตามข้อมูลจริง 1-2 ข้อ"],
  "nextSteps": ["ข้อเสนอแนะแผนปฏิบัติการที่ตรงกับงานจริง 2-3 ข้อ"]
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
