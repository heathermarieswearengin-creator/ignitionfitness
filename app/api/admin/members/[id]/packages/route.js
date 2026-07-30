import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError, serializableTx } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { toClientMemberPackage } from "@/lib/packages";

export const dynamic = "force-dynamic";

const Assign = z.object({
  packageId: z.string().min(1, "Pick a package"),
  note: z.string().trim().max(200).optional(),
});

// Assign a catalog package to a member.
export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();
    const { id: userId } = await params;

    const parsed = Assign.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid assignment");
    }

    const assigned = await serializableTx(prisma, async (tx) => {
      const member = await tx.user.findUnique({ where: { id: userId } });
      if (!member) throw new HttpError(404, "Member not found");

      const pkg = await tx.package.findUnique({ where: { id: parsed.data.packageId } });
      if (!pkg) throw new HttpError(404, "Package not found");

      // Snapshot unlimited/expiry at assignment time so editing the catalog
      // later never changes what someone was actually sold.
      const expiresAt = pkg.durationDays
        ? new Date(Date.now() + pkg.durationDays * 86400000)
        : null;

      const mp = await tx.memberPackage.create({
        data: {
          userId,
          type: pkg.type,
          unlimited: pkg.unlimited,
          creditsRemaining: pkg.unlimited ? 0 : pkg.totalCredits,
          expiresAt,
          packageId: pkg.id,
        },
        include: { source: true },
      });

      // Unlimited memberships move no credits, but the assignment is still
      // recorded so the member's history is complete.
      await tx.packageLog.create({
        data: {
          memberPackageId: mp.id,
          delta: pkg.unlimited ? 0 : pkg.totalCredits,
          reason: "assigned",
          note: parsed.data.note || (pkg.unlimited ? `${pkg.name} · ${pkg.durationDays} days` : pkg.name),
          adminId: admin.id,
        },
      });

      return mp;
    });

    return Response.json(toClientMemberPackage(assigned), { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
