import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError, serializableTx, jsonError } from "@/lib/tx";
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

// Phase 1 accepts the prototype's single-booking shape so the existing wizard
// keeps working untouched. The multi-session cart (spec section 6) arrives in
// Phase 3 and will add an `items[]` form alongside this one.
const CreateBooking = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
  classType: z.enum(["group", "pt"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().min(1),
  isDropIn: z.boolean().optional().default(false),
});

export async function GET(request) {
  try {
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

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const parsed = CreateBooking.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid booking");
    }
    const input = parsed.data;

    const type = CLASS_TYPE_TO_DB[input.classType];
    const date = dateOnly(input.date);
    const startTime = to24h(input.time);

    const booking = await serializableTx(prisma, async (tx) => {
      // Find the concrete slot, or materialise it from the weekly template.
      let session = await tx.classSession.findUnique({
        where: { date_startTime_type: { date, startTime, type } },
      });

      if (!session) {
        const template = await tx.weeklyTemplate.findFirst({
          where: { dayOfWeek: date.getUTCDay(), startTime, type, active: true },
        });
        session = await tx.classSession.create({
          data: {
            date,
            startTime,
            type,
            capacity: template?.capacity ?? DEFAULT_CAPACITY[type],
            durationMin: template?.durationMin ?? 60,
          },
        });
      }

      if (session.status === "CANCELLED") {
        throw new HttpError(409, "That session has been cancelled.");
      }

      // Re-read the count inside the serializable transaction — this is the
      // check that actually prevents overbooking.
      const taken = await tx.booking.count({
        where: { sessionId: session.id, status: { not: "CANCELLED" } },
      });
      if (taken >= session.capacity) {
        throw new HttpError(409, "That session is full.");
      }

      return tx.booking.create({
        data: {
          ref: makeRef(),
          sessionId: session.id,
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone || null,
          isDropIn: input.isDropIn,
          status: "CONFIRMED",
        },
        include: { session: true },
      });
    });

    return Response.json(toClientBooking(booking), { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
