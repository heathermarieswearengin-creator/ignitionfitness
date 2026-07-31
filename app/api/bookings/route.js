import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, serializableTx, jsonError } from "@/lib/tx";
import { isBlocked } from "@/lib/availability";
import { minuteOfDay, studioNow } from "@/lib/config";
import { currentUser, requireAdmin } from "@/lib/auth-helpers";
import { spendPackageCredit } from "@/lib/packages";
import { sendBookingConfirmation } from "@/lib/email";
import {
  CLASS_TYPE_TO_DB,
  DEFAULT_CAPACITY,
  STATUS_TO_DB,
  dateOnly,
  makeRef,
  to24h,
  toClientBooking,
} from "@/lib/shape";

export const dynamic = "force-dynamic";

// Two accepted shapes:
//  - cart   { items: [{sessionId}], contact?, isDropIn? }   (members and guests)
//  - legacy { name, email, phone, classType, date, time }   (kept working)
const Contact = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
});

const CartBooking = z.object({
  items: z
    .array(z.object({ sessionId: z.string().min(1) }))
    .min(1, "Pick at least one session")
    .max(20, "That's too many sessions in one go"),
  contact: Contact.partial().optional(),
  isDropIn: z.boolean().optional().default(false),
});

const LegacyBooking = Contact.extend({
  classType: z.enum(["group", "pt"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().min(1),
  isDropIn: z.boolean().optional().default(false),
});

/** Admin list. */
export async function GET(request) {
  try {
    await requireAdmin();
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const sessionWhere = {};
    if (from || to) {
      sessionWhere.date = {};
      if (from) sessionWhere.date.gte = dateOnly(from);
      if (to) sessionWhere.date.lte = dateOnly(to);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status: STATUS_TO_DB[status] ?? undefined } : {}),
        ...(Object.keys(sessionWhere).length ? { session: sessionWhere } : {}),
      },
      include: { session: true },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(bookings.map(toClientBooking));
  } catch (err) {
    return jsonError(err);
  }
}

/** Resolve or materialise the session a legacy payload refers to. */
async function resolveLegacySession(tx, { classType, date: isoDay, time }) {
  const type = CLASS_TYPE_TO_DB[classType];
  const date = dateOnly(isoDay);
  const startTime = to24h(time);

  const existing = await tx.classSession.findUnique({
    where: { date_startTime_type: { date, startTime, type } },
  });
  if (existing) return existing;

  const template = await tx.weeklyTemplate.findFirst({
    where: { dayOfWeek: date.getUTCDay(), startTime, type, active: true },
  });
  return tx.classSession.create({
    data: {
      date,
      startTime,
      type,
      capacity: template?.capacity ?? DEFAULT_CAPACITY[type],
      durationMin: template?.durationMin ?? 60,
    },
  });
}

/**
 * Book one session inside an open transaction. Every guard lives here so the
 * cart and legacy paths cannot diverge.
 */
async function bookOne(tx, session, { name, email, phone, userId, isDropIn }) {
  const isoDay = new Date(session.date).toISOString().slice(0, 10);
  const now = studioNow();

  if (session.status === "CANCELLED") {
    throw new HttpError(409, "That session has been cancelled.");
  }
  if (isoDay < now.isoDay || (isoDay === now.isoDay && minuteOfDay(session.startTime) <= now.minutes)) {
    throw new HttpError(409, "That session has already started.");
  }

  const blocks = await tx.availabilityBlock.findMany({ where: { date: session.date } });
  if (isBlocked(isoDay, session.startTime, blocks)) {
    throw new HttpError(409, "That time is not available for booking.");
  }

  // Don't let one person take two seats in the same class.
  const dupe = await tx.booking.findFirst({
    where: { sessionId: session.id, email, status: { not: "CANCELLED" } },
  });
  if (dupe) throw new HttpError(409, `You already have a spot at ${session.startTime} that day.`);

  const taken = await tx.booking.count({
    where: { sessionId: session.id, status: { not: "CANCELLED" } },
  });
  if (taken >= session.capacity) throw new HttpError(409, "That session is full.");

  // Spend against a package when the member has a usable one. Credit change
  // and its log entry are written together, inside this transaction.
  const { memberPackageId, paymentStatus } = await spendPackageCredit(tx, {
    userId,
    type: session.type,
  });

  return tx.booking.create({
    data: {
      ref: makeRef(),
      sessionId: session.id,
      userId: userId ?? null,
      name,
      email,
      phone: phone || null,
      isDropIn,
      status: "CONFIRMED",
      paymentStatus,
      memberPackageId,
    },
    include: { session: true },
  });
}

/**
 * Someone booking without an account is a drop-in, and a drop-in is a lead to
 * follow up with. Recorded in the same transaction as the booking so the two
 * can never disagree. Members are not leads.
 */
async function captureDropInLead(tx, who) {
  if (who.userId) return;
  const existing = await tx.lead.findFirst({ where: { email: who.email } });
  if (existing) {
    // Keep the richer details if we now have them, but never clobber a status
    // the coach has already set.
    await tx.lead.update({
      where: { id: existing.id },
      data: {
        name: existing.name ?? who.name ?? null,
        phone: existing.phone ?? who.phone ?? null,
      },
    });
    return;
  }
  await tx.lead.create({
    data: {
      email: who.email,
      name: who.name ?? null,
      phone: who.phone || null,
      source: "dropin",
    },
  });
}

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const user = await currentUser();

    // Signed-in members book under their own account; their profile wins over
    // whatever the browser posted, so one member can't book as someone else.
    const identity = user
      ? { name: user.name, email: user.email, phone: body?.contact?.phone ?? "", userId: user.id }
      : null;

    const created = await serializableTx(prisma, async (tx) => {
      if (Array.isArray(body?.items)) {
        const parsed = CartBooking.safeParse(body);
        if (!parsed.success) {
          throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid booking");
        }
        const { items, contact, isDropIn } = parsed.data;

        let who = identity;
        if (!who) {
          const guest = Contact.safeParse(contact ?? {});
          if (!guest.success) {
            throw new HttpError(400, guest.error.issues[0]?.message ?? "Contact details are required");
          }
          who = { ...guest.data, email: guest.data.email.toLowerCase(), userId: null };
        }

        const ids = [...new Set(items.map((i) => i.sessionId))];
        const sessions = await tx.classSession.findMany({ where: { id: { in: ids } } });
        if (sessions.length !== ids.length) {
          throw new HttpError(404, "One of those sessions no longer exists.");
        }
        // Book in schedule order so error messages name the earliest problem.
        sessions.sort((a, b) =>
          a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date - b.date
        );

        // A guest booking is a drop-in unless the caller says otherwise.
        const dropIn = isDropIn || !who.userId;
        const out = [];
        for (const s of sessions) out.push(await bookOne(tx, s, { ...who, isDropIn: dropIn }));
        await captureDropInLead(tx, who);
        return out;
      }

      const parsed = LegacyBooking.safeParse(body);
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid booking");
      }
      const input = parsed.data;
      const who = identity ?? {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        userId: null,
      };
      const session = await resolveLegacySession(tx, input);
      const made = [await bookOne(tx, session, { ...who, isDropIn: input.isDropIn || !who.userId })];
      await captureDropInLead(tx, who);
      return made;
    });

    const shaped = created.map(toClientBooking);

    // Fire the confirmation after the transaction commits. sendBookingConfirmation
    // never throws — a successful booking must not report failure because the
    // mail provider is down or unconfigured.
    const mail = await sendBookingConfirmation(shaped);
    if (!mail.sent && mail.reason !== "no-api-key") {
      console.warn(`[bookings] confirmation not sent (${mail.reason}) for ${shaped.map((b) => b.ref).join(", ")}`);
    }

    // Legacy callers expect a single object back; cart callers get the array.
    return Response.json(Array.isArray(body?.items) ? shaped : shaped[0], { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
