import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { newResetToken, hashResetToken, siteUrlFrom, RESET_TTL_MS } from "@/lib/reset-tokens";
import { sendPasswordReset } from "@/lib/email";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/bot-protection";

export const dynamic = "force-dynamic";

const Forgot = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

/**
 * Always answers the same way, whether or not an account exists. Telling an
 * anonymous caller "no account with that email" turns this endpoint into a
 * membership oracle.
 */
export async function POST(request) {
  // Rate limiting - must apply BEFORE we reveal anything about accounts
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(
    "passwordReset",
    ip,
    RATE_LIMITS.passwordReset.maxAttempts,
    RATE_LIMITS.passwordReset.windowMs
  );
  if (!rateLimit.allowed) {
    // Return generic message even when rate limited to avoid oracle
    return Response.json({
      ok: true,
      emailConfigured: true,
      message: "If that email has an account, a reset link is on its way.",
    });
  }

  // Whether mail is configured is a property of the deployment, not of the
  // address being asked about — so it is decided BEFORE any lookup and the
  // same answer goes to everyone. Varying the reply once a user is found is
  // exactly how this endpoint becomes an account-existence oracle.
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const generic = {
    ok: true,
    emailConfigured,
    message: emailConfigured
      ? "If that email has an account, a reset link is on its way."
      : "Email isn't set up yet — contact the studio and they can reset your password for you.",
  };

  try {
    const parsed = Forgot.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid email");
    }

    const prisma = getPrisma();
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return Response.json(generic);

    // Any earlier link this person was sent stops working now.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = newResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const link = `${siteUrlFrom(request)}/reset?token=${encodeURIComponent(token)}`;
    const mail = await sendPasswordReset({ to: user.email, name: user.name, link });

    // Delivery problems are logged for the operator, never surfaced to the
    // caller — the response must not change shape based on what we found.
    if (!mail.sent) {
      console.warn(`[auth] reset link for ${user.email} not delivered (${mail.reason}): ${link}`);
    }

    return Response.json(generic);
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err);
    // Never let an internal failure reveal whether the address existed.
    console.error("[auth] forgot-password failed:", err);
    return Response.json(generic);
  }
}
