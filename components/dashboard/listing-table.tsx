"use client";

import { setListingStatusAction } from "@/actions/property.actions";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIONS: Record<string, { action: string; label: string }[]> = {
  approved: [
    { action: "mark_sold", label: "Mark as sold" },
    { action: "mark_available", label: "Return to market" },
    { action: "archive", label: "Archive listing" },
  ],
  sold: [
    { action: "mark_available", label: "Return to market" },
    { action: "archive", label: "Archive listing" },
  ],
  rented: [
    { action: "mark_available", label: "Return to market" },
    { action: "archive", label: "Archive listing" },
  ],
};

export function ListingTable({ items }: { items: PropertySummary[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ivory-200 bg-white">
      <ul className="divide-y divide-ivory-200">
        {items.map((item) => (
          <ListingRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function ListingRow({ item }: { item: PropertySummary }) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const actions = ACTIONS[item.status] ?? [];

  const run = async (action: string) => {
    setPending(true);
    const result = await setListingStatusAction({ propertyId: item.id, action });
    setPending(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Listing updated", "success");
    router.refresh();
  };

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link href={`/properties/${item.slug}`} className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-ivory-200 sm:h-16 sm:w-24">
        <Image src={item.coverImage} alt="" fill sizes="96px" className="object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/properties/${item.slug}`} className="truncate text-sm font-medium text-charcoal-900 hover:underline">
            {item.title}
          </Link>
          <StatusBadge status={item.status} />
          {item.featured && <span className="text-[0.625rem] font-semibold tracking-wider text-brass-700 uppercase">Featured</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-stone-400">
          {item.neighbourhood ? `${item.neighbourhood}, ` : ""}
          {item.city} · {item.transactionType === "rent" ? "To rent" : "For sale"}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {item.stats.views.toLocaleString()} views · {item.stats.enquiries} enquiries · {item.stats.favourites} saves
        </p>
      </div>

      <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-1">
        <p className="text-sm font-medium text-charcoal-900">
          {formatPrice(item.price, item.currency, { compact: true })}
          {item.pricePeriod === "per_month" && <span className="text-xs font-normal text-stone-400">/mo</span>}
        </p>
        <div className="flex items-center gap-1">
          <ButtonLink href={`/dashboard/listings/${item.id}/edit`} size="sm" variant="ghost">
            Edit
          </ButtonLink>
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center rounded-md px-3 text-[0.8125rem] text-charcoal-800 hover:bg-ivory-200/70">
              {pending ? "…" : "More"}
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-ivory-200 bg-white py-1 shadow-lift">
              {actions.length === 0 && (
                <p className="px-4 py-2 text-xs text-stone-400">
                  Actions available once approved.
                </p>
              )}
              {actions.map((option) => (
                <button
                  key={option.action}
                  type="button"
                  disabled={pending}
                  onClick={() => void run(option.action)}
                  className="block w-full px-4 py-2 text-left text-xs text-charcoal-800 hover:bg-ivory-100 disabled:opacity-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </li>
  );
}
