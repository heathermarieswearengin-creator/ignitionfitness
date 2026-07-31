import { STUDIO } from "@/lib/config";

/**
 * How far `timeZone` is ahead of UTC at a given instant, in milliseconds.
 * Derived by rendering the instant in that zone and reading it back as if it
 * were UTC — the gap between the two is the offset.
 */
function tzOffsetMs(ts, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));

  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asIfUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
  return asIfUtc - ts;
}

/**
 * "2026-08-03" + "06:00" at the studio -> the real UTC instant.
 *
 * Slot times are stored timezone-naive ("06:00" means 6am at the gym), so a
 * calendar invite has to resolve them against America/Los_Angeles — including
 * whether that particular date is in daylight saving. Applying the offset
 * shifts the instant, which can itself cross a DST boundary, so the offset is
 * recomputed once and reapplied if it changed.
 */
export function studioInstant(isoDay, hhmm, timeZone = STUDIO.timeZone) {
  const naive = Date.parse(`${isoDay}T${hhmm}:00.000Z`);
  const first = tzOffsetMs(naive, timeZone);
  let ts = naive - first;
  const second = tzOffsetMs(ts, timeZone);
  if (second !== first) ts = naive - second;
  return new Date(ts);
}

/** Date -> "20260803T130000Z", the format both iCalendar and Google expect. */
export function toUtcStamp(date) {
  return new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Start and end stamps for a session, honouring its duration. */
export function sessionStamps(isoDay, hhmm, durationMin) {
  const start = studioInstant(isoDay, hhmm);
  const end = new Date(start.getTime() + durationMin * 60000);
  return { start, end, startStamp: toUtcStamp(start), endStamp: toUtcStamp(end) };
}
