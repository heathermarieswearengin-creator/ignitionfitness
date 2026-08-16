import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const SkipSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  reason: z.string().optional(),
});

/**
 * POST /api/admin/standing-clients/[id]/skip
 * Skip a single occurrence
 */
export async function POST(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const standingClient = await prisma.standingClient.findUnique({ where: { id } });
    if (!standingClient) throw new HttpError(404, "Standing client not found");

    const body = await request.json();
    const parsed = SkipSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid data");
    }

    const { date, reason } = parsed.data;
    const dateObj = new Date(`${date}T00:00:00.000Z`);

    // Verify the date falls on one of the standing client's days
    const dow = dateObj.getUTCDay();
    if (!standingClient.daysOfWeek.includes(dow)) {
      throw new HttpError(400, "This date is not a scheduled day for this standing client");
    }

    // Check if already skipped
    const existingSkip = await prisma.standingClientSkip.findUnique({
      where: { standingClientId_date: { standingClientId: id, date: dateObj } },
    });
    if (existingSkip) {
      throw new HttpError(409, "This date is already skipped");
    }

    await prisma.standingClientSkip.create({
      data: {
        standingClientId: id,
        date: dateObj,
        reason: reason || null,
      },
    });

    return Response.json({ success: true, skippedDate: date });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * DELETE /api/admin/standing-clients/[id]/skip
 * Un-skip a single occurrence (restore it)
 */
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) throw new HttpError(400, "Date parameter required");

    const dateObj = new Date(`${date}T00:00:00.000Z`);

    const skip = await prisma.standingClientSkip.findUnique({
      where: { standingClientId_date: { standingClientId: id, date: dateObj } },
    });
    if (!skip) throw new HttpError(404, "Skip not found");

    await prisma.standingClientSkip.delete({
      where: { id: skip.id },
    });

    return Response.json({ success: true, restoredDate: date });
  } catch (err) {
    return jsonError(err);
  }
}
