import { NextRequest, NextResponse } from "next/server";
import { TranslateSchema, formatZodError } from "@/lib/validation/schemas";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

function polishArchitecturalEnglish(text: string): string {
  if (!text) return "";
  let polished = text;

  const replacements: [RegExp, string][] = [
    [/shortening of (the )?building/gi, "building setback distance"],
    [/drilling (a )?beam/gi, "beam penetration / drilling"],
    [/plasterball/gi, "concrete cylinder specimen"],
    [/inquire to/gi, "Contacted / Consulted with"],
  ];

  for (const [pattern, replacement] of replacements) {
    polished = polished.replace(pattern, replacement);
  }

  return polished;
}

async function translateViaMyMemory(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=th|en`,
      {
        headers: { "User-Agent": "LighthouseTaskflow/2.1" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const rawText = data.responseData?.translatedText;
      if (rawText && rawText.trim() && rawText.trim() !== text.trim()) {
        return polishArchitecturalEnglish(rawText);
      }
    }
  } catch (err) {
    console.warn("[MyMemory Engine Error]:", err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 20 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`translate:${clientIp}`, 20, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Requests. Please wait before translating again.",
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

    // 2. Zod Input Validation
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = TranslateSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: formatZodError(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { text } = parseResult.data;

    // Fast path: if input is already English, return immediately
    if (/^[A-Za-z0-9\s.,!?'"()_/:;@#$%&*-]+$/.test(text.trim())) {
      return NextResponse.json({
        success: true,
        translatedText: text.trim(),
      });
    }

    // Engine 1: Google Gemini API (if key is valid and available)
    const geminiKey = process.env.GEMINI_API_KEY || "";
    if (geminiKey && !geminiKey.startsWith("mock-") && geminiKey !== "your_gemini_api_key_here") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const promptPayload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Translate Thai into professional architectural/engineering English. Return ONLY the translation, no options, no conversational filler:\n\nThai: "${text.trim()}"\nEnglish:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
          },
        };

        const response = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(promptPayload),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (response.ok) {
          const data = await response.json();
          let candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (candidateText.startsWith('"') && candidateText.endsWith('"')) {
            candidateText = candidateText.slice(1, -1).trim();
          }
          if (candidateText && candidateText !== text.trim()) {
            return NextResponse.json({
              success: true,
              translatedText: polishArchitecturalEnglish(candidateText),
              engine: "gemini",
            });
          }
        }
      } catch (geminiErr) {
        console.warn("[Gemini Engine Fallback Triggered]:", geminiErr);
      }
    }

    // Engine 2: Universal High-Speed Translation API (MyMemory)
    const memoryTranslation = await translateViaMyMemory(text);
    if (memoryTranslation) {
      return NextResponse.json({
        success: true,
        translatedText: memoryTranslation,
        engine: "mymemory",
      });
    }

    // Engine 3: Architectural Domain Dictionary Fallback
    const fallbackTranslation = intelligentFallbackTranslate(text);
    return NextResponse.json({
      success: true,
      translatedText: fallbackTranslation,
      isFallback: true,
    });
  } catch (err: unknown) {
    console.error("[Translation Handler Error]:", err);
    return NextResponse.json({
      success: true,
      translatedText: intelligentFallbackTranslate(""),
      isFallback: true,
    });
  }
}

// Architectural Domain Dictionary Fallback
function intelligentFallbackTranslate(thai: string): string {
  if (!thai || !thai.trim()) return "";

  const dictionary: Record<string, string> = {
    "เตรียมแบบขออนุญาต อ.1": "Prepare Form A.1 Permit Submission Set",
    "แบบแปลนชั้น 1": "1st Floor Architectural Floor Plan",
    "แบบแปลนชั้น 2": "2nd Floor Architectural Floor Plan",
    "แบบสถาปัตยกรรม": "Architectural Drawing Set",
    "แบบวิศวกรรมโครงสร้าง": "Structural Engineering Drawing Set",
    "แบบวิศวกรรมสุขาภิบาล": "Sanitary & Plumbing Drawing Set",
    "แบบวิศวกรรมไฟฟ้า": "Electrical Engineering Drawing Set",
    "ท่อสุขาภิบาลชนคาน": "Sanitary pipe clashing with structural beam",
    "ระยะร่นไม่พอด้านข้าง": "Side building setback insufficient (minimum 2.00m required)",
    "เสาเข็มเจาะ": "Bored pile foundation",
    "เทคอนกรีตฐานราก": "Foundation concrete pouring inspection",
    "ตรวจรับงาน": "Deliverable QA/QC inspection",
    "อนุมัติแล้ว": "Approved & Permitted",
  };

  for (const [key, value] of Object.entries(dictionary)) {
    if (thai.includes(key)) {
      return value;
    }
  }

  return thai;
}
