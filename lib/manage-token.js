import crypto from "crypto";

/**
 * Generate a cryptographically secure random token for manage-booking links.
 * Returns a URL-safe base64 string (32 bytes = 43 chars).
 */
export function generateManageToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Calculate token expiry: 48 hours after the session ends.
 * @param {Date|string} sessionDate - The session date
 * @param {string} startTime - Session start time in HH:MM format
 * @param {number} durationMin - Session duration in minutes (default 60)
 */
export function calculateTokenExpiry(sessionDate, startTime, durationMin = 60) {
  const dateStr = typeof sessionDate === "string"
    ? sessionDate
    : sessionDate.toISOString().slice(0, 10);

  // Parse session end time
  const sessionEnd = new Date(`${dateStr}T${startTime}:00.000Z`);
  sessionEnd.setUTCMinutes(sessionEnd.getUTCMinutes() + durationMin);

  // Add 48 hours after session ends
  sessionEnd.setUTCHours(sessionEnd.getUTCHours() + 48);

  return sessionEnd;
}

/**
 * Build the manage booking URL for a given token.
 */
export function manageBookingUrl(token) {
  const base = process.env.NEXT_PUBLIC_SITE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";
  return `${base}/manage-booking/${token}`;
}
