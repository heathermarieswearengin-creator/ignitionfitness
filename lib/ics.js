import { STUDIO } from "@/lib/config";
import { sessionStamps, toUtcStamp } from "@/lib/time";

const CLASS_TITLE = { GROUP: "Group Class", PT: "1:1 Personal Training" };

// RFC 5545: escape , ; \ and newlines in text values.
const esc = (s) =>
  String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// Lines must not exceed 75 octets; continuations start with a single space.
function fold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    out.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) out.push(" " + rest);
  return out.join("\r\n");
}

/**
 * One VEVENT for a booking. `booking` carries the client shape plus its
 * session type/duration.
 */
export function bookingEvent(b, { stamp } = {}) {
  const title = CLASS_TITLE[b.sessionType] ?? "Ignition Fitness";
  const { startStamp, endStamp } = sessionStamps(b.date, b.startTime, b.durationMin ?? 60);

  return [
    "BEGIN:VEVENT",
    `UID:${b.ref}@ignitionfitness.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startStamp}`,
    `DTEND:${endStamp}`,
    fold(`SUMMARY:${esc(`${title} · ${STUDIO.name}`)}`),
    fold(`LOCATION:${esc(STUDIO.fullAddress)}`),
    fold(`DESCRIPTION:${esc(`Confirmation ${b.ref}. Arrive a few minutes early. Cancel free up to 12 hours before.`)}`),
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].join("\r\n");
}

/** A complete .ics document for one or more bookings. */
export function buildIcs(bookings, { now = new Date() } = {}) {
  const stamp = toUtcStamp(now);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ignition Fitness//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...bookings.map((b) => bookingEvent(b, { stamp })),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** "Add to Google Calendar" URL for a single booking. */
export function googleCalendarUrl(b) {
  const title = CLASS_TITLE[b.sessionType] ?? "Ignition Fitness";
  const { startStamp, endStamp } = sessionStamps(b.date, b.startTime, b.durationMin ?? 60);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${title} · ${STUDIO.name}`,
    dates: `${startStamp}/${endStamp}`,
    details: `Confirmation ${b.ref}. Arrive a few minutes early.`,
    location: STUDIO.fullAddress,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function icsFilename(b) {
  return `ignition-${b.ref}.ics`;
}
