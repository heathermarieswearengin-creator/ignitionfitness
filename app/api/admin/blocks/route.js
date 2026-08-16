import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { dateOnly, toIsoDay } from "@/lib/shape";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const CreateBlock = z
  .object({
    date: z.string().regex(ISO_DATE, "date must be YYYY-MM-DD"),
    endDate: z.string().regex(ISO_DATE, "endDate must be YYYY-MM-DD").optional(),
    allDay: z.boolean().default(true),
    startTime: z.string().regex(HHMM, "startTime must be HH:MM").nullish(),
    endTime: z.string().regex(HHMM, "endTime must be HH:MM").nullish(),
    reason: z.string().trim().max(200).nullish(),
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime), {
    message: "A partial block needs both startTime and endTime",
  })
  .refine((v) => v.allDay || v.startTime < v.endTime, {
    message: "startTime must be before endTime",
  })
  .refine((v) => !v.endDate || v.endDate >= v.date, {
    message: "endDate must not be before date",
  });

const toClient = (b) => ({
  id: b.id,
  date: toIsoDay(b.date),
  allDay: b.allDay,
  startTime: b.startTime,
  endTime: b.endTime,
  reason: b.reason,
  createdAt: new Date(b.createdAt).getTime(),
});

/** Generate all dates in a range (inclusive) */
function eachDayInRange(startIso, endIso) {
  const days = [];
  const start = new Date(`${startIso}T00:00:00.000Z`);
  const end = new Date(`${endIso}T00:00:00.000Z`);
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    days.push(new Date(t));
  }
  return days;
}

export async function GET(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = dateOnly(from);
      if (to) where.date.lte = dateOnly(to);
    }

    const blocks = await prisma.availabilityBlock.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return Response.json(blocks.map(toClient));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const parsed = CreateBlock.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid block");
    }
    const { date, endDate, allDay, startTime, endTime, reason } = parsed.data;

    // Single day or date range?
    const dates = endDate ? eachDayInRange(date, endDate) : [dateOnly(date)];

    // Limit range to 90 days to prevent accidents
    if (dates.length > 90) {
      throw new HttpError(400, "Cannot block more than 90 days at once");
    }

    const data = dates.map((d) => ({
      date: d,
      allDay,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      reason: reason || null,
    }));

    // Create all blocks (skip duplicates based on date+time combination)
    const created = await prisma.availabilityBlock.createMany({
      data,
      skipDuplicates: true,
    });

    // Return the created blocks for confirmation
    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        date: { gte: dateOnly(date), lte: dateOnly(endDate || date) },
        ...(allDay ? { allDay: true } : { startTime, endTime }),
      },
      orderBy: { date: "asc" },
    });

    return Response.json({
      count: created.count,
      blocks: blocks.map(toClient),
    }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
