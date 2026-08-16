import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/messages
 * Returns all contact form submissions (leads with source="contact")
 */
export async function GET() {
  try {
    await requireAdmin();
    const prisma = getPrisma();

    const messages = await prisma.lead.findMany({
      where: { source: "contact" },
      orderBy: { createdAt: "desc" },
    });

    // Parse the notes field to extract interest and message
    const parsed = messages.map((m) => {
      let interest = null;
      let message = m.notes || "";

      // Extract interest from notes format: "[timestamp] Contact form (Interest): message"
      const match = m.notes?.match(/\[.*?\] Contact form(?: \(([^)]+)\))?: ([\s\S]*)/);
      if (match) {
        interest = match[1] || null;
        message = match[2]?.trim() || "";
      }

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        interest,
        message,
        status: m.status,
        readAt: m.readAt,
        createdAt: m.createdAt,
      };
    });

    // Also return unread count for badge
    const unreadCount = messages.filter((m) => !m.readAt).length;

    return Response.json({ messages: parsed, unreadCount });
  } catch (err) {
    return jsonError(err);
  }
}
