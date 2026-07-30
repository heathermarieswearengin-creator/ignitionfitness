import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";

export const dynamic = "force-dynamic";

// TODO(Phase 3): gate behind session.user.role === "ADMIN" once Auth.js lands.
export async function DELETE(_request, { params }) {
  try {
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
