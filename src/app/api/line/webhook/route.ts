import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      const lineUserId = event.source?.userId;
      console.log(`[LINE Webhook Event] Type: ${event.type} | UserID: ${lineUserId}`);

      // Handle follow or message event (e.g. user sends registration link or token)
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
  return NextResponse.json({ status: "LINE Webhook endpoint is active" });
}
