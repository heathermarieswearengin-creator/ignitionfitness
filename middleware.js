import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Smart launch routing for PWA and browser visits.
 * - Logged-in admin → redirect to /admin
 * - Logged-in member → redirect to /sessions (My Sessions)
 * - Guest → show homepage as normal
 *
 * Only applies to the root path "/". Deep links (manage-booking, etc.) pass through.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Only redirect from the root path
  if (pathname !== "/") {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  // Not logged in - show homepage
  if (!user) {
    return NextResponse.next();
  }

  // Admin - redirect to admin dashboard
  if (user.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/overview", req.url));
  }

  // Logged-in member - redirect to My Sessions
  // The homepage already handles this client-side, but this prevents
  // any flash of the marketing homepage for PWA launches
  return NextResponse.redirect(new URL("/sessions", req.url));
});

export const config = {
  // Only run middleware on root path, not on static files or API routes
  matcher: ["/"],
};
