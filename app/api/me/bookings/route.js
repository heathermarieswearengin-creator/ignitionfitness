import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { requireUser } from "@/lib/auth-helpers";
import { toClientBooking } from "@/lib/shape";
import { studioNow } from "@/lib/config";

export const dynamic = "force-dynamic";

// The signed-in member's own bookings, split into upcoming and past.
export async function GET() {
  try {
    const user = await requireUser();
    const prisma = getPrisma();

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: { session: true },
      orderBy: [{ session: { date: "asc" } }, { session: { startTime: "asc" } }],
    });

    const today = studioNow().isoDay;
    const shaped = bookings.map(toClientBooking);

    return Response.json({
      upcoming: shaped.filter((b) => b.date >= today && b.status !== "cancelled"),
      past: shaped.filter((b) => b.date < today || b.status === "cancelled").reverse(),
    });
  } catch (err) {
    return jsonError(err);
  }
}
