import { config as loadEnv } from "dotenv";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Plain `node` does not auto-load .env.local the way Next.js does.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No database connection string found. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

// Mirrors the WEEKLY constant in app/page.jsx. 0=Sun … 6=Sat, times in 24h.
const GROUP_SLOTS = {
  1: ["06:00", "09:00", "12:00", "17:30", "18:30"],
  2: ["06:00", "09:00", "17:30", "18:30"],
  3: ["06:00", "09:00", "12:00", "17:30", "18:30"],
  4: ["06:00", "09:00", "17:30", "18:30"],
  5: ["06:00", "09:00", "12:00", "17:30"],
  6: ["08:00", "09:30"],
};

// 1:1 slots sit at times the group schedule doesn't use, so one coach is never
// double-booked. Capacity 1 by definition.
const PT_SLOTS = {
  1: ["07:30", "16:00"],
  2: ["07:30"],
  3: ["07:30", "16:00"],
  4: ["07:30"],
  5: ["16:00"],
};

// Prices mirror the pricing cards in app/page.jsx (~lines 544-567).
const PACKAGES = [
  { name: "Drop-In", type: "GROUP", totalCredits: 1, price: 25 },
  { name: "Biweekly Unlimited", type: "GROUP", totalCredits: 999, price: 75 },
  { name: "1:1 Single Session", type: "PT", totalCredits: 1, price: 80 },
  { name: "1:1 8-Session Pack", type: "PT", totalCredits: 8, price: 560 },
  { name: "1:1 12-Session Pack", type: "PT", totalCredits: 12, price: 780 },
];

async function main() {
  // ---- admin ----
  const adminEmail = (process.env.ADMIN_EMAIL || "mike@ignitionfitness.com").toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (!adminPassword) {
    adminPassword = randomBytes(12).toString("base64url");
    generated = true;
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Coach Mike",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });
  console.log(`admin: ${admin.email}`);
  if (generated) {
    console.log("\n  !! ADMIN_PASSWORD was not set, so one was generated:");
    console.log(`  !! ${adminPassword}`);
    console.log("  !! Save it now and set ADMIN_PASSWORD in .env.local — it is not stored anywhere.\n");
  }

  // ---- weekly template ----
  // Cleared and rebuilt so re-running seed never duplicates slots.
  await prisma.weeklyTemplate.deleteMany({});
  const templates = [];
  for (const [day, times] of Object.entries(GROUP_SLOTS)) {
    for (const startTime of times) {
      templates.push({ dayOfWeek: Number(day), startTime, type: "GROUP", capacity: 10, durationMin: 60 });
    }
  }
  for (const [day, times] of Object.entries(PT_SLOTS)) {
    for (const startTime of times) {
      templates.push({ dayOfWeek: Number(day), startTime, type: "PT", capacity: 1, durationMin: 60 });
    }
  }
  await prisma.weeklyTemplate.createMany({ data: templates });
  console.log(`weekly template: ${templates.length} recurring slots`);

  // ---- package catalog ----
  for (const p of PACKAGES) {
    const existing = await prisma.package.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.package.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.package.create({ data: p });
    }
  }
  console.log(`packages: ${PACKAGES.length} catalog entries`);

  // ---- demo member with an assigned package, so admin views aren't empty ----
  const demoEmail = "sarah.m@email.com";
  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Sarah Mendez",
      phone: "909-555-0142",
      role: "MEMBER",
      passwordHash: await bcrypt.hash(randomBytes(12).toString("base64url"), 10),
    },
  });

  const eightPack = await prisma.package.findFirst({ where: { name: "1:1 8-Session Pack" } });
  const hasPackage = await prisma.memberPackage.findFirst({ where: { userId: demo.id } });
  if (eightPack && !hasPackage) {
    // Credit changes and their log entry must always be written together.
    await prisma.$transaction(async (tx) => {
      const mp = await tx.memberPackage.create({
        data: {
          userId: demo.id,
          type: eightPack.type,
          creditsRemaining: eightPack.totalCredits,
          packageId: eightPack.id,
        },
      });
      await tx.packageLog.create({
        data: {
          memberPackageId: mp.id,
          delta: eightPack.totalCredits,
          reason: "assigned",
          note: "Seed data",
          adminId: admin.id,
        },
      });
    });
  }
  console.log(`demo member: ${demo.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
