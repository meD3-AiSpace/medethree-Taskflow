import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Pass through immediately — no auth blocking
  // This app uses server-side /api/sync for all Supabase operations
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
