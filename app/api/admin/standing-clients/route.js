import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { studioNow } from "@/lib/config";
import { sendCancellationEmail } from "@/lib/email";
import { toClientBooking } from "@/lib/shape";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GET /api/admin/standing-clients
 * List all standing clients with member info
 */
export async function GET() {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const now = studioNow();

    const standingClients = await prisma.standingClient.findMany({
      include: {
        member: { select: { id: true, name: true, email: true, phone: true } },
        skips: { where: { date: { gte: new Date(`${now.isoDay}T00:00:00.000Z`) } } },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    return Response.json(
      standingClients.map((sc) => ({
        id: sc.id,
        memberId: sc.memberId,
        memberName: sc.member.name,
        memberEmail: sc.member.email,
        memberPhone: sc.member.phone,
        daysOfWeek: sc.daysOfWeek,
        daysLabel: sc.daysOfWeek.map((d) => DAY_NAMES[d]).join(" & "),
        startTime: sc.startTime,
        durationMin: sc.durationMin,
        endDate: sc.endDate?.toISOString().slice(0, 10) || null,
        active: sc.active,
        // Check if ended (past end date)
        ended: sc.endDate ? sc.endDate < new Date(`${now.isoDay}T00:00:00.000Z`) : false,
        upcomingSkips: sc.skips.map((s) => s.date.toISOString().slice(0, 10)),
        createdAt: sc.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    return jsonError(err);
  }
}

const CreateSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, "At least one day required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  durationMin: z.number().int().positive().default(60),
  endDate: z.string().nullable().optional(),
  // Conflict resolutions: array of { date, action: "cancel" | "skip" }
  conflictResolutions: z.array(z.object({
    date: z.string(),
    action: z.enum(["cancel", "skip", "keep"]),
  })).optional(),
});

/**
 * POST /api/admin/standing-clients
 * Create a new standing client with conflict handling
 */
export async function POST(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const body = await request.json();

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid data");
    }

    const { memberId, daysOfWeek, startTime, durationMin, endDate, conflictResolutions } = parsed.data;

    // Verify member exists
    const member = await prisma.user.findUnique({ where: { id: memberId } });
    if (!member) throw new HttpError(404, "Member not found");

    const now = studioNow();
    const today = new Date(`${now.isoDay}T00:00:00.000Z`);
    const endDateParsed = endDate ? new Date(`${endDate}T00:00:00.000Z`) : null;

    // Check for conflicts: find existing PT bookings at this time on these days
    // Look ahead 90 days for conflicts
    const lookAheadDays = 90;
    const lookAheadEnd = new Date(today.getTime() + lookAheadDays * 86400000);

    // Find all PT sessions in the range that match the days and time
    const sessions = await prisma.classSession.findMany({
      where: {
        date: { gte: today, lte: endDateParsed || lookAheadEnd },
        type: "PT",
        startTime: startTime,
      },
      include: {
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, name: true, email: true, userId: true, sessionId: true },
        },
      },
    });

    // Filter to matching days of week and find conflicts
    const conflicts = [];
    for (const session of sessions) {
      const sessionDow = session.date.getUTCDay();
      if (!daysOfWeek.includes(sessionDow)) continue;

      // Check for bookings by other people
      for (const booking of session.bookings) {
        if (booking.userId === memberId) {
          // Same person already booked - can keep or cancel
          conflicts.push({
            date: session.date.toISOString().slice(0, 10),
            sessionId: session.id,
            bookingId: booking.id,
            bookedBy: booking.name,
            bookedByEmail: booking.email,
            isSamePerson: true,
          });
        } else {
          // Different person
          conflicts.push({
            date: session.date.toISOString().slice(0, 10),
            sessionId: session.id,
            bookingId: booking.id,
            bookedBy: booking.name,
            bookedByEmail: booking.email,
            isSamePerson: false,
          });
        }
      }
    }

    // If there are conflicts and no resolutions provided, return the conflicts for UI
    if (conflicts.length > 0 && !conflictResolutions?.length) {
      return Response.json({ conflicts }, { status: 409 });
    }

    // Process conflict resolutions if provided
    const skippedDates = [];
    if (conflictResolutions?.length) {
      for (const resolution of conflictResolutions) {
        const conflict = conflicts.find((c) => c.date === resolution.date);
        if (!conflict) continue;

        if (resolution.action === "cancel") {
          // Cancel the existing booking
          const booking = await prisma.booking.findUnique({
            where: { id: conflict.bookingId },
            include: { session: true },
          });

          if (booking && booking.status !== "CANCELLED") {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { status: "CANCELLED" },
            });

            // Send cancellation email (don't block on it)
            const shaped = toClientBooking(booking, now.isoDay);
            sendCancellationEmail(shaped).catch((err) => {
              console.error("[standing-client] cancellation email failed:", err);
            });
          }
        } else if (resolution.action === "skip") {
          // Skip this date for the standing client
          skippedDates.push(resolution.date);
        }
        // "keep" means do nothing (same person's booking stays)
      }
    }

    // Create the standing client
    const standingClient = await prisma.standingClient.create({
      data: {
        memberId,
        daysOfWeek,
        startTime,
        durationMin,
        endDate: endDateParsed,
        active: true,
        skips: {
          create: skippedDates.map((date) => ({
            date: new Date(`${date}T00:00:00.000Z`),
            reason: "Existing booking preserved",
          })),
        },
      },
      include: { member: { select: { name: true } } },
    });

    return Response.json({
      success: true,
      standingClient: {
        id: standingClient.id,
        memberName: standingClient.member.name,
        daysOfWeek,
        startTime,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
