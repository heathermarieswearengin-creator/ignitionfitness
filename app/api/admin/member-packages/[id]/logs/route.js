import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Full audit trail for one assigned package, newest first.
export async function GET(_request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const pack = await prisma.memberPackage.findUnique({
      where: { id },
      include: {
        user: true,
        source: true,
        logs: { orderBy: { createdAt: "desc" }, include: { admin: true } },
      },
    });
    if (!pack) throw new HttpError(404, "Package not found");

    return Response.json({
      memberPackageId: pack.id,
      member: { id: pack.user.id, name: pack.user.name, email: pack.user.email },
      packageName: pack.source?.name ?? null,
      type: pack.type,
      unlimited: pack.unlimited,
      creditsRemaining: pack.creditsRemaining,
      expiresAt: pack.expiresAt ? new Date(pack.expiresAt).toISOString().slice(0, 10) : null,
      logs: pack.logs.map((l) => ({
        id: l.id,
        delta: l.delta,
        reason: l.reason,
        note: l.note,
        admin: l.admin?.name ?? null,
        createdAt: new Date(l.createdAt).getTime(),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
