"use client";

import { Button } from "@/components/ui/button";
import { PROPERTY_TYPES } from "@/constants";
import { POPULAR_DISTRICTS } from "@/constants/locations";
import { cn, buildSearchHref } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuickSearch({ defaultTransaction = "sale" }: { defaultTransaction?: "sale" | "rent" }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<"sale" | "rent">(defaultTransaction);
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      buildSearchHref({
        transaction,
        district: district || undefined,
        propertyType: propertyType || undefined,
        sort: "relevance",
      })
    );
  };

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-2xl border border-white/30 bg-white/95 p-2.5 shadow-overlay backdrop-blur-md sm:rounded-full sm:p-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex rounded-full bg-ivory-100 p-1" role="radiogroup" aria-label="Transaction type">
          {(["sale", "rent"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={transaction === value}
              onClick={() => setTransaction(value)}
              className={cn(
                "flex-1 rounded-full px-5 py-2 text-xs font-semibold tracking-[0.08em] uppercase transition-all duration-300 sm:flex-none",
                transaction === value
                  ? "bg-charcoal-900 text-ivory-50 shadow-soft"
                  : "text-stone-500 hover:text-charcoal-900"
              )}
            >
              {value === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2.5 sm:border-l sm:border-ivory-200">
            <span className="sr-only">Location</span>
            <svg viewBox="0 0 16 16" className="size-4 shrink-0 stroke-stone-400" fill="none" strokeWidth="1.5" aria-hidden>
              <path d="M8 14.5s5-4.2 5-8A5 5 0 0 0 3 6.5c0 3.8 5 8 5 8Z" />
              <circle cx="8" cy="6.4" r="1.7" />
            </svg>
            <input
              list="quick-search-districts"
              value={district}
              onChange={(e) => {
                const match = POPULAR_DISTRICTS.find(
                  (d) => d.name.toLowerCase() === e.target.value.toLowerCase() || d.slug === e.target.value
                );
                setDistrict(match ? match.slug : e.target.value);
              }}
              placeholder="City, district or address"
              className="min-w-0 flex-1 bg-transparent text-sm text-charcoal-900 placeholder:text-stone-400 focus:outline-none"
              aria-label="Location"
            />
            <datalist id="quick-search-districts">
              {POPULAR_DISTRICTS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}, {d.city}
                </option>
              ))}
            </datalist>
          </label>

          <div className="flex items-center gap-2 sm:border-l sm:border-ivory-200">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              aria-label="Property type"
              className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-charcoal-900 focus:outline-none sm:w-36 sm:flex-none"
            >
              <option value="">Any type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button type="submit" className="w-full shrink-0 sm:w-auto">
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="7" cy="7" r="4.6" />
                <path d="m10.5 10.5 3.5 3.5" />
              </svg>
              Search
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
