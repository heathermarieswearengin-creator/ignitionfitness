/**
 * Bot and abuse protection utilities.
 * Self-contained, no external CAPTCHA services required.
 */

// ============================================================================
// RATE LIMITING
// In-memory rate limiter for serverless. Each function instance has its own
// memory, so this isn't perfect, but it stops casual abuse effectively.
// ============================================================================

const rateLimiters = new Map();

/**
 * Simple in-memory rate limiter.
 * @param {string} key - Unique key for this limit (e.g., "contact", "signup")
 * @param {string} identifier - Client identifier (usually IP)
 * @param {number} maxAttempts - Max attempts allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(key, identifier, maxAttempts, windowMs) {
  const limiterKey = `${key}:${identifier}`;
  const now = Date.now();

  let record = rateLimiters.get(limiterKey);

  // Clean up or create new record
  if (!record || now - record.windowStart > windowMs) {
    record = { windowStart: now, count: 0 };
    rateLimiters.set(limiterKey, record);
  }

  // Check if over limit
  if (record.count >= maxAttempts) {
    const resetIn = Math.ceil((record.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  // Increment and allow
  record.count++;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetIn: Math.ceil((record.windowStart + windowMs - now) / 1000),
  };
}

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    for (const [key, record] of rateLimiters.entries()) {
      if (now - record.windowStart > maxAge) {
        rateLimiters.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// Rate limit presets
export const RATE_LIMITS = {
  // Auth-related: 10 attempts per 15 minutes
  signup: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
  login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
  passwordReset: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  // Form submissions: 5 per hour
  contact: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  guestBooking: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
};

/**
 * Get client IP from request headers (Vercel/Cloudflare compatible)
 */
export function getClientIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// ============================================================================
// HONEYPOT VALIDATION
// Bots tend to fill all visible fields. We add a hidden field that should
// remain empty. If it has a value, it's likely a bot.
// ============================================================================

/**
 * Check if honeypot field was filled (indicates bot)
 * @param {string|null|undefined} honeypotValue - Value of the honeypot field
 * @returns {boolean} - True if submission appears to be from a bot
 */
export function isHoneypotFilled(honeypotValue) {
  return honeypotValue !== null && honeypotValue !== undefined && honeypotValue !== "";
}

// ============================================================================
// TIMING VALIDATION
// Real humans take time to read and fill forms. Bots submit instantly.
// We embed a timestamp and reject submissions that are too fast.
// ============================================================================

const TIMING_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "timing-secret";
const MIN_FORM_TIME_MS = 2500; // 2.5 seconds minimum

/**
 * Generate a timing token (embed in form on load)
 * Simple obfuscated timestamp - not cryptographically secure, but sufficient
 * for bot detection since bots would need to know the obfuscation scheme.
 */
export function generateTimingToken() {
  const timestamp = Date.now();
  // Simple obfuscation: XOR with a portion of the secret, then base64
  const secretNum = TIMING_SECRET.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const obfuscated = timestamp ^ secretNum;
  return Buffer.from(`${obfuscated}.${timestamp % 1000}`).toString("base64");
}

/**
 * Validate timing token and check if form was filled too quickly
 * @param {string} token - The timing token from the form
 * @returns {{ valid: boolean, tooFast: boolean, elapsedMs: number }}
 */
export function validateTimingToken(token) {
  if (!token) {
    return { valid: false, tooFast: true, elapsedMs: 0 };
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [obfuscatedStr, checkStr] = decoded.split(".");
    const obfuscated = parseInt(obfuscatedStr, 10);
    const secretNum = TIMING_SECRET.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const timestamp = obfuscated ^ secretNum;

    // Sanity check: timestamp should be within last hour
    const now = Date.now();
    if (timestamp > now || now - timestamp > 60 * 60 * 1000) {
      return { valid: false, tooFast: true, elapsedMs: 0 };
    }

    const elapsedMs = now - timestamp;
    return {
      valid: true,
      tooFast: elapsedMs < MIN_FORM_TIME_MS,
      elapsedMs,
    };
  } catch {
    return { valid: false, tooFast: true, elapsedMs: 0 };
  }
}

// ============================================================================
// DISPOSABLE EMAIL DETECTION
// Block signups from well-known disposable/temporary email providers.
// ============================================================================

// Common disposable email domains (extensible list)
const DISPOSABLE_DOMAINS = new Set([
  // Popular disposable email services
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.org",
  "guerrillamail.net",
  "guerrillamail.biz",
  "guerrillamail.de",
  "sharklasers.com",
  "grr.la",
  "guerrillamailblock.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.net",
  "throwaway.email",
  "throwawaymail.com",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minmail.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "getnada.com",
  "getairmail.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailnesia.com",
  "mailsac.com",
  "mohmal.com",
  "mytrashmail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "dispostable.com",
  "disposableemailaddresses.com",
  "spamgourmet.com",
  "spamex.com",
  "spam4.me",
  "mintemail.com",
  "emailondeck.com",
  "emailfake.com",
  "fakemail.net",
  "mailforspam.com",
  "tempinbox.com",
  "tempr.email",
  "discard.email",
  "discardmail.com",
  "dropmail.me",
  "emaildrop.io",
  "inboxalias.com",
  "jetable.org",
  "kasmail.com",
  "mailexpire.com",
  "mailnull.com",
  "meltmail.com",
  "nowmymail.com",
  "spamfree24.org",
  "spaml.com",
  "tempmailaddress.com",
  "tmpmail.org",
  "tmpmail.net",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "anonymbox.com",
  "antispam.de",
  "binkmail.com",
  "bobmail.info",
  "bofthew.com",
  "bugmenot.com",
  "bumpymail.com",
  "casualdx.com",
  "chogmail.com",
  "coolimpool.org",
  "cosmorph.com",
  "courriel.fr.nf",
  "curryworld.de",
  "cust.in",
  "dacoolest.com",
]);

/**
 * Check if an email domain is a known disposable email provider
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is from a disposable domain
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

// ============================================================================
// INPUT SANITIZATION
// Additional server-side validation and sanitization utilities.
// ============================================================================

/**
 * Sanitize a string to prevent XSS in email/HTML contexts
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate email format more strictly
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email appears valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ============================================================================
// COMBINED BOT CHECK
// Single function to run all bot checks and return a result.
// ============================================================================

/**
 * Run all bot protection checks
 * @param {Object} params
 * @param {string} params.honeypot - Honeypot field value
 * @param {string} params.timingToken - Timing token from form
 * @param {string} params.ip - Client IP address
 * @param {string} params.rateLimitKey - Rate limit key (e.g., "contact")
 * @param {Object} params.rateLimitConfig - { maxAttempts, windowMs }
 * @returns {{ passed: boolean, reason?: string, silentReject?: boolean }}
 */
export function runBotChecks({ honeypot, timingToken, ip, rateLimitKey, rateLimitConfig }) {
  // Honeypot check - silent reject (return fake success to bot)
  if (isHoneypotFilled(honeypot)) {
    return { passed: false, reason: "honeypot", silentReject: true };
  }

  // Timing check - silent reject
  const timing = validateTimingToken(timingToken);
  if (!timing.valid || timing.tooFast) {
    return { passed: false, reason: "timing", silentReject: true };
  }

  // Rate limit check - return error to user
  if (rateLimitKey && rateLimitConfig) {
    const rateLimit = checkRateLimit(
      rateLimitKey,
      ip,
      rateLimitConfig.maxAttempts,
      rateLimitConfig.windowMs
    );
    if (!rateLimit.allowed) {
      return {
        passed: false,
        reason: "rate_limit",
        silentReject: false,
        resetIn: rateLimit.resetIn,
      };
    }
  }

  return { passed: true };
}
