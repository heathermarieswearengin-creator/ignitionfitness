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

// Mike's actual schedule. 0=Sun … 6=Sat, times in 24h.
// Group: Mon/Wed 5:30pm, Sat 8:45am
const GROUP_SLOTS = {
  1: ["17:30"],        // Monday 5:30 PM
  3: ["17:30"],        // Wednesday 5:30 PM
  6: ["08:45"],        // Saturday 8:45 AM
};

// PT availability: 6am/8am/11am/1pm Mon-Fri, plus Tue 6pm, Thu 5pm
const PT_SLOTS = {
  1: ["06:00", "08:00", "11:00", "13:00"],  // Monday
  2: ["06:00", "08:00", "11:00", "13:00", "18:00"],  // Tuesday + 6pm
  3: ["06:00", "08:00", "11:00", "13:00"],  // Wednesday
  4: ["06:00", "08:00", "11:00", "13:00", "17:00"],  // Thursday + 5pm
  5: ["06:00", "08:00", "11:00", "13:00"],  // Friday
};

// Prices mirror the pricing cards in app/page.jsx.
// "Biweekly Unlimited" is time-based, not credit-based: it grants unlimited
// group classes for 14 days rather than draining a credit count.
const PACKAGES = [
  { name: "Drop-In", type: "GROUP", totalCredits: 1, price: 25, unlimited: false, durationDays: null },
  { name: "Biweekly Unlimited", type: "GROUP", totalCredits: 0, price: 75, unlimited: true, durationDays: 14 },
  { name: "1:1 Single Session", type: "PT", totalCredits: 1, price: 80, unlimited: false, durationDays: null },
  { name: "1:1 8-Session Pack", type: "PT", totalCredits: 8, price: 560, unlimited: false, durationDays: null },
  { name: "1:1 12-Session Pack", type: "PT", totalCredits: 12, price: 780, unlimited: false, durationDays: null },
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

  // ---- generate 8 weeks of sessions ----
  const WEEKS_AHEAD = 8;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clear existing future sessions (keeps past bookings intact)
  await prisma.classSession.deleteMany({
    where: { date: { gte: today } }
  });

  const sessions = [];
  for (let week = 0; week < WEEKS_AHEAD; week++) {
    for (const tmpl of templates) {
      // Find next occurrence of this day of week
      const date = new Date(today);
      date.setDate(date.getDate() + ((tmpl.dayOfWeek - date.getDay() + 7) % 7) + (week * 7));

      // Skip if date is in the past
      if (date < today) continue;

      sessions.push({
        date: date,
        startTime: tmpl.startTime,
        type: tmpl.type,
        capacity: tmpl.capacity,
        durationMin: tmpl.durationMin,
        status: "SCHEDULED",
      });
    }
  }

  // Use createMany with skipDuplicates to avoid conflicts
  let created = 0;
  for (const sess of sessions) {
    try {
      await prisma.classSession.create({ data: sess });
      created++;
    } catch (e) {
      // Skip duplicates (unique constraint on date+startTime+type)
    }
  }
  console.log(`sessions: ${created} bookable slots for next ${WEEKS_AHEAD} weeks`);

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
  // Opt-in only: re-seeding a live database must never reintroduce fake
  // members. Run with SEED_DEMO=true when you want sample data.
  if (process.env.SEED_DEMO !== "true") {
    console.log("demo member: skipped (set SEED_DEMO=true to create one)");
    return;
  }

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
