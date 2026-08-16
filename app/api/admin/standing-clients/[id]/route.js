import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().positive().optional(),
  endDate: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

/**
 * PATCH /api/admin/standing-clients/[id]
 * Update a standing client
 */
export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const existing = await prisma.standingClient.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Standing client not found");

    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid data");
    }

    const data = {};
    if (parsed.data.daysOfWeek) data.daysOfWeek = parsed.data.daysOfWeek;
    if (parsed.data.startTime) data.startTime = parsed.data.startTime;
    if (parsed.data.durationMin) data.durationMin = parsed.data.durationMin;
    if (parsed.data.endDate !== undefined) {
      data.endDate = parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00.000Z`) : null;
    }
    if (parsed.data.active !== undefined) data.active = parsed.data.active;

    const updated = await prisma.standingClient.update({
      where: { id },
      data,
      include: { member: { select: { name: true } } },
    });

    return Response.json({
      success: true,
      standingClient: {
        id: updated.id,
        memberName: updated.member.name,
        daysOfWeek: updated.daysOfWeek,
        startTime: updated.startTime,
        active: updated.active,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * DELETE /api/admin/standing-clients/[id]
 * Remove a standing client entirely
 */
export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const existing = await prisma.standingClient.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Standing client not found");

    await prisma.standingClient.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
