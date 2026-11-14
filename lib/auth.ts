/* ---------------------------------------------------------------------------
 * Authentication — bcrypt password hashing + signed JWT sessions delivered
 * in an httpOnly cookie. Secrets never reach the client bundle.
 * ------------------------------------------------------------------------ */

import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { connectDB } from "@/lib/db";
/* Register the referenced model so `populate("agency")` works on routes that
 * do not otherwise import it (Next's per-route module graph is not global). */
import "@/models/Agency";
import { User } from "@/models/User";
import {
  SESSION_COOKIE,
  sessionTtlSeconds,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session-core";
import type { SessionUser } from "@/types";
import type { Role } from "@/constants";

export { SESSION_COOKIE };

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: {
  id: string;
  role: Role;
  name: string;
  email: string;
}): Promise<void> {
  const token = await signSessionToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds(),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

type LeanUserDoc = {
  _id: unknown;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  phone?: string | null;
  status: string;
  verificationStatus: string;
  agency?: { _id: unknown; name: string; slug: string } | null;
  bio?: string | null;
  profileComplete?: boolean;
  createdAt: Date | string;
};

function toSessionUser(doc: LeanUserDoc): SessionUser {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl ?? null,
    phone: doc.phone ?? null,
    status: doc.status as SessionUser["status"],
    verificationStatus: doc.verificationStatus as SessionUser["verificationStatus"],
    agencyId: doc.agency?._id ? String(doc.agency._id) : null,
    agencyName: doc.agency?.name ?? null,
    profileComplete: Boolean(doc.profileComplete),
    bio: doc.bio ?? null,
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : doc.createdAt.toISOString(),
  };
}

/**
 * Resolve the signed-in user for the current request.
 * Deduplicated per request via React `cache()`; the JWT is verified first and
 * the authoritative record is then read from the database (so suspended or
 * deleted accounts lose access immediately).
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await readToken();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  try {
    await connectDB();
    const user = await User.findById(payload.sub)
      .select(
        "name email role avatarUrl phone status verificationStatus agency bio profileComplete createdAt"
      )
      .populate("agency", "name slug")
      .lean();

    if (!user || user.status !== "active") return null;
    return toSessionUser(user as unknown as LeanUserDoc);
  } catch {
    return null;
  }
});

export type { SessionPayload };
