import { minuteOfDay, studioNow } from "@/lib/config";
import { toIsoDay, to12h, DB_TO_CLASS_TYPE, DB_TO_STATUS, dateOnly } from "@/lib/shape";

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
 * Check if a PT slot is covered by a standing client reservation.
 * Returns the standing client info if it is, null otherwise.
 */
export function getStandingClientForSlot(isoDay, startTime, sessionType, standingClients) {
  if (sessionType !== "PT") return null;

  const date = new Date(`${isoDay}T00:00:00.000Z`);
  const dow = date.getUTCDay();

  for (const sc of standingClients) {
    // Check if this standing client covers this day and time
    if (!sc.daysOfWeek.includes(dow)) continue;
    if (sc.startTime !== startTime) continue;

    // Check if still active
    if (!sc.active) continue;

    // Check end date
    if (sc.endDate && new Date(`${isoDay}T00:00:00.000Z`) > sc.endDate) continue;

    // Check if this specific date is skipped
    const isSkipped = sc.skips?.some(
      (skip) => toIsoDay(skip.date) === isoDay
    );
    if (isSkipped) continue;

    // This slot is covered by this standing client
    return {
      standingClientId: sc.id,
      memberId: sc.memberId,
      memberName: sc.member?.name || "Standing Client",
      memberEmail: sc.member?.email,
    };
  }

  return null;
}

/**
 * Bookable slots between two YYYY-MM-DD days: template slots materialised into
 * sessions, minus cancelled ones, minus availability blocks, minus standing
 * client reservations, minus anything already in the past, each carrying its
 * live booked/spotsLeft count.
 */
export async function getAvailability(prisma, fromIso, toIso, { includePast = false } = {}) {
  const from = dateOnly(fromIso);
  const to = dateOnly(toIso);

  await ensureSessions(prisma, from, to);

  const [sessions, blocks, standingClients] = await Promise.all([
    prisma.classSession.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.availabilityBlock.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.standingClient.findMany({
      where: { active: true },
      include: {
        member: { select: { name: true, email: true } },
        skips: { where: { date: { gte: from, lte: to } } },
      },
    }),
  ]);

  const now = studioNow();

  return sessions
    .filter((s) => s.status !== "CANCELLED")
    .map((s) => {
      const isoDay = toIsoDay(s.date);
      const booked = s._count.bookings;
      const standingClient = getStandingClientForSlot(isoDay, s.startTime, s.type, standingClients);
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
        standingClient, // null for public slots, object for reserved ones
      };
    })
    .filter((s) => !s.blocked)
    .filter((s) => !s.standingClient) // Exclude standing client slots from public availability
    .filter((s) => {
      if (includePast) return true;
      if (s.date > now.isoDay) return true;
      if (s.date < now.isoDay) return false;
      return minuteOfDay(s.startTime) > now.minutes;
    });
}

/**
 * The coach's view: every session in the range including cancelled, blocked
 * and already-run ones, each with its attendee list. Nothing is filtered out —
 * the calendar needs the whole picture, and flags say what's what.
 */
export async function getAdminSessions(prisma, fromIso, toIso) {
  const from = dateOnly(fromIso);
  const to = dateOnly(toIso);

  await ensureSessions(prisma, from, to);

  const [sessions, blocks, standingClients] = await Promise.all([
    prisma.classSession.findMany({
      where: { date: { gte: from, lte: to } },
      include: {
        bookings: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true, ref: true, name: true, email: true, phone: true,
            status: true, isDropIn: true, paymentStatus: true, userId: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.availabilityBlock.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.standingClient.findMany({
      where: { active: true },
      include: {
        member: { select: { id: true, name: true, email: true } },
        skips: { where: { date: { gte: from, lte: to } } },
      },
    }),
  ]);

  const now = studioNow();

  return sessions.map((s) => {
    const isoDay = toIsoDay(s.date);
    const attendees = s.bookings.map((b) => ({
      bookingId: b.id,
      ref: b.ref,
      name: b.name,
      email: b.email,
      phone: b.phone ?? "",
      status: DB_TO_STATUS[b.status],
      isDropIn: b.isDropIn,
      paymentStatus: b.paymentStatus,
      isMember: Boolean(b.userId),
    }));
    const booked = attendees.filter((a) => a.status !== "cancelled").length;
    const standingClient = getStandingClientForSlot(isoDay, s.startTime, s.type, standingClients);

    return {
      sessionId: s.id,
      date: isoDay,
      startTime: s.startTime,
      time: to12h(s.startTime),
      type: s.type,
      classType: DB_TO_CLASS_TYPE[s.type],
      capacity: s.capacity,
      durationMin: s.durationMin,
      status: s.status,
      notes: s.notes,
      booked,
      spotsLeft: Math.max(0, s.capacity - booked),
      blocked: isBlocked(isoDay, s.startTime, blocks),
      standingClient, // null or { standingClientId, memberId, memberName, memberEmail }
      past:
        isoDay < now.isoDay ||
        (isoDay === now.isoDay && minuteOfDay(s.startTime) <= now.minutes),
      attendees,
    };
  });
}
