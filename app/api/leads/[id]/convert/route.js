import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { newResetToken, hashResetToken, siteUrlFrom } from "@/lib/reset-tokens";
import { sendPasswordReset } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Turn a lead into a member account and back-link their existing guest
 * bookings, so their history follows them in.
 *
 * The new member is emailed a set-password link rather than being given a
 * password. A random one is still generated so the account is never left with
 * a guessable or empty credential — it is simply never disclosed. Only if mail
 * is unconfigured is it returned for the coach to read out.
 */
export async function POST(request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const result = await serializableTx(prisma, async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id } });
      if (!lead) throw new HttpError(404, "Lead not found");

      const email = lead.email.toLowerCase();
      const existingUser = await tx.user.findUnique({ where: { email } });

      if (existingUser) {
        // Already has an account — just record the conversion and adopt any
        // bookings they made as a guest before signing up.
        const { count } = await tx.booking.updateMany({
          where: { email, userId: null },
          data: { userId: existingUser.id },
        });
        await tx.lead.update({ where: { id }, data: { status: "converted" } });
        return { userId: existingUser.id, email, tempPassword: null, adoptedBookings: count, alreadyHadAccount: true };
      }

      const tempPassword = randomBytes(9).toString("base64url");
      const user = await tx.user.create({
        data: {
          email,
          name: lead.name || email.split("@")[0],
          phone: lead.phone,
          role: "MEMBER",
          passwordHash: await bcrypt.hash(tempPassword, 10),
        },
      });

      const { count } = await tx.booking.updateMany({
        where: { email, userId: null },
        data: { userId: user.id },
      });

      await tx.lead.update({ where: { id }, data: { status: "converted" } });

      return { userId: user.id, email, tempPassword, adoptedBookings: count, alreadyHadAccount: false, name: user.name };
    });

    // Brand-new account: email them a link to set their own password. Only if
    // that can't be sent does the coach need the generated one.
    if (!result.alreadyHadAccount) {
      const token = newResetToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: result.userId,
          tokenHash: hashResetToken(token),
          // Longer than a normal reset — this is their first way in, and the
          // coach may not reach them the same day.
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const link = `${siteUrlFrom(request)}/reset?token=${encodeURIComponent(token)}`;
      const mail = await sendPasswordReset({ to: result.email, name: result.name, link });

      if (mail.sent) {
        // Sent — so the generated password never needs to be disclosed.
        return Response.json({ ...result, tempPassword: null, setPasswordEmailSent: true }, { status: 201 });
      }
      console.warn(`[leads] set-password link for ${result.email} (email unavailable): ${link}`);
      return Response.json({ ...result, setPasswordEmailSent: false }, { status: 201 });
    }

    return Response.json(result, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
