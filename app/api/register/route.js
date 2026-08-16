import { z } from "zod";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import {
  isHoneypotFilled,
  isDisposableEmail,
  checkRateLimit,
  RATE_LIMITS,
  getClientIP,
} from "@/lib/bot-protection";

export const dynamic = "force-dynamic";

const MIN_FORM_TIME_MS = 2500;

const Register = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().trim().max(30).optional(),
  website: z.string().optional(),
  _t: z.string().optional(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = Register.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid signup");
    }
    const { name, email, password, phone, website, _t } = parsed.data;
    const normalised = email.toLowerCase().trim();

    // === BOT PROTECTION ===

    // 1. Honeypot - silent reject
    if (isHoneypotFilled(website)) {
      console.log("[register] Honeypot triggered");
      return Response.json({ id: "fake", name, email: normalised, role: "MEMBER" }, { status: 201 });
    }

    // 2. Timing check - silent reject
    if (_t) {
      try {
        const decoded = atob(_t);
        const [obfuscatedStr] = decoded.split(".");
        const obfuscated = parseInt(obfuscatedStr, 10);
        const secretNum = 42 * 100;
        const timestamp = obfuscated ^ secretNum;
        const elapsed = Date.now() - timestamp;
        if (elapsed < MIN_FORM_TIME_MS || elapsed > 60 * 60 * 1000) {
          console.log("[register] Timing check failed", { elapsed });
          return Response.json({ id: "fake", name, email: normalised, role: "MEMBER" }, { status: 201 });
        }
      } catch {
        console.log("[register] Invalid timing token");
        return Response.json({ id: "fake", name, email: normalised, role: "MEMBER" }, { status: 201 });
      }
    }

    // 3. Rate limiting
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit("signup", ip, RATE_LIMITS.signup.maxAttempts, RATE_LIMITS.signup.windowMs);
    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many signup attempts. Please try again later.");
    }

    // 4. Disposable email check
    if (isDisposableEmail(normalised)) {
      throw new HttpError(400, "Please use a permanent email address, not a temporary one.");
    }

    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) throw new HttpError(409, "An account with that email already exists.");

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalised,
        phone: phone || null,
        role: "MEMBER", // self-signup can never mint an admin
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    // Link any guest bookings to this new account (case-insensitive match)
    const linkedBookings = await prisma.booking.updateMany({
      where: {
        email: { equals: normalised, mode: "insensitive" },
        userId: null,
      },
      data: { userId: user.id },
    });

    if (linkedBookings.count > 0) {
      console.log(`[register] Linked ${linkedBookings.count} guest booking(s) to new user ${user.email}`);
    }

    // Mark any matching lead as "converted" since they just became a member
    const lead = await prisma.lead.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
    });
    if (lead && lead.status !== "converted") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "converted" },
      });
      console.log(`[register] Marked lead ${lead.email} as converted`);
    }

    // Never return the hash.
    return Response.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    return jsonError(err);
  }
}
