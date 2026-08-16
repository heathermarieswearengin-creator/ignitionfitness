import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { sendContactEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const INTEREST_LABELS = {
  group: "Group Classes",
  pt: "1:1 Personal Training",
  membership: "Membership Info",
  general: "General Question",
};

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().nullable().optional(),
  interest: z.string().nullable().optional(),
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(request) {
  try {
    const parsed = ContactSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid form data");
    }

    const { name, email, phone, interest, message } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const interestLabel = interest ? INTEREST_LABELS[interest] || interest : null;

    const prisma = getPrisma();

    // Check if lead already exists with this email
    const existingLead = await prisma.lead.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (existingLead) {
      // Update existing lead with new contact info and append to notes
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const newNote = `[${timestamp}] Contact form${interestLabel ? ` (${interestLabel})` : ""}: ${message}`;
      const updatedNotes = existingLead.notes
        ? `${existingLead.notes}\n\n${newNote}`
        : newNote;

      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name: name || existingLead.name,
          phone: phone || existingLead.phone,
          notes: updatedNotes,
          // Reset status to "new" if they were marked dead, since they're reaching out again
          status: existingLead.status === "dead" ? "new" : existingLead.status,
        },
      });
    } else {
      // Create new lead
      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const notes = `[${timestamp}] Contact form${interestLabel ? ` (${interestLabel})` : ""}: ${message}`;

      await prisma.lead.create({
        data: {
          name,
          email: normalizedEmail,
          phone: phone || null,
          source: "contact",
          status: "new",
          notes,
        },
      });
    }

    // Send email to both recipients
    const emailResult = await sendContactEmail({
      name,
      email: normalizedEmail,
      phone,
      interest: interestLabel,
      message,
    });

    // If both sends failed, return error
    if (!emailResult.sent) {
      console.error("[contact] All email sends failed");
      throw new HttpError(500, "Failed to send message. Please try again or email us directly.");
    }

    // Log partial failure but still succeed
    if (emailResult.partialFailure) {
      console.warn("[contact] Partial email send failure - some recipients may not have received the email");
    }

    return Response.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
