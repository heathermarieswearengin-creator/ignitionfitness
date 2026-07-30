// Capacity enforcement is a count-then-insert, which is NOT safe under
// Postgres' default READ COMMITTED isolation: two simultaneous bookings can
// both read "9 of 10 taken" and both insert, overbooking the class. Running
// Serializable makes the database detect that interleaving and abort one of
// them — so we must be prepared to retry.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// P2034: write conflict / deadlock (Postgres 40001 serialization_failure)
// P2002: unique constraint — here, a booking ref that collided by chance
const RETRYABLE = new Set(["P2034", "P2002"]);

export async function serializableTx(prisma, fn, { attempts = 5 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (err) {
      // Deliberate business rejections (full class, etc.) must not be retried.
      if (err instanceof HttpError) throw err;
      if (!RETRYABLE.has(err?.code)) throw err;
      lastError = err;
      // Small backoff with jitter so retries don't collide again immediately.
      await new Promise((r) => setTimeout(r, 25 * (i + 1) + Math.floor(Math.random() * 25)));
    }
  }
  throw lastError;
}

export function jsonError(err) {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
