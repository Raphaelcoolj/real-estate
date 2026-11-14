/* ---------------------------------------------------------------------------
 * Server Action helpers — consistent result envelope, error mapping and
 * authentication shortcuts shared by every action module.
 * ------------------------------------------------------------------------ */

import "server-only";
import { headers } from "next/headers";
import { AppError, errorMessage } from "@/lib/errors";
import { getSessionOrThrow, getRoleOrThrow } from "@/lib/rbac";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";
import { type Parsed } from "@/lib/validation";
import type { ActionResult, SessionUser } from "@/types";
import type { Role } from "@/constants";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

/** Wrap a mutation in the standard ActionResult envelope. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AppError) {
      return { ok: false, error: error.message, fields: error.fields };
    }
    return { ok: false, error: errorMessage(error) };
  }
}

/** Convert a zod parse failure into a failed ActionResult. */
export function invalidInput<T>(parsed: Extract<Parsed<T>, { success: false }>): ActionResult<never> {
  return { ok: false, error: parsed.message, fields: parsed.fields };
}

export async function actionUser(): Promise<SessionUser> {
  return getSessionOrThrow();
}

export async function actionRole(roles: Role[]): Promise<SessionUser> {
  return getRoleOrThrow(roles);
}

/** Per-IP rate limit for sensitive actions (sign-in, sign-up, writes). */
export async function limitAction(bucket: string): Promise<void> {
  const h = await headers();
  enforceRateLimit(bucket, clientIp(h));
}
