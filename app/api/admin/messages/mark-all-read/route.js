import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/messages/mark-all-read
 * Mark all unread contact form messages as read
 */
export async function POST() {
  try {
    await requireAdmin();
    const prisma = getPrisma();

    const result = await prisma.lead.updateMany({
      where: {
        source: "contact",
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return Response.json({ success: true, count: result.count });
  } catch (err) {
    return jsonError(err);
  }
}
