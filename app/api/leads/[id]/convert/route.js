import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * Turn a lead into a member account and back-link their existing guest
 * bookings, so their history follows them in.
 *
 * There is no password-reset flow yet, so a temporary password is generated
 * and returned ONCE for the coach to hand over. It is never stored in clear.
 */
export async function POST(_request, { params }) {
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

      return { userId: user.id, email, tempPassword, adoptedBookings: count, alreadyHadAccount: false };
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
