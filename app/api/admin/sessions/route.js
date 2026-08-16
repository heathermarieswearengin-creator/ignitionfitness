import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminSessions } from "@/lib/availability";
import { MAX_RANGE_DAYS, studioNow } from "@/lib/config";
import { dateOnly, toIsoDay, to12h } from "@/lib/shape";

export const dynamic = "force-dynamic";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

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

const CreateSession = z.object({
  date: z.string().regex(ISO_DAY, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(HHMM, "startTime must be HH:MM"),
  type: z.enum(["GROUP", "PT"]),
  capacity: z.number().int().min(1).max(50).default(1),
  durationMin: z.number().int().min(15).max(180).default(60),
  notes: z.string().trim().max(500).optional(),
});

/**
 * POST /api/admin/sessions
 * Create an extra availability slot (one-off session not from template)
 */
export async function POST(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const parsed = CreateSession.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid session data");
    }

    const { date, startTime, type, capacity, durationMin, notes } = parsed.data;
    const sessionDate = dateOnly(date);
    const now = studioNow();

    // Don't allow creating sessions in the past
    if (date < now.isoDay) {
      throw new HttpError(400, "Cannot create sessions in the past");
    }

    // Check for existing session at same date/time/type
    const existing = await prisma.classSession.findUnique({
      where: { date_startTime_type: { date: sessionDate, startTime, type } },
    });

    if (existing) {
      throw new HttpError(409, `A ${type === "PT" ? "PT" : "Group"} session already exists at that time`);
    }

    const session = await prisma.classSession.create({
      data: {
        date: sessionDate,
        startTime,
        type,
        capacity,
        durationMin,
        notes: notes || null,
        status: "SCHEDULED",
      },
    });

    return Response.json({
      success: true,
      session: {
        id: session.id,
        date: toIsoDay(session.date),
        startTime: session.startTime,
        time: to12h(session.startTime),
        type: session.type,
        capacity: session.capacity,
        durationMin: session.durationMin,
        notes: session.notes,
      },
    }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
