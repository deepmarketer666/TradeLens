import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/** For server pages: returns the logged-in user or redirects to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the logged-in user, verified against the database
 * (a valid JWT for a deleted account is treated as logged out).
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, username: true, name: true } });
}
