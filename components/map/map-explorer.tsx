"use client";

import { PropertyGrid } from "@/components/property/property-grid";
import { ButtonLink } from "@/components/ui/button";
import { hasMapToken, PropertyMap } from "@/components/map/property-map";
import type { PropertySummary } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export function MapExplorer({
  initialProperties,
  authed,
  savedIds,
  query,
  total,
}: {
  initialProperties: PropertySummary[];
  authed: boolean;
  savedIds: string[];
  query: Record<string, string | undefined>;
  total: number;
}) {
  const enabled = hasMapToken();
  const [items, setItems] = useState(initialProperties);
  const [syncedInitial, setSyncedInitial] = useState(initialProperties);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autoSearch, setAutoSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  if (initialProperties !== syncedInitial) {
    setSyncedInitial(initialProperties);
    setItems(initialProperties);
  }

  const fetchBounds = useCallback(
    (bounds: Bounds) => {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(query)) {
            if (value) params.set(key, value);
          }
          params.set("minLng", String(bounds.minLng));
          params.set("minLat", String(bounds.minLat));
          params.set("maxLng", String(bounds.maxLng));
          params.set("maxLat", String(bounds.maxLat));
          const res = await fetch(`/api/properties/viewport?${params.toString()}`, {
            signal: controller.signal,
          });
          const json = (await res.json()) as {
            ok: boolean;
            data?: { items: PropertySummary[] };
          };
          if (json.ok && json.data) setItems(json.data.items);
        } catch {
          /* aborted or offline — keep current results */
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, 350);
    },
    [query]
  );

  const onBoundsChange = useCallback(
    (bounds: Bounds) => {
      if (autoSearch) fetchBounds(bounds);
    },
    [autoSearch, fetchBounds]
  );

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-brass-400/40 bg-brass-300/15 px-5 py-4 text-sm text-brass-700">
          <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4.5M10 13.6v.1" />
          </svg>
          <p>
            The map view needs a Mapbox access token. Showing the same results as a gallery —
            add <code className="rounded bg-white/60 px-1 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
            to enable it.
          </p>
        </div>
        <PropertyGrid properties={items} authed={authed} savedIds={savedIds} />
        <div className="flex justify-center">
          <ButtonLink href={`/properties?${new URLSearchParams({ ...toClean(query), view: "grid" }).toString()}`} variant="outline">
            Back to grid view
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-0 overflow-hidden rounded-2xl border border-ivory-200 bg-white lg:grid-cols-[22rem_1fr]">
      <div className="relative hidden max-h-[78svh] flex-col overflow-hidden border-r border-ivory-200 lg:flex">
        <div className="flex items-center justify-between border-b border-ivory-200 px-5 py-3.5">
          <p className="text-xs font-medium tracking-wide text-stone-500">
            {loading ? "Updating…" : `${items.length} in view`}
            {total > items.length ? ` · ${total} total` : ""}
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-[0.6875rem] text-stone-400">
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={(e) => setAutoSearch(e.target.checked)}
              className="size-3.5 accent-charcoal-900"
            />
            Search as I move
          </label>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2.5">
          {items.map((property) => (
            <MapRow
              key={property.id}
              property={property}
              active={property.id === selectedId}
              onClick={() => setSelectedId(property.id)}
            />
          ))}
          {!items.length && (
            <p className="p-6 text-center text-sm text-stone-400">
              No homes in this area — pan the map or widen your filters.
            </p>
          )}
        </div>
      </div>

      <div className="relative h-[62svh] lg:h-[78svh]">
        <PropertyMap
          properties={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onBoundsChange={onBoundsChange}
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/92 px-3.5 py-2 text-xs font-medium text-charcoal-900 shadow-soft backdrop-blur">
          {loading ? "Updating results…" : `${items.length} homes in view`}
        </div>
      </div>

      <div className="col-span-full border-t border-ivory-200 p-4 lg:hidden">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {items.map((property) => (
            <MapRow
              key={property.id}
              property={property}
              active={property.id === selectedId}
              onClick={() => setSelectedId(property.id)}
              horizontal
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function toClean(query: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(query).filter(([, v]) => Boolean(v))) as Record<string, string>;
}

function MapRow({
  property,
  active,
  onClick,
  horizontal,
}: {
  property: PropertySummary;
  active: boolean;
  onClick: () => void;
  horizontal?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-stretch gap-3 rounded-lg p-2 text-left transition-colors",
        active ? "bg-ivory-100 ring-1 ring-brass-400/60" : "hover:bg-ivory-50",
        horizontal && "w-64 shrink-0"
      )}
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-ivory-200">
        <Image src={property.coverImage} alt="" fill sizes="96px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-serif text-lg leading-tight text-charcoal-900">
          {formatPrice(property.price, property.currency, { compact: true })}
          {property.pricePeriod === "per_month" && (
            <span className="ml-1 font-sans text-[0.6rem] text-stone-400">/mo</span>
          )}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs font-medium text-charcoal-800">{property.title}</p>
        <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-stone-400">
          {property.neighbourhood || property.city} · {property.bedrooms} bd
        </p>
      </div>
      <Link
        href={`/properties/${property.slug}`}
        aria-label={`View ${property.title}`}
        className="self-center rounded-full p-1.5 text-stone-300 transition-colors hover:bg-white hover:text-charcoal-900"
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m6 3 5 5-5 5" />
        </svg>
      </Link>
    </button>
  );
}
