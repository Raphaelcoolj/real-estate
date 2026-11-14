/* ---------------------------------------------------------------------------
 * Session core — pure JWT sign/verify helpers with no server-only imports so
 * the module can be safely shared with the Node proxy (route protection).
 * ------------------------------------------------------------------------ */

import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/constants";

export const SESSION_COOKIE = "arcadia_session";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  email: string;
};

export function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production (min 16 characters).");
  }
  return new TextEncoder().encode("arcadia-development-secret-do-not-use-in-production");
}

export function sessionTtlSeconds(): number {
  const raw = Number(process.env.AUTH_SESSION_TTL);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_SECONDS;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + sessionTtlSeconds())
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: (payload.role as Role) ?? "customer",
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
