import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
/**
 * Placeholder de autenticação:
 * - Considera autenticado se existir cookie "session".
 * - Ajuste depois para NextAuth/Clerk/Supabase conforme seu setup.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedPaths = ["/analisar", "/dashboard"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();
  const hasSession = Boolean(req.cookies.get("session")?.value);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/analisar/:path*", "/dashboard/:path*"],
};
