import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";
import { toClientLead } from "@/lib/shape";

export const dynamic = "force-dynamic";

const PatchLead = z
  .object({
    status: z.enum(["new", "contacted", "converted", "dead"]).optional(),
    notes: z.string().trim().max(2000).nullish(),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { id } = await params;

    const parsed = PatchLead.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid update");
    }

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Lead not found");

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
      },
    });

    return Response.json(toClientLead(lead));
  } catch (err) {
    return jsonError(err);
  }
}
