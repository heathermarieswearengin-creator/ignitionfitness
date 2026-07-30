import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { getAvailability } from "@/lib/availability";
import { BOOKING_WINDOW_DAYS, MAX_RANGE_DAYS, studioNow } from "@/lib/config";

export const dynamic = "force-dynamic";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function addDays(isoDay, n) {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Public: the booking wizard reads this instead of the old WEEKLY constant.
export async function GET(request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);

    const today = studioNow().isoDay;
    const from = searchParams.get("from") || today;
    const to = searchParams.get("to") || addDays(from, BOOKING_WINDOW_DAYS - 1);

    if (!ISO_DAY.test(from) || !ISO_DAY.test(to)) {
      throw new HttpError(400, "from and to must be YYYY-MM-DD");
    }
    if (to < from) throw new HttpError(400, "to must not be before from");

    // Each request can materialise sessions, so bound how many it may create.
    const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
    if (span > MAX_RANGE_DAYS) {
      throw new HttpError(400, `Range too large — ${MAX_RANGE_DAYS} days maximum`);
    }

    const includePast = searchParams.get("includePast") === "true";
    const slots = await getAvailability(prisma, from, to, { includePast });

    return Response.json(slots);
  } catch (err) {
    return jsonError(err);
  }
}
