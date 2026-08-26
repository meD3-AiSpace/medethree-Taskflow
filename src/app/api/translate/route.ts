import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, context = "architecture_construction", apiKey } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ success: true, translatedText: "" });
    }

    const geminiKey =
      apiKey?.trim() ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    const domainSystemInstruction = `You are a professional architectural, civil engineering, and construction management translator.
Translate Thai text into crisp, professional, industry-standard English used in architectural firms, site construction, and municipal permit offices.

Terminology Guidelines:
- "ท่อสุขาภิบาลชนคาน" -> "Sanitary pipe clashing with structural beam"
- "ระยะร่น" -> "Building setback distance"
- "แบบแปลน" -> "Architectural floor plan"
- "ใบอนุญาตก่อสร้าง อ.1" -> "Building Construction Permit (Form A.1)"
- "เรนเดอร์ภาพ" -> "3D Perspective rendering"
- "หมุดที่ดิน" -> "Property boundary marker"
- "งานระบบ" -> "MEP systems (Mechanical, Electrical, Plumbing)"
- "ตรวจรับงาน" -> "Review and approve deliverables"
- "เทปูนฐานราก" -> "Foundation concrete pouring"
- "หลุมเสาเข็ม" -> "Pile cap excavation"

Strict Output Rules:
1. Return ONLY the single best translated English text.
2. DO NOT return multiple options, bullet points, explanations, prefixes, conversational filler, or markdown quotes.
3. Preserve exact numbers, units, and codes (e.g. A.1, EIA, 4K, 15cm).
4. If the input is already in English, return it unchanged.`;

    if (!geminiKey || geminiKey.startsWith("mock-")) {
      const fallbackTranslation = intelligentFallbackTranslate(text);
      return NextResponse.json({
        success: true,
        translatedText: fallbackTranslation,
        isFallback: true,
        message: "Translated via Built-in Architectural Dictionary",
      });
    }

    // Call Google Gemini API (gemini-2.5-flash / gemini-flash-latest)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const promptPayload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${domainSystemInstruction}\n\nThai text to translate to English:\n"${text.trim()}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(promptPayload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[Gemini API Translation Error]:", errBody);
      const fallbackTranslation = intelligentFallbackTranslate(text);
      return NextResponse.json({
        success: true,
        translatedText: fallbackTranslation,
        isFallback: true,
        error: `Gemini API error (${response.status}): ${errBody}`,
      });
    }

    const data = await response.json();
    let translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    // Clean any leading/trailing quotes or markdown code blocks
    translated = translated.replace(/^["'`]|["'`]$/g, "").replace(/^```json|^```|```$/g, "").trim();

    return NextResponse.json({
      success: true,
      translatedText: translated || text,
      isAI: true,
      model: "gemini-2.5-flash",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Translation Endpoint Exception]:", errMsg);
    return NextResponse.json(
      {
        success: false,
        error: errMsg,
        translatedText: "",
      },
      { status: 500 }
    );
  }
}

// Construction & Architecture Dictionary Fallback Helper
function intelligentFallbackTranslate(input: string): string {
  if (!input) return "";

  const dictionary: Record<string, string> = {
    "ออกแบบแปลนชั้น 1 และบันไดหลัก The Forest Villa": "Design 1st Floor Plan and Main Staircase for The Forest Villa",
    "ออกแบบ Schematic Design แปลนชั้นล่างเชื่อมต่อสระว่ายน้ำ และระบุระดับบันได": "Schematic Design of ground floor plan connecting to pool and staircase level specs",
    "แก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบสุขาภิบาล": "Revise 3rd floor structural plan due to sanitary pipe clash",
    "ท่อสุขาภิบาลชนคานโครงสร้างหลัก ต้องปรับระดับฝ้าเพดานหรือเบี่ยงท่องานระบบ": "Sanitary pipe clashing with main beam; requires ceiling adjustment or pipe offset",
    "ยื่นขอใบอนุญาตก่อสร้าง อ.1 (คอนโดมิเนียมสุขุมวิท 49)": "Submit Building Construction Permit A.1 (Sukhumvit 49 Condominium)",
    "ยื่นเอกสารแบบขออนุญาตก่อสร้างอาคารชุด ณ สำนักงานเขตวัฒนา กรุงเทพฯ": "Submit condo construction permit application at Watthana District Office, Bangkok",
    "ส่งแบบ 3D Perspective ห้อง Master Bedroom": "Submit 3D Perspective Rendering for Master Bedroom",
    "เรนเดอร์ภาพ Perspective ความละเอียดสูง 4K ส่งให้ Supervisor ตรวจรับ": "Render 4K high-res perspective perspective submitted for supervisor review",
    "สำรวจพื้นที่หน้างานจริงและตรวจระดับหมุดที่ดิน": "Site survey and land boundary marker verification",
    "เช็คค่าระดับถนนเทียบกับระดับพื้นโครงการ The Forest Villa": "Check road elevation level against The Forest Villa project finished floor level",
    "จัดเตรียมเอกสารรายงานผลกระทบสิ่งแวดล้อม (EIA)": "Prepare Environmental Impact Assessment (EIA) Report",
    "รวบรวมเล่มเอกสารและรายงานการศึกษาผลกระทบสิ่งแวดล้อม": "Compile Environmental Impact Assessment documentation and study reports",
    "คานคอนกรีตระดับ +3.20m ชนแนวท่อระบายน้ำหลัก ไม่สามารถวางท่อลาดเอียง 1:100 ได้": "Concrete beam at +3.20m clashes with main drainage pipe; cannot maintain 1:100 slope",
    "เจ้าหน้าที่เขตแจ้งว่าระยะร่นด้านข้างอาคารฝั่งทิศตะวันออกขาดไป 15 cm ตามข้อบัญญัติ กทม.": "District officer noted east side setback lacks 15cm under BMA building ordinance",
    "พบหมุดหลักเขตที่ดินฝั่งทิศใต้ถูกถมดินทับมองไม่เห็น": "South boundary marker covered by soil fill and obscured",
    "ประสานงานเจ้าหน้าที่รังวัดที่ดินใช้เครื่องมือค้นหาและปักหมุดชั่วคราวแล้ว": "Coordinated with land survey officer to locate and place temporary boundary marker",
    "กำลังจัดวางบันไดแบบ Double Flight เชื่อมกับโถงต้อนรับครับ": "Currently laying out double flight staircase connecting to reception foyer",
    "แนบภาพเรนเดอร์ perspective 4k มุมมองหลักและ Walk-in closet เรียบร้อยแล้วครับ รบกวนตรวจรับครับ": "Attached 4K perspective renderings for main view and walk-in closet for review",
    "ใบอนุญาตก่อสร้าง (อ.1)": "Building Construction Permit (Form A.1)",
    "ใบอนุญาตดัดแปลงอาคาร": "Building Alteration / Renovation Permit",
    "รายงานผลกระทบสิ่งแวดล้อม (EIA)": "Environmental Impact Assessment (EIA)",
    "ใบรับรองการก่อสร้าง (อ.6)": "Building Occupancy Certificate (Form A.6)",
    "ขอเชื่อมทางสาธารณะ": "Public Right-of-Way Connection Request",
    "สำนักงานเขตวัฒนา กรุงเทพฯ": "Watthana District Office, Bangkok",
    "สำนักงานนโยบายและแผนทรัพยากรธรรมชาติและสิ่งแวดล้อม (สผ.)": "Office of Natural Resources and Environmental Policy and Planning (ONEP)",
    "สำนักงานเขต / เทศบาล": "District Office / Municipality",
  };

  if (dictionary[input.trim()]) {
    return dictionary[input.trim()];
  }

  let result = input;
  result = result.replace(/โครงการบ้านเดี่ยว/g, "Single-Detached House Project");
  result = result.replace(/โครงการคอนโดมิเนียม/g, "Condominium Project");
  result = result.replace(/แปลนชั้น (\d+)/g, "Floor $1 Plan");
  result = result.replace(/ใบอนุญาต/g, "Permit");
  result = result.replace(/แบบสถาปัตย์/g, "Architectural drawing");
  result = result.replace(/โครงสร้าง/g, "Structural");
  result = result.replace(/งานระบบ/g, "MEP systems");
  result = result.replace(/สุขาภิบาล/g, "Sanitary");
  result = result.replace(/สำนักงานเขต/g, "District Office");
  result = result.replace(/ติดปัญหา/g, "Facing blocker issue");
  result = result.replace(/แก้ไขแล้ว/g, "Resolved");

  return result;
}
