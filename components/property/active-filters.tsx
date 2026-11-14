import { ButtonLink } from "@/components/ui/button";
import type { ParsedFilters } from "@/lib/validation/property";
import type { SearchParamMap } from "@/lib/search-params";
import { buildSearchHref, formatPrice } from "@/lib/utils";

type Chip = { key: string; label: string; removeHref: string };

export function ActiveFilters({
  filters,
  params,
}: {
  filters: ParsedFilters;
  params: SearchParamMap;
}) {
  const base: Record<string, string | undefined> = {};
  const raw = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  for (const key of ["q", "transaction", "city", "district", "minPrice", "maxPrice", "bedrooms", "bathrooms", "sort"]) {
    const v = raw(key);
    if (v) base[key] = v;
  }
  const propertyTypes = filters.propertyType;
  const amenities = filters.amenities;
  if (propertyTypes.length) base.propertyType = propertyTypes.join(",");
  if (amenities.length) base.amenities = amenities.join(",");
  if (filters.availability !== "all") base.availability = filters.availability;

  const chips: Chip[] = [];

  const without = (key: string, value?: string): string => {
    if (value && (key === "propertyType" || key === "amenities")) {
      const list = (value ? base[key]?.split(",") ?? [] : []).filter((v) => v !== value);
      return buildSearchHref({ ...base, [key]: list.length ? list.join(",") : undefined });
    }
    return buildSearchHref({ ...base, [key]: undefined });
  };

  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, removeHref: without("q") });
  if (filters.transaction)
    chips.push({
      key: "transaction",
      label: filters.transaction === "sale" ? "For sale" : "For rent",
      removeHref: without("transaction"),
    });
  for (const type of propertyTypes) {
    chips.push({
      key: `type-${type}`,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      removeHref: without("propertyType", type),
    });
  }
  if (filters.city) chips.push({ key: "city", label: filters.city, removeHref: without("city") });
  if (filters.district) {
    chips.push({
      key: "district",
      label: filters.district.replace(/-[^-]+$/, "").replace(/-/g, " "),
      removeHref: without("district"),
    });
  }
  if (filters.minPrice != null)
    chips.push({
      key: "minPrice",
      label: `From ${formatPrice(filters.minPrice)}`,
      removeHref: without("minPrice"),
    });
  if (filters.maxPrice != null)
    chips.push({
      key: "maxPrice",
      label: `Up to ${formatPrice(filters.maxPrice)}`,
      removeHref: without("maxPrice"),
    });
  if (filters.bedrooms != null)
    chips.push({ key: "bedrooms", label: `${filters.bedrooms}+ beds`, removeHref: without("bedrooms") });
  if (filters.bathrooms != null)
    chips.push({ key: "bathrooms", label: `${filters.bathrooms}+ baths`, removeHref: without("bathrooms") });
  for (const amenity of amenities) {
    chips.push({ key: `amenity-${amenity}`, label: amenity, removeHref: without("amenities", amenity) });
  }
  if (filters.availability !== "all") {
    chips.push({
      key: "availability",
      label: filters.availability === "available" ? "Available" : "Sold / rented",
      removeHref: without("availability"),
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <a
          key={chip.key}
          href={chip.removeHref}
          className="group inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white py-1.5 pl-3 pr-2 text-xs text-stone-600 transition-colors hover:border-stone-400 hover:text-charcoal-900"
        >
          {chip.label}
          <span className="flex size-4 items-center justify-center rounded-full bg-ivory-200 text-[0.7rem] text-stone-500 transition-colors group-hover:bg-charcoal-900 group-hover:text-ivory-50">
            ×
          </span>
        </a>
      ))}
      {chips.length > 1 && (
        <ButtonLink href="/properties" variant="link" size="sm" className="text-xs text-stone-400">
          Clear all
        </ButtonLink>
      )}
    </div>
  );
}
