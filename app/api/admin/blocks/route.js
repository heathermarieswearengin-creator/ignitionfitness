import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { dateOnly, toIsoDay } from "@/lib/shape";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const CreateBlock = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
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
    const { date, allDay, startTime, endTime, reason } = parsed.data;

    const block = await prisma.availabilityBlock.create({
      data: {
        date: dateOnly(date),
        allDay,
        startTime: allDay ? null : startTime,
        endTime: allDay ? null : endTime,
        reason: reason || null,
      },
    });
    return Response.json(toClient(block), { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
