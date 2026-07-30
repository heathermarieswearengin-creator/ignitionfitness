import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, jsonError } from "@/lib/tx";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const PackageInput = z
  .object({
    id: z.string().optional(), // present = edit
    name: z.string().trim().min(1, "Name is required"),
    type: z.enum(["GROUP", "PT"]),
    totalCredits: z.coerce.number().int().min(0),
    price: z.coerce.number().int().min(0),
    unlimited: z.boolean().default(false),
    durationDays: z.coerce.number().int().positive().nullish(),
    active: z.boolean().default(true),
  })
  .refine((v) => v.unlimited || v.totalCredits > 0, {
    message: "A credit package needs at least one credit",
  })
  .refine((v) => !v.unlimited || v.durationDays, {
    message: "An unlimited membership needs a duration in days",
  });

export async function GET() {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const packages = await prisma.package.findMany({
      orderBy: [{ active: "desc" }, { type: "asc" }, { price: "asc" }],
      include: { _count: { select: { memberPackages: true } } },
    });
    return Response.json(
      packages.map((p) => ({ ...p, assignedCount: p._count.memberPackages, _count: undefined }))
    );
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const parsed = PackageInput.safeParse(await request.json());
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid package");
    }
    const { id, ...data } = parsed.data;
    // Unlimited memberships never carry credits.
    if (data.unlimited) data.totalCredits = 0;
    else data.durationDays = data.durationDays ?? null;

    const pkg = id
      ? await prisma.package.update({ where: { id }, data })
      : await prisma.package.create({ data });

    return Response.json(pkg, { status: id ? 200 : 201 });
  } catch (err) {
    return jsonError(err);
  }
}
