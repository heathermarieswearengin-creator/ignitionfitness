import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { toClientBooking } from "@/lib/shape";
import { buildIcs, icsFilename } from "@/lib/ics";

export const dynamic = "force-dynamic";

/**
 * Downloadable calendar file for one booking.
 *
 * Deliberately not behind auth: guests book without an account and still need
 * their invite from the confirmation screen. The booking id is a cuid, so it
 * is unguessable in practice — but it IS the only thing protecting the
 * attendee's name and email here, so don't put this id in a public URL.
 */
export async function GET(_request, { params }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!booking) throw new HttpError(404, "Booking not found");

    const shaped = toClientBooking(booking);
    const body = buildIcs([shaped]);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${icsFilename(shaped)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
