import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// An hour is long enough to find the email, short enough to limit exposure.
export const RESET_TTL_MS = 60 * 60 * 1000;

/** The token that goes in the email — never stored. */
export function newResetToken() {
  return randomBytes(32).toString("base64url");
}

/** Only this lands in the database. */
export function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, so timing can't be used to probe token values. */
export function tokensMatch(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Where reset links should point. The request's own origin is preferred so
 * links work in local dev and on preview deployments; NEXT_PUBLIC_SITE_URL is
 * the fallback for contexts without a request (e.g. background jobs).
 */
export function siteUrlFrom(request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const origin = new URL(request.url).origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) return origin;
    return configured || origin;
  } catch {
    return configured || "http://localhost:3000";
  }
}
