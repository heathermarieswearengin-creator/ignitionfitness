import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { currentUser } from "@/lib/auth-helpers";
import { studioNow } from "@/lib/config";
import { toClientBooking, toIsoDay } from "@/lib/shape";
import { googleCalendarUrl } from "@/lib/ics";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKS_AHEAD = 6; // Show standing sessions up to 6 weeks out

/**
 * Generate upcoming standing session occurrences for a member
 */
function generateStandingSessions(standingClients, now, skipDates) {
  const sessions = [];
  const today = new Date(`${now.isoDay}T00:00:00.000Z`);
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + WEEKS_AHEAD * 7);

  for (const sc of standingClients) {
    if (!sc.active) continue;

    // Check if arrangement has ended
    if (sc.endDate && new Date(sc.endDate) < today) continue;

    // Get skipped dates for this standing client
    const skippedDates = new Set(
      (skipDates[sc.id] || []).map((s) => toIsoDay(s.date))
    );

    // Generate dates for each day of week
    for (const dow of sc.daysOfWeek) {
      let date = new Date(today);
      // Find next occurrence of this day of week
      while (date.getUTCDay() !== dow) {
        date.setUTCDate(date.getUTCDate() + 1);
      }

      // Generate occurrences until end date
      while (date <= endDate) {
        const isoDay = toIsoDay(date);

        // Check if arrangement has ended by this date
        if (sc.endDate && date > new Date(sc.endDate)) break;

        // Check if this date is skipped
        if (!skippedDates.has(isoDay)) {
          const endMin =
            parseInt(sc.startTime.split(":")[0]) * 60 +
            parseInt(sc.startTime.split(":")[1]) +
            (sc.durationMin || 60);
          const endHours = Math.floor(endMin / 60);
          const endMins = endMin % 60;
          const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

          // Format time for display (e.g., "6:00 AM")
          const [h, m] = sc.startTime.split(":");
          const hour = parseInt(h);
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const displayTime = `${displayHour}:${m} ${ampm}`;

          sessions.push({
            id: `standing-${sc.id}-${isoDay}`,
            standingClientId: sc.id,
            isStanding: true,
            classType: "pt",
            sessionType: "PT",
            date: isoDay,
            startTime: sc.startTime,
            time: displayTime,
            durationMin: sc.durationMin || 60,
            endTime,
            status: "confirmed",
            dayName: DAY_NAMES[dow],
            memberName: sc.member?.name || "",
          });
        }

        // Move to next week
        date.setUTCDate(date.getUTCDate() + 7);
      }
    }
  }

  return sessions;
}

/**
 * GET /api/me/bookings
 * Get the current user's bookings (including standing sessions) split into upcoming and past
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ upcoming: [], past: [], standingSessions: [] });
    }

    const prisma = getPrisma();
    const now = studioNow();

    // Fetch regular bookings
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: { session: true },
      orderBy: [{ session: { date: "desc" } }, { session: { startTime: "desc" } }],
    });

    // Fetch standing client arrangements for this user
    const standingClients = await prisma.standingClient.findMany({
      where: { memberId: user.id, active: true },
      include: {
        member: { select: { name: true } },
        skips: {
          where: {
            date: { gte: new Date(`${now.isoDay}T00:00:00.000Z`) },
          },
        },
      },
    });

    // Build skip dates map
    const skipDates = {};
    for (const sc of standingClients) {
      skipDates[sc.id] = sc.skips;
    }

    // Generate upcoming standing sessions
    const standingSessions = generateStandingSessions(standingClients, now, skipDates);

    const shaped = bookings.map((b) => toClientBooking(b, now.isoDay));

    const upcoming = shaped
      .filter((b) => b.date >= now.isoDay && b.status !== "cancelled")
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

    // Merge standing sessions into upcoming
    const allUpcoming = [...upcoming, ...standingSessions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    const past = shaped
      .filter((b) => b.date < now.isoDay || b.status === "cancelled")
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      });

    return Response.json({
      upcoming: allUpcoming,
      past,
      standingClients: standingClients.map((sc) => ({
        id: sc.id,
        daysOfWeek: sc.daysOfWeek,
        startTime: sc.startTime,
        durationMin: sc.durationMin,
        active: sc.active,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
