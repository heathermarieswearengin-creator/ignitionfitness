import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { toClientBooking } from "@/lib/shape";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { session: true },
          orderBy: { createdAt: "desc" },
          take: 25,
        },
        _count: { select: { bookings: true } },
      },
    });
    if (!member) throw new HttpError(404, "Member not found");

    return Response.json({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      archived: member.archived,
      createdAt: new Date(member.createdAt).getTime(),
      bookingCount: member._count.bookings,
      recentBookings: member.bookings.map(toClientBooking),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const PatchMember = z.object({
  archived: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = PatchMember.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, "Invalid request");
    }

    const member = await prisma.user.findUnique({ where: { id } });
    if (!member) throw new HttpError(404, "Member not found");
    if (member.role === "ADMIN") throw new HttpError(400, "Cannot modify admin users");

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
    });

    return Response.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      archived: updated.archived,
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const member = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!member) throw new HttpError(404, "Member not found");
    if (member.role === "ADMIN") throw new HttpError(400, "Cannot delete admin users");

    // Block deletion if member has any booking history - require archive instead
    if (member._count.bookings > 0) {
      throw new HttpError(400, "Cannot delete member with booking history. Archive them instead.");
    }

    await prisma.user.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
