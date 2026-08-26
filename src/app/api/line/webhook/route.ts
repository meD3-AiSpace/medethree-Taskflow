import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Read RAW body BEFORE parsing to compute HMAC on raw bytes
    const raw = await req.text();
    const signature = req.headers.get("x-line-signature");
    const channelSecret = process.env.LINE_CHANNEL_SECRET || "";

    if (!signature || !channelSecret) {
      return NextResponse.json({ error: "Missing x-line-signature header or secret not configured" }, { status: 401 });
    }

    // Verify HMAC-SHA256 signature
    const expected = crypto
      .createHmac("sha256", channelSecret)
      .update(raw)
      .digest("base64");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn("[LINE Webhook Security] Invalid signature rejected (401)");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const events = body.events || [];

    for (const event of events) {
      const lineUserId = event.source?.userId;
      console.log(`[LINE Webhook Event] Type: ${event.type} | UserID: ${lineUserId}`);

      if (event.type === "follow") {
        console.log(`[LINE OA] New user followed LINE OA: ${lineUserId}`);
      }

      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text.trim();
        console.log(`[LINE Message] From ${lineUserId}: "${text}"`);
      }
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[LINE Webhook Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "LINE Webhook endpoint is active and protected with HMAC verification" });
}
