import { auth } from "@/auth";
import { HttpError } from "@/lib/tx";

/** The signed-in user, or null. */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws 401 unless someone is signed in. */
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "You need to be signed in.");
  return user;
}

/** Throws 401/403 unless the signed-in user is an admin. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new HttpError(403, "Admins only.");
  return user;
}
