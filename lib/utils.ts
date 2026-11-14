/* ---------------------------------------------------------------------------
 * Shared utilities — class names, formatting, slugs, pagination helpers.
 * ------------------------------------------------------------------------ */

import { CURRENCIES, type CurrencyCode } from "@/constants";

type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

/** Minimal class-name joiner (clsx-style) — avoids an extra dependency. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value && value !== 0) continue;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  }
  return out.join(" ");
}

export function formatPrice(
  amount: number,
  currency: CurrencyCode = "USD",
  options: { compact?: boolean; withSymbol?: boolean } = {}
): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.USD;
  const { compact = false, withSymbol = true } = options;

  if (compact && Math.abs(amount) >= 10_000) {
    const units: [number, string][] = [
      [1_000_000_000, "B"],
      [1_000_000, "M"],
      [1_000, "K"],
    ];
    for (const [div, suffix] of units) {
      if (Math.abs(amount) >= div) {
        const value = amount / div;
        const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
        if (!withSymbol) return `${rounded}${suffix}`;
        if (currency === "AED" || currency === "NGN") return `${meta.symbol} ${rounded}${suffix}`;
        return `${meta.symbol}${rounded}${suffix}`;
      }
    }
  }

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  if (!withSymbol) return formatted;
  if (currency === "AED" || currency === "NGN") return `${meta.symbol} ${formatted}`;
  return `${meta.symbol}${formatted}`;
}

/** Compact price used on map markers: $1.2M, ₦45M */
export function formatMarkerPrice(amount: number, currency: CurrencyCode = "USD"): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.USD;
  const symbol = currency === "AED" ? "AED " : currency === "NGN" ? "₦" : meta.symbol;
  if (amount >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `${symbol}${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10}B`;
  }
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${symbol}${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10}M`;
  }
  if (amount >= 1_000) {
    const v = amount / 1_000;
    return `${symbol}${v >= 10 ? Math.round(v) : Math.round(v * 10) / 10}K`;
  }
  return `${symbol}${amount}`;
}

export function formatPricePeriod(
  amount: number,
  currency: CurrencyCode,
  period: "total" | "per_month"
): string {
  const base = formatPrice(amount, currency);
  return period === "per_month" ? `${base}/mo` : base;
}

export function formatArea(sqm?: number | null): string {
  if (!sqm && sqm !== 0) return "—";
  return `${new Intl.NumberFormat("en-US").format(sqm)} m²`;
}

export function formatBedrooms(n: number): string {
  if (n === 0) return "Studio";
  return `${n}`;
}

export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 60 * 60 * 1000],
    ["month", 30 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["minute", 60 * 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Page numbers with ellipses, e.g. [1, 2, 3, '…', 12] */
export function paginationRange(page: number, totalPages: number, siblings = 1): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);
  const items: (number | "…")[] = [1];
  if (left > 2) items.push("…");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < totalPages - 1) items.push("…");
  items.push(totalPages);
  return items;
}

/** Build a /properties href from a filter state object (client + server). */
export function buildSearchHref(
  filters: Record<string, string | number | string[] | undefined>,
  basePath = "/properties"
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseList(value?: string | string[] | null): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : value.split(",");
  return raw.map((v) => v.trim()).filter(Boolean);
}

export function parseNumber(value?: string | string[] | null): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseOne(value?: string | string[] | null): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw !== "" ? raw : undefined;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init);
}
