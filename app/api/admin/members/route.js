import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();
    const includeArchived = url.searchParams.get("includeArchived") === "true";

    const members = await prisma.user.findMany({
      where: {
        role: "MEMBER",
        ...(includeArchived ? {} : { archived: false }),
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
          : {}),
      },
      include: {
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
        archived: m.archived,
        createdAt: new Date(m.createdAt).getTime(),
        bookingCount: m._count.bookings,
      }))
    );
  } catch (err) {
    return jsonError(err);
  }
}
