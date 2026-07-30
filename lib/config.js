// Single source of truth for studio details. Previously hard-coded inline in
// app/page.jsx; the .ics builder and confirmation emails need it too.
export const STUDIO = {
  name: "Ignition Fitness",
  addressLine: "9125 Archibald Ave, Ste D",
  fullAddress: "9125 Archibald Ave Ste D, Rancho Cucamonga, CA 91730",
  // Slot times like "06:00" mean 6am *at the studio*, not UTC. Everything that
  // compares a slot against "now" has to do it in this zone.
  timeZone: "America/Los_Angeles",
};

// How far ahead the booking calendar runs, and the hard cap on how much
// availability a single request may materialise.
export const BOOKING_WINDOW_DAYS = 14;
export const MAX_RANGE_DAYS = 90;

/**
 * Current date + minute-of-day in the studio's timezone, so we never offer a
 * slot that has already happened (a 9pm visitor must not book today's 6am).
 */
export function studioNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t) => parts.find((p) => p.type === t)?.value;
  // en-CA renders midnight as "24" in some runtimes; normalise it.
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    isoDay: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(hour) * 60 + Number(get("minute")),
  };
}

/** "17:30" -> 1050 */
export function minuteOfDay(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}
