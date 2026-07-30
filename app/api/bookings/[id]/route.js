import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { STATUS_TO_DB, toClientBooking } from "@/lib/shape";

export const dynamic = "force-dynamic";

const PatchBooking = z.object({
  status: z.enum(["confirmed", "checked-in", "pending", "cancelled"]),
});

// Admin-only in spirit; the real role check lands in Phase 3 when Auth.js is
// wired and the hard-coded "ignite" gate is removed.
export async function PATCH(request, { params }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    const body = await request.json();
    const parsed = PatchBooking.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "status must be one of: confirmed, checked-in, pending, cancelled");
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Booking not found");

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: STATUS_TO_DB[parsed.data.status] },
      include: { session: true },
    });

    return Response.json(toClientBooking(booking));
  } catch (err) {
    return jsonError(err);
  }
}
