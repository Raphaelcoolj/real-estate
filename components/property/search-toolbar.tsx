"use client";

import { SORT_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SearchToolbar({
  total,
  onOpenFilters,
  filterCount,
}: {
  total: number;
  onOpenFilters: () => void;
  filterCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const sort = params.get("sort") ?? "relevance";
  const view = params.get("view") === "map" ? "map" : "grid";

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "view") next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `/properties?${qs}` : "/properties"));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className={cn("text-sm text-stone-500 transition-opacity", pending && "opacity-50")}>
        <span className="font-medium text-charcoal-900">{total.toLocaleString()}</span>{" "}
        {total === 1 ? "property" : "properties"}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-[0.8125rem] font-medium text-charcoal-900 transition-colors hover:border-charcoal-900 lg:hidden"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M2 4h12M4.5 8h7M6.5 12h3" />
          </svg>
          Filters
          {filterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-charcoal-900 text-[0.65rem] text-ivory-50">
              {filterCount}
            </span>
          )}
        </button>

        <div className="relative">
          <select
            aria-label="Sort properties"
            value={sort}
            onChange={(e) => update("sort", e.target.value === "relevance" ? null : e.target.value)}
            className="h-10 appearance-none rounded-full border border-stone-300 bg-white pl-4 pr-9 text-[0.8125rem] font-medium text-charcoal-900 transition-colors hover:border-charcoal-900 focus:border-charcoal-900 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 12 8"
            className="pointer-events-none absolute right-3.5 top-1/2 h-2 w-3 -translate-y-1/2 stroke-stone-500"
            fill="none"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M1 1.5 6 6.5 11 1.5" />
          </svg>
        </div>

        <div className="hidden rounded-full border border-stone-300 p-1 sm:flex" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => update("view", null)}
            aria-pressed={view === "grid"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              view === "grid" ? "bg-charcoal-900 text-ivory-50" : "text-stone-500 hover:text-charcoal-900"
            )}
          >
            <svg viewBox="0 0 14 14" className="size-3" fill="currentColor" aria-hidden>
              <rect width="6" height="6" rx="1" />
              <rect x="8" width="6" height="6" rx="1" />
              <rect y="8" width="6" height="6" rx="1" />
              <rect x="8" y="8" width="6" height="6" rx="1" />
            </svg>
            Grid
          </button>
          <button
            type="button"
            onClick={() => update("view", "map")}
            aria-pressed={view === "map"}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              view === "map" ? "bg-charcoal-900 text-ivory-50" : "text-stone-500 hover:text-charcoal-900"
            )}
          >
            <svg viewBox="0 0 14 14" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <path d="M1 3.2 5 1.5l4 1.7 4-1.7v9.3L9 12.5 5 10.8l-4 1.7V3.2ZM5 1.5v9.3M9 3.2v9.3" />
            </svg>
            Map
          </button>
        </div>
      </div>
    </div>
  );
}
