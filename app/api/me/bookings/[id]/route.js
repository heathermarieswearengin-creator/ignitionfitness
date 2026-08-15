import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireUser } from "@/lib/auth-helpers";
import { toClientBooking } from "@/lib/shape";
import { sendCancellationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const PatchBooking = z.object({
  status: z.enum(["cancelled"]),
});

// Member-initiated cancellation
export async function PATCH(request, { params }) {
  try {
    const user = await requireUser();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = PatchBooking.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, "Only cancellation is supported");
    }

    const booking = await serializableTx(prisma, async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { id },
        include: { session: true },
      });
      if (!existing) throw new HttpError(404, "Booking not found");

      // Ensure the booking belongs to this user
      if (existing.userId !== user.id) {
        throw new HttpError(403, "This booking doesn't belong to you");
      }

      // Can't cancel an already cancelled booking
      if (existing.status === "CANCELLED") {
        throw new HttpError(400, "This booking is already cancelled");
      }

      // Can't cancel a session that has already started
      const sessionDate = existing.session.date;
      const sessionTime = existing.session.startTime;
      const sessionStart = new Date(`${sessionDate}T${sessionTime}:00`);
      if (sessionStart <= new Date()) {
        throw new HttpError(400, "Cannot cancel a session that has already started");
      }

      return tx.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { session: true },
      });
    });

    // Send cancellation email (don't await - fire and forget)
    const shaped = toClientBooking(booking);
    sendCancellationEmail(shaped).catch((err) => {
      console.error("[email] cancellation email failed:", err);
    });

    return Response.json(shaped);
  } catch (err) {
    return jsonError(err);
  }
}
