import { minuteOfDay, studioNow } from "@/lib/config";
import { toIsoDay, to12h, DB_TO_CLASS_TYPE, dateOnly } from "@/lib/shape";

/** Inclusive list of UTC-midnight Dates from `from` to `to`. */
export function eachDay(from, to) {
  const days = [];
  for (let t = from.getTime(); t <= to.getTime(); t += 86400000) days.push(new Date(t));
  return days;
}

/**
 * Materialise ClassSession rows for every template slot in the range that
 * doesn't have one yet. skipDuplicates leans on the
 * @@unique([date, startTime, type]) constraint, so concurrent callers can't
 * create the same slot twice.
 */
export async function ensureSessions(prisma, from, to) {
  const [templates, existing] = await Promise.all([
    prisma.weeklyTemplate.findMany({ where: { active: true } }),
    prisma.classSession.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, startTime: true, type: true },
    }),
  ]);

  const seen = new Set(
    existing.map((s) => `${toIsoDay(s.date)}|${s.startTime}|${s.type}`)
  );

  const toCreate = [];
  for (const day of eachDay(from, to)) {
    const dow = day.getUTCDay();
    for (const t of templates) {
      if (t.dayOfWeek !== dow) continue;
      const key = `${toIsoDay(day)}|${t.startTime}|${t.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      toCreate.push({
        date: day,
        startTime: t.startTime,
        type: t.type,
        capacity: t.capacity,
        durationMin: t.durationMin,
      });
    }
  }

  if (toCreate.length) {
    await prisma.classSession.createMany({ data: toCreate, skipDuplicates: true });
  }
  return toCreate.length;
}

/** A slot is blocked if an all-day block covers its date, or a partial block spans its start. */
export function isBlocked(isoDay, startTime, blocks) {
  const mins = minuteOfDay(startTime);
  return blocks.some((b) => {
    if (toIsoDay(b.date) !== isoDay) return false;
    if (b.allDay) return true;
    const start = b.startTime ? minuteOfDay(b.startTime) : 0;
    const end = b.endTime ? minuteOfDay(b.endTime) : 24 * 60;
    return mins >= start && mins < end;
  });
}

/**
 * Bookable slots between two YYYY-MM-DD days: template slots materialised into
 * sessions, minus cancelled ones, minus availability blocks, minus anything
 * already in the past, each carrying its live booked/spotsLeft count.
 */
export async function getAvailability(prisma, fromIso, toIso, { includePast = false } = {}) {
  const from = dateOnly(fromIso);
  const to = dateOnly(toIso);

  await ensureSessions(prisma, from, to);

  const [sessions, blocks] = await Promise.all([
    prisma.classSession.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.availabilityBlock.findMany({ where: { date: { gte: from, lte: to } } }),
  ]);

  const now = studioNow();

  return sessions
    .filter((s) => s.status !== "CANCELLED")
    .map((s) => {
      const isoDay = toIsoDay(s.date);
      const booked = s._count.bookings;
      return {
        sessionId: s.id,
        date: isoDay,
        startTime: s.startTime,
        time: to12h(s.startTime), // convenience for the existing UI
        type: s.type,
        classType: DB_TO_CLASS_TYPE[s.type],
        capacity: s.capacity,
        durationMin: s.durationMin,
        booked,
        spotsLeft: Math.max(0, s.capacity - booked),
        status: s.status,
        blocked: isBlocked(isoDay, s.startTime, blocks),
      };
    })
    .filter((s) => !s.blocked)
    .filter((s) => {
      if (includePast) return true;
      if (s.date > now.isoDay) return true;
      if (s.date < now.isoDay) return false;
      return minuteOfDay(s.startTime) > now.minutes;
    });
}
