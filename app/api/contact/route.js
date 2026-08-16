import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { sendContactEmail } from "@/lib/email";
import {
  isHoneypotFilled,
  checkRateLimit,
  RATE_LIMITS,
  getClientIP,
} from "@/lib/bot-protection";

export const dynamic = "force-dynamic";

const INTEREST_LABELS = {
  group: "Group Classes",
  pt: "1:1 Personal Training",
  membership: "Membership Info",
  general: "General Question",
};

// Minimum time (ms) for a human to fill the form
const MIN_FORM_TIME_MS = 2500;

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(254),
  phone: z.string().trim().max(30).nullable().optional(),
  interest: z.string().max(50).nullable().optional(),
  message: z.string().trim().min(1, "Message is required").max(5000),
  // Bot protection fields
  website: z.string().optional(), // Honeypot
  _t: z.string().optional(),      // Timing token
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid form data");
    }

    const { name, email, phone, interest, message, website, _t } = parsed.data;

    // === BOT PROTECTION CHECKS ===

    // 1. Honeypot check - if filled, silently accept (fake success to confuse bots)
    if (isHoneypotFilled(website)) {
      console.log("[contact] Honeypot triggered, silent reject");
      return Response.json({ success: true });
    }

    // 2. Timing check - if too fast, silently accept
    if (_t) {
      try {
        const decoded = atob(_t);
        const [obfuscatedStr] = decoded.split(".");
        const obfuscated = parseInt(obfuscatedStr, 10);
        const secretNum = 42 * 100; // Must match client-side
        const timestamp = obfuscated ^ secretNum;
        const elapsed = Date.now() - timestamp;

        // Only reject if too fast (bot behavior) - allow long form sessions
        if (elapsed < MIN_FORM_TIME_MS) {
          console.log("[contact] Timing check failed (too fast), silent reject", { elapsed });
          return Response.json({ success: true });
        }
        // Warn but don't reject if token is very old (user had page open a long time)
        if (elapsed > 24 * 60 * 60 * 1000) {
          console.log("[contact] Timing token very old, but allowing submission", { elapsed });
        }
      } catch {
        // Invalid token - could be bot, silently reject
        console.log("[contact] Invalid timing token, silent reject");
        return Response.json({ success: true });
      }
    }

    // 3. Rate limiting - this one we do tell the user about
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(
      "contact",
      ip,
      RATE_LIMITS.contact.maxAttempts,
      RATE_LIMITS.contact.windowMs
    );
    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many submissions. Please try again later.");
    }
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
