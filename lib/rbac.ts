/* ---------------------------------------------------------------------------
 * Authorization — role guards shared by pages, Server Actions and handlers.
 * Every mutation MUST call one of these server-side; the proxy only provides
 * early UX redirects.
 * ------------------------------------------------------------------------ */

import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthError, ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/types";
import type { Role } from "@/constants";

/** Page guard — redirects to sign-in (or home) when access is denied. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  }
  return user;
}

export async function requireRole(roles: Role[], next?: string): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAgent(next?: string): Promise<SessionUser> {
  return requireRole(["agent", "admin"], next);
}

export async function requireAdmin(next?: string): Promise<SessionUser> {
  return requireRole(["admin"], next);
}

/** Action guard — returns the user or throws (mapped to ActionResult). */
export async function getSessionOrThrow(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function getRoleOrThrow(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionOrThrow();
  if (!roles.includes(user.role)) {
    throw new ForbiddenError("Your account does not have access to this resource.");
  }
  return user;
}

/** Assert the user owns the record (or is an admin). */
export function assertOwnership(
  ownerIds: Array<string | null | undefined>,
  user: SessionUser,
  message = "You can only modify your own records."
): void {
  const isOwner = ownerIds.some((id) => id && id === user.id);
  if (!isOwner && user.role !== "admin") {
    throw new ForbiddenError(message);
  }
}
