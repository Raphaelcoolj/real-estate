import { Badge } from "@/components/ui/badge";
import { CompareButton } from "@/components/property/compare-button";
import { SaveButton } from "@/components/property/save-button";
import { PROPERTY_TYPES } from "@/constants";
import { cn, formatPrice, formatArea } from "@/lib/utils";
import type { PropertySummary } from "@/types";
import Image from "next/image";
import Link from "next/link";

const typeLabel = (value: string) =>
  PROPERTY_TYPES.find((t) => t.value === value)?.label ?? value;

export function PropertyCard({
  property,
  authed,
  saved,
  priority,
  className,
  variant = "default",
}: {
  property: PropertySummary;
  authed: boolean;
  saved?: boolean;
  priority?: boolean;
  className?: string;
  variant?: "default" | "compact";
}) {
  const location = [property.neighbourhood, property.city].filter(Boolean).join(", ");
  const availability =
    property.status === "sold" ? "Sold" : property.status === "rented" ? "Rented" : null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-xl bg-ivory-200">
        <Link
          href={`/properties/${property.slug}`}
          className="relative block aspect-[4/3] w-full overflow-hidden"
          aria-label={property.title}
        >
          <Image
            src={property.coverImage}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
          <div className="flex flex-wrap gap-1.5">
            {property.featured && !availability && (
              <Badge tone="brass" className="backdrop-blur">
                Featured
              </Badge>
            )}
            {availability && <Badge tone="dark">{availability}</Badge>}
            {property.transactionType === "rent" && (
              <Badge tone="neutral" className="bg-white/90 backdrop-blur">
                For rent
              </Badge>
            )}
          </div>
          <div className="pointer-events-auto">
            <SaveButton propertyId={property.id} initialSaved={saved} authed={authed} />
          </div>
        </div>

        {variant === "default" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
            <span className="rounded-full bg-charcoal-950/55 px-3 py-1 text-[0.6875rem] font-medium tracking-[0.06em] text-ivory-100 uppercase backdrop-blur-sm">
              {typeLabel(property.propertyType)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-[1.45rem] leading-none text-charcoal-900">
            {formatPrice(property.price, property.currency, { compact: true })}
            {property.pricePeriod === "per_month" && (
              <span className="ml-1 font-sans text-[0.7rem] font-medium tracking-wide text-stone-400">/mo</span>
            )}
          </p>
          <span className="shrink-0 text-[0.6875rem] font-medium tracking-[0.08em] text-stone-400 uppercase">
            {property.transactionType === "sale" ? "Sale" : "Rent"}
          </span>
        </div>

        <h3 className="mt-2 text-[0.975rem] leading-snug font-medium text-charcoal-900">
          <Link href={`/properties/${property.slug}`} className="link-underline">
            {property.title}
          </Link>
        </h3>

        <p className="mt-1 text-[0.8125rem] text-stone-500">{location}</p>

        <div className="mt-3 flex items-center gap-3 border-t border-ivory-200 pt-3 text-[0.75rem] text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <BedIcon /> {property.bedrooms || "—"} bd
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BathIcon /> {property.bathrooms || "—"} ba
          </span>
          {property.areaSqm ? (
            <span className="inline-flex items-center gap-1.5">
              <AreaIcon /> {formatArea(property.areaSqm)}
            </span>
          ) : null}
          <span className="ml-auto">
            <CompareButton propertyId={property.id} authed={authed} />
          </span>
        </div>
      </div>
    </article>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.4" aria-hidden>
      <path d="M1.5 12.5v-7M1.5 9h13v3.5M14.5 9V6.5a1.5 1.5 0 0 0-1.5-1.5H7v4" />
      <circle cx="4" cy="7.4" r="1.1" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.4" aria-hidden>
      <path d="M2 7.5h12v1.2A3.3 3.3 0 0 1 10.7 12H5.3A3.3 3.3 0 0 1 2 8.7V7.5ZM4 7.5V3.6A1.6 1.6 0 0 1 5.6 2c.8 0 1.4.5 1.6 1.2" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.4" aria-hidden>
      <path d="M2.5 2.5h11v11h-11zM2.5 6h3.5M6 2.5v3.5M13.5 10H10M10 13.5V10" />
    </svg>
  );
}
