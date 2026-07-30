import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Lazy singleton. Next.js evaluates top-level module code at build time, when
// DATABASE_URL may not be set yet — constructing eagerly would crash the build.
// Deliberately a plain function, NOT a Proxy wrapper: Auth.js inspects the
// client object and a Proxy silently breaks the auth request chain.
const g = globalThis;

export function getPrisma() {
  if (!g.__ignitionPrisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Run `vercel env pull .env.local` after provisioning the database."
      );
    }
    g.__ignitionPrisma = new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
    });
  }
  return g.__ignitionPrisma;
}
