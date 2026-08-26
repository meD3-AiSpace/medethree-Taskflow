import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/adapter";
import { LineNotificationProvider } from "@/lib/notifications/line-provider";
import { InAppNotificationProvider } from "@/lib/notifications/inapp-provider";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const service = new NotificationService();
    service.registerProvider(new InAppNotificationProvider());
    service.registerProvider(new LineNotificationProvider());

    const results = await service.dispatch(payload);
    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
