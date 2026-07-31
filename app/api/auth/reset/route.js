import { z } from "zod";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { hashResetToken } from "@/lib/reset-tokens";

export const dynamic = "force-dynamic";

const Reset = z.object({
  token: z.string().min(1, "Reset link is missing its token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const INVALID = "That reset link is invalid or has expired. Request a new one.";

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const parsed = Reset.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }

    // The lookup is by hash, so a stolen database yields nothing usable.
    const tokenHash = hashResetToken(parsed.data.token);
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const email = await serializableTx(prisma, async (tx) => {
      const row = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      // One message for every failure mode — missing, already used, expired —
      // so the response can't be used to probe which tokens exist.
      if (!row || row.usedAt || row.expiresAt < new Date()) {
        throw new HttpError(400, INVALID);
      }

      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      });

      // Burn this token, and any other outstanding link for the same account.
      await tx.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId: row.userId, usedAt: null },
      });

      return row.user.email;
    });

    return Response.json({ ok: true, email });
  } catch (err) {
    return jsonError(err);
  }
}

/** Lets the reset page tell a dead link from a live one before asking for a password. */
export async function GET(request) {
  try {
    const prisma = getPrisma();
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return Response.json({ valid: false });

    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    const valid = Boolean(row && !row.usedAt && row.expiresAt >= new Date());
    return Response.json({ valid });
  } catch (err) {
    return jsonError(err);
  }
}
