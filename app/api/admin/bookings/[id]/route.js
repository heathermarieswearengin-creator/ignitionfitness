import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, serializableTx, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { studioNow, minuteOfDay } from "@/lib/config";
import { toClientBooking, makeRef, toIsoDay, dateOnly } from "@/lib/shape";
import { isBlocked } from "@/lib/availability";
import { sendCancellationEmail, sendRescheduleEmail } from "@/lib/email";
import { generateManageToken, calculateTokenExpiry } from "@/lib/manage-token";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings/[id]
 * Get a single booking's details
 */
export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    const now = studioNow();
    return Response.json(toClientBooking(booking, now.isoDay));
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Cancel a booking (admin action)
 */
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { session: true },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found");
    }

    if (booking.status === "CANCELLED") {
      throw new HttpError(400, "Booking is already cancelled");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { session: true },
    });

    const now = studioNow();
    const shaped = toClientBooking(updated, now.isoDay);

    // Send cancellation email (don't block on it)
    sendCancellationEmail(shaped).catch((err) => {
      console.error("[admin/bookings] cancellation email failed:", err);
    });

    return Response.json({ success: true, booking: shaped });
  } catch (err) {
    return jsonError(err);
  }
}

const RescheduleSchema = z.object({
  newSessionId: z.string().min(1, "New session ID is required"),
});

/**
 * PATCH /api/admin/bookings/[id]
 * Reschedule a booking (admin action)
 */
export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const body = await request.json();
    const parsed = RescheduleSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid data");
    }

    const { newSessionId } = parsed.data;

    const result = await serializableTx(prisma, async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { session: true },
      });

      if (!booking) {
        throw new HttpError(404, "Booking not found");
      }

      if (booking.status === "CANCELLED") {
        throw new HttpError(400, "Cannot reschedule a cancelled booking");
      }

      const newSession = await tx.classSession.findUnique({
        where: { id: newSessionId },
      });

      if (!newSession) {
        throw new HttpError(404, "Target session not found");
      }

      // Must be same type
      if (newSession.type !== booking.session.type) {
        throw new HttpError(400, "Can only reschedule to the same session type");
      }

      const now = studioNow();
      const newIsoDay = toIsoDay(newSession.date);

      // Check not in past
      if (newIsoDay < now.isoDay || (newIsoDay === now.isoDay && minuteOfDay(newSession.startTime) <= now.minutes)) {
        throw new HttpError(400, "Cannot reschedule to a past session");
      }

      // Check blocks
      const sessionDate = dateOnly(newIsoDay);
      const blocks = await tx.availabilityBlock.findMany({ where: { date: sessionDate } });
      if (isBlocked(newIsoDay, newSession.startTime, blocks)) {
        throw new HttpError(409, "That time is blocked");
      }

      // Check for duplicate booking
      const dupe = await tx.booking.findFirst({
        where: {
          sessionId: newSessionId,
          email: booking.email,
          status: { not: "CANCELLED" },
          id: { not: booking.id },
        },
      });
      if (dupe) {
        throw new HttpError(409, "Client already has a booking for that session");
      }

      // Check capacity
      const taken = await tx.booking.count({
        where: { sessionId: newSessionId, status: { not: "CANCELLED" } },
      });
      if (taken >= newSession.capacity) {
        throw new HttpError(409, "Target session is full");
      }

      // Cancel old booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      // Create new booking with new manage token
      const newManageToken = generateManageToken();
      const newManageTokenExp = calculateTokenExpiry(newIsoDay, newSession.startTime, newSession.durationMin || 60);

      const newBooking = await tx.booking.create({
        data: {
          ref: makeRef(),
          sessionId: newSessionId,
          userId: booking.userId,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          isDropIn: booking.isDropIn,
          status: "CONFIRMED",
          paymentStatus: booking.paymentStatus,
          memberPackageId: booking.memberPackageId,
          manageToken: newManageToken,
          manageTokenExp: newManageTokenExp,
        },
        include: { session: true },
      });

      return { oldBooking: booking, newBooking };
    });

    const now = studioNow();
    const oldShaped = toClientBooking(result.oldBooking, now.isoDay);
    const newShaped = toClientBooking(result.newBooking, now.isoDay);

    // Send reschedule email (don't block on it)
    sendRescheduleEmail(oldShaped, newShaped).catch((err) => {
      console.error("[admin/bookings] reschedule email failed:", err);
    });

    return Response.json({
      success: true,
      oldBooking: oldShaped,
      newBooking: newShaped,
    });
  } catch (err) {
    return jsonError(err);
  }
}
