import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { STATUS_TO_DB, toClientBooking } from "@/lib/shape";

export const dynamic = "force-dynamic";

const PatchBooking = z.object({
  status: z.enum(["confirmed", "checked-in", "pending", "cancelled"]),
});

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = PatchBooking.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, "status must be one of: confirmed, checked-in, pending, cancelled");
    }
    const nextStatus = STATUS_TO_DB[parsed.data.status];

    const booking = await serializableTx(prisma, async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, "Booking not found");

      // Cancelling a booking that consumed a credit hands the credit back —
      // and, as always, the change and its log entry are written together.
      const refunding =
        nextStatus === "CANCELLED" &&
        existing.status !== "CANCELLED" &&
        existing.memberPackageId;

      if (refunding) {
        await tx.memberPackage.update({
          where: { id: existing.memberPackageId },
          data: { creditsRemaining: { increment: 1 } },
        });
        await tx.packageLog.create({
          data: {
            memberPackageId: existing.memberPackageId,
            delta: 1,
            reason: "cancel-refund",
            note: `Booking ${existing.ref} cancelled`,
            adminId: admin.id,
          },
        });
      }

      return tx.booking.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(refunding ? { paymentStatus: "UNPAID", memberPackageId: null } : {}),
        },
        include: { session: true },
      });
    });

    return Response.json(toClientBooking(booking));
  } catch (err) {
    return jsonError(err);
  }
}
