import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { toClientLead } from "@/lib/shape";

export const dynamic = "force-dynamic";

const CreateLead = z.object({
  email: z.string().trim().email("Valid email is required"),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  source: z.string().trim().default("web"),
});

export async function GET() {
  try {
    const prisma = getPrisma();
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "asc" } });
    return Response.json(leads.map(toClientLead));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const parsed = CreateLead.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid lead");
    }
    const { email, name, phone, source } = parsed.data;
    const normalised = email.toLowerCase();

    // Dedupe server-side: the prototype did this client-side, which only
    // worked because every visitor had their own copy of the list.
    const existing = await prisma.lead.findFirst({ where: { email: normalised } });
    if (existing) {
      return Response.json(toClientLead(existing), { status: 200 });
    }

    const lead = await prisma.lead.create({
      data: { email: normalised, name: name || null, phone: phone || null, source },
    });
    return Response.json(toClientLead(lead), { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
