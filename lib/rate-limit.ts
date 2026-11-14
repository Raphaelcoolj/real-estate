/* ---------------------------------------------------------------------------
 * Rate limiting — sliding window per IP + bucket, in-memory (single instance).
 * Suitable for a self-hosted deployment; swap for Redis when horizontally
 * scaled (documented in README).
 * ------------------------------------------------------------------------ */

import { RateLimitError } from "@/lib/errors";

type Bucket = { hits: number[] };

const store = new Map<string, Bucket>();

function max(): number {
  const raw = Number(process.env.RATE_LIMIT_MAX);
  return Number.isFinite(raw) && raw > 0 ? raw : 20;
}

function windowMs(): number {
  const raw = Number(process.env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000;
}

/** Returns true when the request is allowed for the given key. */
export function rateLimit(key: string): boolean {
  const now = Date.now();
  const cutoff = now - windowMs();
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= max()) {
    store.set(key, bucket);
    return false;
  }

  bucket.hits.push(now);
  store.set(key, bucket);

  // Opportunistic cleanup to bound memory.
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (v.hits.every((t) => t <= cutoff)) store.delete(k);
    }
  }
  return true;
}

/** Extract a stable client IP from forwarded headers. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local"
  );
}

/** Guard for Server Actions / Route Handlers — throws RateLimitError. */
export function enforceRateLimit(bucket: string, key: string): void {
  if (!rateLimit(`${bucket}:${key}`)) {
    throw new RateLimitError();
  }
}
