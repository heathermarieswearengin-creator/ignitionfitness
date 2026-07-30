import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const existing = await prisma.availabilityBlock.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Block not found");

    await prisma.availabilityBlock.delete({ where: { id } });
    return Response.json({ ok: true, id });
  } catch (err) {
    return jsonError(err);
  }
}
