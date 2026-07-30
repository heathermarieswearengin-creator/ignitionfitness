import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { toClientMemberPackage } from "@/lib/packages";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const q = new URL(request.url).searchParams.get("q")?.trim();

    const members = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
          : {}),
      },
      include: {
        packages: { include: { source: true }, orderBy: { createdAt: "desc" } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(
      members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        createdAt: new Date(m.createdAt).getTime(),
        bookingCount: m._count.bookings,
        packages: m.packages.map(toClientMemberPackage),
      }))
    );
  } catch (err) {
    return jsonError(err);
  }
}
