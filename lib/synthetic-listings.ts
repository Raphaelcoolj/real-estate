/* ---------------------------------------------------------------------------
 * Synthetic listing generator — shared by the admin import studio and tests.
 * Produces entries that satisfy the listing import schema, spread across the
 * curated districts, property types and available agents.
 * ------------------------------------------------------------------------ */

import { ALL_AMENITIES, PROPERTY_TYPES } from "@/constants";
import { POPULAR_DISTRICTS } from "@/constants/locations";

export type AgentOption = { name: string; email: string };
export type SyntheticStatus = "pending" | "approved";

const CURRENCY_BY_COUNTRY: Record<string, "NGN" | "AED" | "GBP" | "USD" | "EUR"> = {
  Nigeria: "NGN",
  "United Arab Emirates": "AED",
  "United Kingdom": "GBP",
  "United States": "USD",
  France: "EUR",
};

const AMENITY_POOL = [
  "Swimming pool",
  "Private garden",
  "Garage",
  "24/7 security",
  "Air conditioning",
  "Gym",
  "Terrace",
  "Smart home",
  "Concierge",
  "Fibre internet",
].filter((amenity) => ALL_AMENITIES.includes(amenity));

export function syntheticListings(count: number, agents: AgentOption[], status: SyntheticStatus) {
  return Array.from({ length: count }, (_, index) => {
    const district = POPULAR_DISTRICTS[index % POPULAR_DISTRICTS.length]!;
    const agent = agents[index % agents.length]!;
    const type = PROPERTY_TYPES[(index * 5 + 2) % PROPERTY_TYPES.length]!;
    const transactionType = index % 4 === 0 ? "rent" : "sale";
    const bedrooms = [2, 3, 4, 5, 6][index % 5]!;
    const bathrooms = Math.max(1, bedrooms - 1);
    const areaSqm = 85 + bedrooms * 58 + (index % 4) * 22;
    const currency = CURRENCY_BY_COUNTRY[district.country] ?? "USD";
    const price =
      transactionType === "rent"
        ? 3_500 + bedrooms * 2_250 + (index % 6) * 400
        : 420_000 + bedrooms * 315_000 + (index % 7) * 85_000;
    const start = index % Math.max(1, AMENITY_POOL.length - 4);
    const amenities = AMENITY_POOL.slice(start, start + 5);
    const title = `${bedrooms}-bedroom ${type.label.toLowerCase()} in ${district.name}`;

    return {
      slug: `synthetic-${district.slug}-${type.value}-${index + 1}`,
      title,
      description:
        `Synthetic demonstration listing ${index + 1}. A ${bedrooms}-bedroom ${type.label.toLowerCase()} ` +
        `in ${district.name}, ${district.city} — ${district.blurb.toLowerCase()}. The home offers ` +
        `${areaSqm} sqm of flexible living space, a private outdoor area and parking, and is presented ` +
        `in move-in condition. Generated from the admin data import tool for testing and demos; ` +
        `replace or delete it once real inventory is loaded.`,
      transactionType,
      propertyType: type.value,
      status,
      price,
      currency,
      pricePeriod: transactionType === "rent" ? "per_month" : "total",
      bedrooms,
      bathrooms,
      areaSqm,
      lotSqm: type.value === "villa" || type.value === "house" ? areaSqm + 320 : null,
      yearBuilt: 2012 + (index % 12),
      furnishing: index % 3 === 0 ? "furnished" : "unfurnished",
      parking: 1 + (index % 3),
      addressLine: `${12 + index} ${["Marina Crescent", "Glover Road", "Palm Esplanade", "Belgrave Row"][index % 4]}`,
      neighbourhood: district.name,
      city: district.city,
      country: district.country,
      lat: Number((district.lat + ((index % 5) - 2) * 0.0016).toFixed(6)),
      lng: Number((district.lng + ((index % 7) - 3) * 0.0016).toFixed(6)),
      highlights: [
        `${bedrooms} bedrooms · ${bathrooms} bathrooms`,
        `${areaSqm} sqm of living space`,
        district.blurb,
      ],
      amenities,
      images: [1, 2, 3].map((n) => ({
        url: `/images/properties/property-${((index * 3 + n) % 12) + 1}.svg`,
        alt: `${type.label} in ${district.name} — view ${n}`,
      })),
      agentEmail: agent.email,
    };
  });
}
