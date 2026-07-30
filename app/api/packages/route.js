import { getPrisma } from "@/lib/prisma";
import { jsonError } from "@/lib/tx";

export const dynamic = "force-dynamic";

// Public catalog.
export async function GET() {
  try {
    const prisma = getPrisma();
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { price: "asc" }],
    });
    return Response.json(packages);
  } catch (err) {
    return jsonError(err);
  }
}
