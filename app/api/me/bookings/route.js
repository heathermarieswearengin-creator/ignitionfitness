import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { currentUser } from "@/lib/auth-helpers";
import { studioNow } from "@/lib/config";
import { toClientBooking } from "@/lib/shape";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/bookings
 * Get the current user's bookings split into upcoming and past
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ upcoming: [], past: [] });
    }

    const prisma = getPrisma();
    const now = studioNow();

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: { session: true },
      orderBy: [{ session: { date: "desc" } }, { session: { startTime: "desc" } }],
    });

    const shaped = bookings.map((b) => toClientBooking(b, now.isoDay));

    const upcoming = shaped
      .filter((b) => b.date >= now.isoDay && b.status !== "cancelled")
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

    const past = shaped
      .filter((b) => b.date < now.isoDay || b.status === "cancelled")
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      });

    return Response.json({ upcoming, past });
  } catch (err) {
    return jsonError(err);
  }
}
