import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js auto-loads .env.local, but the Prisma CLI does NOT. Load it here so
// `prisma migrate` / `prisma db seed` can see the Vercel-provisioned connection
// strings. .env.local is loaded first and wins (dotenv does not overwrite).
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

// Migrations need a direct (non-pooled) connection — pgbouncer breaks DDL.
// The Neon/Vercel integration's variable naming varies, so fall back through
// the known aliases before giving up on the pooled URL.
const migrationUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: migrationUrl },
  migrations: { seed: "node prisma/seed.mjs" },
});
