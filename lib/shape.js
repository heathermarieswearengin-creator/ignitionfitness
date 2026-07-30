// Translation layer between the client's legacy booking shape and the DB.
// The wizard in app/page.jsx speaks "6:00 AM" / "group" / "confirmed";
// Postgres speaks "06:00" / GROUP / CONFIRMED. Keep the conversions here so
// the UI can stay untouched while the storage underneath changes.

export const CLASS_TYPE_TO_DB = { group: "GROUP", pt: "PT" };
export const DB_TO_CLASS_TYPE = { GROUP: "group", PT: "pt" };

export const STATUS_TO_DB = {
  confirmed: "CONFIRMED",
  "checked-in": "CHECKED_IN",
  pending: "PENDING",
  cancelled: "CANCELLED",
};
export const DB_TO_STATUS = {
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked-in",
  PENDING: "pending",
  CANCELLED: "cancelled",
};

// Fallback capacities when no WeeklyTemplate row matches (ad-hoc session).
export const DEFAULT_CAPACITY = { GROUP: 10, PT: 1 };

/** "6:00 AM" -> "06:00", "5:30 PM" -> "17:30", "12:00 AM" -> "00:00" */
export function to24h(t) {
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) throw new Error(`Unrecognised time: ${t}`);
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** "17:30" -> "5:30 PM", "06:00" -> "6:00 AM", "00:00" -> "12:00 AM" */
export function to12h(t) {
  const m = String(t).trim().match(/^(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Unrecognised time: ${t}`);
  const h24 = Number(m[1]);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

// Dates are stored as @db.Date. Anchor everything to UTC midnight so a
// booking made at 9pm Pacific doesn't silently land on the next day.
export function dateOnly(isoDay) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) throw new Error(`Unrecognised date: ${isoDay}`);
  return new Date(`${isoDay}T00:00:00.000Z`);
}

export function toIsoDay(d) {
  return new Date(d).toISOString().slice(0, 10);
}

/** DB booking (with `session` included) -> the shape app/page.jsx expects. */
export function toClientBooking(b) {
  return {
    id: b.id,
    ref: b.ref,
    name: b.name,
    email: b.email,
    phone: b.phone ?? "",
    classType: DB_TO_CLASS_TYPE[b.session.type],
    date: toIsoDay(b.session.date),
    time: to12h(b.session.startTime),
    status: DB_TO_STATUS[b.status],
    createdAt: new Date(b.createdAt).getTime(),
  };
}

/** DB lead -> the shape app/page.jsx expects. */
export function toClientLead(l) {
  return {
    id: l.id,
    email: l.email,
    source: l.source,
    createdAt: new Date(l.createdAt).getTime(),
  };
}

export function makeRef() {
  // Matches the prototype's "IGN-XXXXX" format.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `IGN-${s}`;
}
