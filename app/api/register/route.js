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
    const normalised = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) throw new HttpError(409, "An account with that email already exists.");

    const user = await prisma.user.create({
      data: {
        name,
        email: normalised,
        phone: phone || null,
        role: "MEMBER", // self-signup can never mint an admin
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    // Never return the hash.
    return Response.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    return jsonError(err);
  }
}
