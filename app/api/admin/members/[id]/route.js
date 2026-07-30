import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { toClientMemberPackage } from "@/lib/packages";
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
        packages: {
          include: { source: true, logs: { orderBy: { createdAt: "desc" }, include: { admin: true } } },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: { session: true },
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });
    if (!member) throw new HttpError(404, "Member not found");

    return Response.json({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      createdAt: new Date(member.createdAt).getTime(),
      packages: member.packages.map((mp) => ({
        ...toClientMemberPackage(mp),
        logs: mp.logs.map((l) => ({
          id: l.id,
          delta: l.delta,
          reason: l.reason,
          note: l.note,
          admin: l.admin?.name ?? null,
          createdAt: new Date(l.createdAt).getTime(),
        })),
      })),
      recentBookings: member.bookings.map(toClientBooking),
    });
  } catch (err) {
    return jsonError(err);
  }
}
