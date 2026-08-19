import { NextRequest, NextResponse } from "next/server";

// Gerbang password sederhana untuk area admin/dapur.
// Untuk bisnis yang lebih besar / banyak staf, ganti dengan sistem login
// per-user (mis. NextAuth) supaya ada audit trail siapa ubah status apa.
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const authed = req.cookies.get("kedai_admin")?.value === process.env.ADMIN_PASSWORD;
  if (!authed) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
