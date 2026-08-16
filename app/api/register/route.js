import { z } from "zod";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";

export const dynamic = "force-dynamic";

const Register = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional(),
});

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const parsed = Register.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid signup");
    }
    const { name, email, password, phone } = parsed.data;
    const normalised = email.toLowerCase().trim();

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
