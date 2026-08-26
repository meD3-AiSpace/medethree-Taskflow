import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (!authData?.user || authError) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const authUser = authData.user;

    // Fetch user profile from database
    const { data: profile } = await supabase
      .from("users")
      .select("id, org_id, full_name, email, role, team_id, line_user_id")
      .eq("id", authUser.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        orgId: profile?.org_id || "org-medtree-default",
        fullName: profile?.full_name || authUser.email,
        role: profile?.role || "member",
        teamId: profile?.team_id || null,
        lineUserId: profile?.line_user_id || null,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ authenticated: false, error: errMsg }, { status: 500 });
  }
}
