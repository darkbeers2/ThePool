import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge-safe gate: avoid importing `auth` from `@/auth` here because that pulls
 * in `pg` (Node-only) and breaks the Edge middleware bundle.
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  const isAuthed = !!token;
  const { pathname } = req.nextUrl;

  if (!isAuthed && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isAuthed && pathname === "/login") {
    return NextResponse.redirect(new URL("/picks", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/picks", "/all-picks", "/rankings"],
};
