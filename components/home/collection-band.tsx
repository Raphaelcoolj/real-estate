import { PROPERTY_TYPES } from "@/constants";
import { buildSearchHref } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const FEATURED_TYPES = ["apartment", "villa", "penthouse", "townhouse"] as const;

const ART: Record<string, string> = {
  apartment: "/images/collections/apartments.svg",
  villa: "/images/collections/villas.svg",
  penthouse: "/images/collections/penthouses.svg",
  townhouse: "/images/collections/townhouses.svg",
};

export function CollectionBand() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURED_TYPES.map((value) => {
        const type = PROPERTY_TYPES.find((t) => t.value === value)!;
        return (
          <Link
            key={value}
            href={buildSearchHref({ propertyType: value })}
            className="group relative overflow-hidden rounded-xl bg-charcoal-900"
          >
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={ART[value]!}
                alt={type.plural}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover opacity-90 transition-all duration-[1100ms] ease-out-expo group-hover:scale-[1.05] group-hover:opacity-100"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-ivory-50">
              <h3 className="font-serif text-2xl">{type.plural}</h3>
              <span className="flex size-8 items-center justify-center rounded-full border border-ivory-50/30 transition-all duration-300 group-hover:border-brass-400 group-hover:bg-brass-500 group-hover:text-charcoal-950">
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M3 13 13 3M6 3h7v7" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
