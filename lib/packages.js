import { HttpError } from "@/lib/tx";

/**
 * Prisma `where` for the member packages that can actually pay for a session
 * of `type` right now: active, not expired, and either unlimited or holding at
 * least one credit.
 */
export function usablePackageWhere(userId, type, now = new Date()) {
  return {
    userId,
    type,
    active: true,
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      { OR: [{ unlimited: true }, { creditsRemaining: { gt: 0 } }] },
    ],
  };
}

/**
 * Spend one session against a member's package, if they have a usable one.
 * Unlimited memberships are time-based, so nothing is decremented and there is
 * no credit movement to log — but the booking is still marked as covered.
 *
 * Returns { memberPackageId, paymentStatus } for the booking row.
 * Must be called inside a transaction.
 */
export async function spendPackageCredit(tx, { userId, type }) {
  if (!userId) return { memberPackageId: null, paymentStatus: "UNPAID" };

  const pack = await tx.memberPackage.findFirst({
    where: usablePackageWhere(userId, type),
    // Spend expiring/finite packs before open-ended ones so nothing is wasted.
    orderBy: [{ unlimited: "asc" }, { expiresAt: "asc" }, { createdAt: "asc" }],
  });
  if (!pack) return { memberPackageId: null, paymentStatus: "UNPAID" };

  if (!pack.unlimited) {
    await tx.memberPackage.update({
      where: { id: pack.id },
      data: { creditsRemaining: { decrement: 1 } },
    });
    await tx.packageLog.create({
      data: { memberPackageId: pack.id, delta: -1, reason: "booking" },
    });
  }

  return { memberPackageId: pack.id, paymentStatus: "PACKAGE" };
}

/**
 * Hand a credit back when a package-covered booking is cancelled. Unlimited
 * memberships have nothing to refund.
 * Must be called inside a transaction.
 */
export async function refundPackageCredit(tx, { memberPackageId, adminId, note }) {
  const pack = await tx.memberPackage.findUnique({ where: { id: memberPackageId } });
  if (!pack || pack.unlimited) return false;

  await tx.memberPackage.update({
    where: { id: pack.id },
    data: { creditsRemaining: { increment: 1 } },
  });
  await tx.packageLog.create({
    data: { memberPackageId: pack.id, delta: 1, reason: "cancel-refund", note, adminId },
  });
  return true;
}

/**
 * Add or remove credits by hand. The credit change and its audit row are always
 * written together — that log is the coach's bookkeeping.
 * Must be called inside a transaction.
 */
export async function adjustCredits(tx, { memberPackageId, delta, note, adminId }) {
  const pack = await tx.memberPackage.findUnique({ where: { id: memberPackageId } });
  if (!pack) throw new HttpError(404, "That package isn't assigned to anyone.");
  if (pack.unlimited) {
    throw new HttpError(400, "Unlimited memberships don't use credits — change the expiry date instead.");
  }
  const next = pack.creditsRemaining + delta;
  if (next < 0) {
    throw new HttpError(400, `That would leave ${next} credits. Only ${pack.creditsRemaining} remain.`);
  }

  const updated = await tx.memberPackage.update({
    where: { id: pack.id },
    data: { creditsRemaining: next },
  });
  await tx.packageLog.create({
    data: {
      memberPackageId: pack.id,
      delta,
      reason: delta >= 0 ? "manual-add" : "manual-remove",
      note: note || null,
      adminId,
    },
  });
  return updated;
}

export function toClientMemberPackage(mp) {
  return {
    id: mp.id,
    type: mp.type,
    unlimited: mp.unlimited,
    creditsRemaining: mp.creditsRemaining,
    expiresAt: mp.expiresAt ? new Date(mp.expiresAt).toISOString().slice(0, 10) : null,
    expired: Boolean(mp.expiresAt && new Date(mp.expiresAt) < new Date()),
    active: mp.active,
    packageName: mp.source?.name ?? null,
    createdAt: new Date(mp.createdAt).getTime(),
  };
}
