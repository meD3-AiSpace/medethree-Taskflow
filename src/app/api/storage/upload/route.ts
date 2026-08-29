// ====================================================================
// TaskFlow — Media Upload API Route Handler
// Secure Direct Upload to Supabase Storage Bucket with CDN URL
// ====================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting: 60 uploads / min / IP
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`upload:${clientIp}`, 60, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Upload rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = (formData.get("taskId") as string) || "general";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    let supabase = null;
    try {
      supabase = createAdminClient();
    } catch {
      try {
        supabase = createServerClient();
      } catch {
        return NextResponse.json(
          { success: false, error: "Database/Storage client not configured" },
          { status: 500 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const bucketName = "task-attachments";
    const filePath = `${taskId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.warn("[Supabase Storage Upload Warning]:", uploadError.message);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Retrieve CDN public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    const fileUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      fileUrl,
      thumbnailUrl: fileUrl,
      path: uploadData.path,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Storage Upload Handler Error]:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
