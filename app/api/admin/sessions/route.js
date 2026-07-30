import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminSessions } from "@/lib/availability";
import { MAX_RANGE_DAYS, studioNow } from "@/lib/config";

export const dynamic = "force-dynamic";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);

    const today = studioNow().isoDay;
    const from = searchParams.get("from") || today;
    const to = searchParams.get("to") || from;

    if (!ISO_DAY.test(from) || !ISO_DAY.test(to)) {
      throw new HttpError(400, "from and to must be YYYY-MM-DD");
    }
    if (to < from) throw new HttpError(400, "to must not be before from");

    const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
    if (span > MAX_RANGE_DAYS) {
      throw new HttpError(400, `Range too large — ${MAX_RANGE_DAYS} days maximum`);
    }

    return Response.json(await getAdminSessions(prisma, from, to));
  } catch (err) {
    return jsonError(err);
  }
}
