/* ---------------------------------------------------------------------------
 * Listing form values — plain types and defaults shared by the client form
 * and the server pages that render it (calling this from a client module on
 * the server is not allowed in Next).
 * ------------------------------------------------------------------------ */

import type { CurrencyCode, PropertyType } from "@/constants";

export type ListingFormValues = {
  title: string;
  description: string;
  transactionType: "sale" | "rent";
  propertyType: PropertyType;
  price: number;
  currency: CurrencyCode;
  pricePeriod: "total" | "per_month";
  priceOnApplication: boolean;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
  lotSqm: string;
  yearBuilt: string;
  floors: string;
  parking: string;
  furnishing: string;
  orientation: string;
  heating: string;
  cooling: string;
  tenure: string;
  epc: string;
  addressLine: string;
  neighbourhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: string;
  lng: string;
  highlights: string[];
  amenities: string[];
  images: { url: string; publicId?: string | null }[];
  videoUrl: string;
  floorPlans: { url: string; label: string }[];
};

export function emptyListingFormValues(): ListingFormValues {
  return {
    title: "",
    description: "",
    transactionType: "sale",
    propertyType: "apartment",
    price: 0,
    currency: "USD",
    pricePeriod: "total",
    priceOnApplication: false,
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: "",
    lotSqm: "",
    yearBuilt: "",
    floors: "",
    parking: "",
    furnishing: "",
    orientation: "",
    heating: "",
    cooling: "",
    tenure: "",
    epc: "",
    addressLine: "",
    neighbourhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    lat: "",
    lng: "",
    highlights: [],
    amenities: [],
    images: [],
    videoUrl: "",
    floorPlans: [],
  };
}

