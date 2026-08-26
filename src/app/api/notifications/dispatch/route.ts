import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/adapter";
import { LineNotificationProvider } from "@/lib/notifications/line-provider";
import { InAppNotificationProvider } from "@/lib/notifications/inapp-provider";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting: 30 requests / min / IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`notif-dispatch:${clientIp}`, 30, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too Many Notification Dispatch Requests. Please slow down.",
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
