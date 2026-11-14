import {
  ALL_AMENITIES,
  PROPERTY_TYPES,
  SORT_OPTIONS,
} from "@/constants";
import { parseList, parseNumber, parseOne } from "@/lib/utils";
import { searchFiltersSchema, type ParsedFilters } from "@/lib/validation/property";

export type SearchParamMap = Record<string, string | string[] | undefined>;

const typeValues = new Set(PROPERTY_TYPES.map((t) => t.value));
const sortValues = new Set(SORT_OPTIONS.map((s) => s.value));
const amenitySet = new Set(ALL_AMENITIES);

/** Normalise Next.js searchParams into strictly-typed, safe filters. */
export function parseSearchFilters(params: SearchParamMap): ParsedFilters {
  const propertyType = parseList(params.propertyType).filter((v) => typeValues.has(v as never));
  const amenities = parseList(params.amenities).filter((v) => amenitySet.has(v));
  const sortRaw = parseOne(params.sort);
  const availabilityRaw = parseOne(params.availability);

  const candidate = {
    q: parseOne(params.q),
    transaction: parseOne(params.transaction) === "rent" ? "rent" : parseOne(params.transaction) === "sale" ? "sale" : undefined,
    propertyType,
    city: parseOne(params.city),
    district: parseOne(params.district),
    minPrice: parseNumber(params.minPrice),
    maxPrice: parseNumber(params.maxPrice),
    bedrooms: parseNumber(params.bedrooms),
    bathrooms: parseNumber(params.bathrooms),
    amenities,
    availability: availabilityRaw === "available" || availabilityRaw === "under_offer" ? availabilityRaw : "all",
    sort: sortRaw && sortValues.has(sortRaw as never) ? sortRaw : "relevance",
    page: Math.max(1, parseNumber(params.page) ?? 1),
    view: parseOne(params.view) === "map" ? "map" : "grid",
  };

  const parsed = searchFiltersSchema.safeParse(candidate);
  return parsed.success ? parsed.data : searchFiltersSchema.parse({});
}

/** Flatten filters back into URLSearchParams-friendly values. */
export function filtersToParams(filters: ParsedFilters): Record<string, string | undefined> {
  return {
    q: filters.q,
    transaction: filters.transaction,
    propertyType: filters.propertyType.length ? filters.propertyType.join(",") : undefined,
    city: filters.city,
    district: filters.district,
    minPrice: filters.minPrice != null ? String(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : undefined,
    bedrooms: filters.bedrooms != null ? String(filters.bedrooms) : undefined,
    bathrooms: filters.bathrooms != null ? String(filters.bathrooms) : undefined,
    amenities: filters.amenities.length ? filters.amenities.join(",") : undefined,
    availability: filters.availability !== "all" ? filters.availability : undefined,
    sort: filters.sort !== "relevance" ? filters.sort : undefined,
    view: filters.view !== "grid" ? filters.view : undefined,
  };
}
