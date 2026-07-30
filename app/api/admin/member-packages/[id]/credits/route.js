import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { adjustCredits, toClientMemberPackage } from "@/lib/packages";

export const dynamic = "force-dynamic";

const Adjust = z.object({
  delta: z.coerce.number().int().refine((n) => n !== 0, "Delta must not be zero"),
  // Coerce a missing note to "" so the reader sees the real requirement
  // rather than zod's "expected string, received undefined".
  note: z.preprocess(
    (v) => (v == null ? "" : v),
    z.string().trim().min(1, "A note is required for manual changes").max(200)
  ),
});

// Add or remove credits by hand. The note is mandatory: this log is the
// coach's bookkeeping, and an unexplained adjustment is worse than none.
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = Adjust.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid adjustment");
    }

    const updated = await serializableTx(prisma, (tx) =>
      adjustCredits(tx, {
        memberPackageId: id,
        delta: parsed.data.delta,
        note: parsed.data.note,
        adminId: admin.id,
      })
    );

    return Response.json(toClientMemberPackage(updated));
  } catch (err) {
    return jsonError(err);
  }
}
