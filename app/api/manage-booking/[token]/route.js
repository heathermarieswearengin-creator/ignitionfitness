import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, serializableTx, jsonError } from "@/lib/tx";
import { studioNow, minuteOfDay } from "@/lib/config";
import { toClientBooking, makeRef, toIsoDay, dateOnly } from "@/lib/shape";
import { isBlocked } from "@/lib/availability";
import { sendCancellationEmail, sendRescheduleEmail } from "@/lib/email";
import { generateManageToken, calculateTokenExpiry } from "@/lib/manage-token";

export const dynamic = "force-dynamic";

// Rate limiting: simple in-memory tracker (resets on deploy)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip || "unknown";
  const record = rateLimits.get(key);

  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimits.set(key, { start: now, count: 1 });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * GET /api/manage-booking/[token]
 * Retrieve booking details by manage token
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token || token.length < 20) {
      throw new HttpError(400, "Invalid token");
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    if (!checkRateLimit(ip)) {
      throw new HttpError(429, "Too many requests. Please try again later.");
    }

    const prisma = getPrisma();
    const booking = await prisma.booking.findUnique({
      where: { manageToken: token },
      include: { session: true },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found or link has expired.");
    }

    // Check if token has expired
    if (booking.manageTokenExp && new Date() > booking.manageTokenExp) {
      throw new HttpError(410, "This link has expired.");
    }

    const now = studioNow();
    const shaped = toClientBooking(booking, now.isoDay);

    // Fetch other upcoming bookings for this email (to show "already booked" days)
    const otherBookings = await prisma.booking.findMany({
      where: {
        email: { equals: booking.email, mode: "insensitive" },
        id: { not: booking.id },
        status: { not: "CANCELLED" },
        session: { date: { gte: new Date(`${now.isoDay}T00:00:00.000Z`) } },
      },
      include: { session: true },
      orderBy: { session: { date: "asc" } },
    });

    const otherBookingsShaped = otherBookings.map(b => toClientBooking(b, now.isoDay));

    // Return only what's needed for the manage page
    return Response.json({
      id: shaped.id,
      ref: shaped.ref,
      name: shaped.name,
      email: shaped.email,
      classType: shaped.classType,
      sessionType: shaped.sessionType,
      date: shaped.date,
      time: shaped.time,
      status: shaped.status,
      startTime: shaped.startTime,
      durationMin: shaped.durationMin,
      otherBookings: otherBookingsShaped,
    });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * POST /api/manage-booking/[token]
 * Perform actions: cancel or reschedule
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    if (!token || token.length < 20) {
      throw new HttpError(400, "Invalid token");
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    if (!checkRateLimit(ip)) {
      throw new HttpError(429, "Too many requests. Please try again later.");
    }

    const body = await request.json();
    const action = body.action;

    if (action === "cancel") {
      return handleCancel(token, body.reason);
    } else if (action === "reschedule") {
      return handleReschedule(token, body.newSessionId);
    } else {
      throw new HttpError(400, "Invalid action. Use 'cancel' or 'reschedule'.");
    }
  } catch (err) {
    return jsonError(err);
  }
}

async function handleCancel(token, reason) {
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { session: true },
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found or link has expired.");
  }

  if (booking.manageTokenExp && new Date() > booking.manageTokenExp) {
    throw new HttpError(410, "This link has expired.");
  }

  if (booking.status === "CANCELLED") {
    throw new HttpError(400, "This booking is already cancelled.");
  }

  // Check if session has already started
  const now = studioNow();
  const isoDay = toIsoDay(booking.session.date);
  if (isoDay < now.isoDay || (isoDay === now.isoDay && minuteOfDay(booking.session.startTime) <= now.minutes)) {
    throw new HttpError(400, "Cannot cancel a session that has already started.");
  }

  // Sanitize and truncate reason
  const cleanReason = reason ? String(reason).trim().slice(0, 500) : null;

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancellationReason: cleanReason,
    },
    include: { session: true },
  });

  const shaped = toClientBooking(updated, now.isoDay);

  // Send cancellation email (includes admin notification for 1:1)
  sendCancellationEmail(shaped, { reason: cleanReason }).catch((err) => {
    console.error("[manage-booking] cancellation email failed:", err);
  });

  return Response.json({ success: true, booking: shaped });
}

async function handleReschedule(token, newSessionId) {
  if (!newSessionId) {
    throw new HttpError(400, "New session ID is required for rescheduling.");
  }

  const prisma = getPrisma();

  const result = await serializableTx(prisma, async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { manageToken: token },
      include: { session: true },
    });

    if (!booking) {
      throw new HttpError(404, "Booking not found or link has expired.");
    }

    if (booking.manageTokenExp && new Date() > booking.manageTokenExp) {
      throw new HttpError(410, "This link has expired.");
    }

    if (booking.status === "CANCELLED") {
      throw new HttpError(400, "Cannot reschedule a cancelled booking.");
    }

    const now = studioNow();
    const oldIsoDay = toIsoDay(booking.session.date);
    if (oldIsoDay < now.isoDay || (oldIsoDay === now.isoDay && minuteOfDay(booking.session.startTime) <= now.minutes)) {
      throw new HttpError(400, "Cannot reschedule a session that has already started.");
    }

    // Get new session
    const newSession = await tx.classSession.findUnique({
      where: { id: newSessionId },
    });

    if (!newSession) {
      throw new HttpError(404, "The selected session no longer exists.");
    }

    // Must be same type
    if (newSession.type !== booking.session.type) {
      throw new HttpError(400, "Can only reschedule to the same session type.");
    }

    const newIsoDay = toIsoDay(newSession.date);
    if (newIsoDay < now.isoDay || (newIsoDay === now.isoDay && minuteOfDay(newSession.startTime) <= now.minutes)) {
      throw new HttpError(400, "Cannot reschedule to a past session.");
    }

    // Check blocks - normalize to UTC midnight for exact date comparison
    const sessionDate = dateOnly(newIsoDay);
    const blocks = await tx.availabilityBlock.findMany({ where: { date: sessionDate } });
    if (isBlocked(newIsoDay, newSession.startTime, blocks)) {
      throw new HttpError(409, "That time is not available for booking.");
    }

    // Check for duplicate
    const dupe = await tx.booking.findFirst({
      where: {
        sessionId: newSessionId,
        email: booking.email,
        status: { not: "CANCELLED" },
        id: { not: booking.id },
      },
    });
    if (dupe) {
      throw new HttpError(409, "You already have a booking for that session.");
    }

    // Check capacity
    const taken = await tx.booking.count({
      where: { sessionId: newSessionId, status: { not: "CANCELLED" } },
    });
    if (taken >= newSession.capacity) {
      throw new HttpError(409, "That session is full.");
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

  // Send reschedule email
  sendRescheduleEmail(oldShaped, newShaped).catch((err) => {
    console.error("[manage-booking] reschedule email failed:", err);
  });

  return Response.json({
    success: true,
    oldBooking: oldShaped,
    newBooking: newShaped,
  });
}
