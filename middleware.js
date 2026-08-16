import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Smart launch routing for PWA and browser visits.
 * - Logged-in admin → redirect to /admin/overview
 * - Logged-in member → redirect to /sessions (My Sessions)
 * - Guest → show homepage as normal
 *
 * Only applies to the root path "/". Deep links (manage-booking, etc.) pass through.
 *
 * This is a lightweight Edge-compatible middleware that decodes the JWT directly
 * instead of importing the full auth configuration (which would include bcrypt/Prisma).
 */

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

async function getTokenFromRequest(req) {
  // Next-Auth v5 stores the session token in a cookie
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = req.cookies.get(cookieName)?.value;
  if (!token || !AUTH_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only redirect from the root path
  if (pathname !== "/") {
    return NextResponse.next();
  }

  const token = await getTokenFromRequest(req);

  // Not logged in - show homepage
  if (!token) {
    return NextResponse.next();
  }

  // Admin - redirect to admin dashboard
  if (token.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/overview", req.url));
  }

  // Logged-in member - redirect to My Sessions
  // The homepage already handles this client-side, but this prevents
  // any flash of the marketing homepage for PWA launches
  return NextResponse.redirect(new URL("/sessions", req.url));
}

export const config = {
  // Only run middleware on root path, not on static files or API routes
  matcher: ["/"],
};
