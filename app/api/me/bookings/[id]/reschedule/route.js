import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireUser } from "@/lib/auth-helpers";
import { toClientBooking } from "@/lib/shape";
import { sendRescheduleEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const RescheduleBody = z.object({
  newSessionId: z.string().min(1),
});

// Atomic reschedule: cancel old slot and book new slot in one transaction
export async function POST(request, { params }) {
  try {
    const user = await requireUser();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = RescheduleBody.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, "newSessionId is required");
    }
    const { newSessionId } = parsed.data;

    const result = await serializableTx(prisma, async (tx) => {
      // Get the existing booking
      const existing = await tx.booking.findUnique({
        where: { id },
        include: { session: true },
      });
      if (!existing) throw new HttpError(404, "Booking not found");

      // Ensure the booking belongs to this user
      if (existing.userId !== user.id) {
        throw new HttpError(403, "This booking doesn't belong to you");
      }

      // Can't reschedule a cancelled booking
      if (existing.status === "CANCELLED") {
        throw new HttpError(400, "Cannot reschedule a cancelled booking");
      }

      // Can't reschedule a session that has already started
      const sessionDate = existing.session.date;
      const sessionTime = existing.session.startTime;
      const sessionStart = new Date(`${sessionDate}T${sessionTime}:00`);
      if (sessionStart <= new Date()) {
        throw new HttpError(400, "Cannot reschedule a session that has already started");
      }

      // Get the new session
      const newSession = await tx.classSession.findUnique({
        where: { id: newSessionId },
      });
      if (!newSession) {
        throw new HttpError(404, "New session not found");
      }

      // Ensure same session type
      if (newSession.type !== existing.session.type) {
        throw new HttpError(400, "Can only reschedule to the same session type");
      }

      // Ensure new session is in the future
      const newSessionStart = new Date(`${newSession.date}T${newSession.startTime}:00`);
      if (newSessionStart <= new Date()) {
        throw new HttpError(400, "Cannot reschedule to a past session");
      }

      // Check capacity on new session
      const bookedCount = await tx.booking.count({
        where: {
          sessionId: newSessionId,
          status: { not: "CANCELLED" },
        },
      });
      if (bookedCount >= newSession.capacity) {
        throw new HttpError(400, "The new session is full");
      }

      // Check for double booking (user already booked in new session)
      const alreadyBooked = await tx.booking.findFirst({
        where: {
          sessionId: newSessionId,
          userId: user.id,
          status: { not: "CANCELLED" },
        },
      });
      if (alreadyBooked) {
        throw new HttpError(400, "You already have a booking for that session");
      }

      // Cancel the old booking
      await tx.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Create the new booking with same ref pattern but new ID
      const refNum = String(Math.floor(100000 + Math.random() * 900000));
      const newBooking = await tx.booking.create({
        data: {
          ref: `IGN-${refNum}`,
          sessionId: newSessionId,
          userId: user.id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          isDropIn: existing.isDropIn,
          status: "CONFIRMED",
          paymentStatus: "UNPAID",
          memberPackageId: null,
        },
        include: { session: true },
      });

      return {
        oldBooking: { ...existing, session: existing.session },
        newBooking,
      };
    });

    const oldShaped = toClientBooking(result.oldBooking);
    const newShaped = toClientBooking(result.newBooking);

    // Send reschedule email (don't await - fire and forget)
    sendRescheduleEmail(oldShaped, newShaped).catch((err) => {
      console.error("[email] reschedule email failed:", err);
    });

    return Response.json({
      oldBooking: oldShaped,
      newBooking: newShaped,
    });
  } catch (err) {
    return jsonError(err);
  }
}
