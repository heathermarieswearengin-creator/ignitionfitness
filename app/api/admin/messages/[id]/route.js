import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/messages/[id]
 * Mark a message as read
 */
export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const prisma = getPrisma();

    const message = await prisma.lead.findUnique({ where: { id } });
    if (!message) throw new HttpError(404, "Message not found");
    if (message.source !== "contact") throw new HttpError(400, "Not a contact message");

    // Mark as read if not already
    if (!message.readAt) {
      await prisma.lead.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
