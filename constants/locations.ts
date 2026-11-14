/* ---------------------------------------------------------------------------
 * Locations — curated districts featured on the homepage and used to seed
 * demonstration data. Coordinates are district centroids (approximate).
 * ------------------------------------------------------------------------ */

export type District = {
  slug: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  blurb: string;
  image: string;
  lat: number;
  lng: number;
};

export const POPULAR_DISTRICTS: District[] = [
  {
    slug: "banana-island-lagos",
    name: "Banana Island",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    blurb: "West Africa's most exclusive peninsula",
    image: "/images/locations/banana-island.svg",
    lat: 6.4436,
    lng: 3.4346,
  },
  {
    slug: "ikoyi-lagos",
    name: "Ikoyi",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    blurb: "Old-money calm beside the lagoon",
    image: "/images/locations/ikoyi.svg",
    lat: 6.4541,
    lng: 3.4348,
  },
  {
    slug: "lekki-phase-1-lagos",
    name: "Lekki Phase 1",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    blurb: "Contemporary living on the Atlantic corridor",
    image: "/images/locations/lekki.svg",
    lat: 6.4478,
    lng: 3.4723,
  },
  {
    slug: "palm-jumeirah-dubai",
    name: "Palm Jumeirah",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    blurb: "Beachfront villas on the iconic palm",
    image: "/images/locations/palm-jumeirah.svg",
    lat: 25.1124,
    lng: 55.139,
  },
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    blurb: "Skyline penthouses at the Burj's feet",
    image: "/images/locations/downtown-dubai.svg",
    lat: 25.1972,
    lng: 55.2744,
  },
  {
    slug: "mayfair-london",
    name: "Mayfair",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    blurb: "Garden squares and discreet addresses",
    image: "/images/locations/mayfair.svg",
    lat: 51.5077,
    lng: -0.15,
  },
  {
    slug: "chelsea-london",
    name: "Chelsea",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    blurb: "Riverside townhouses with pedigree",
    image: "/images/locations/chelsea.svg",
    lat: 51.487,
    lng: -0.168,
  },
  {
    slug: "tribeca-new-york",
    name: "Tribeca",
    city: "New York",
    country: "United States",
    countryCode: "US",
    blurb: "Cast-iron lofts and cobblestone calm",
    image: "/images/locations/tribeca.svg",
    lat: 40.7163,
    lng: -74.0086,
  },
  {
    slug: "upper-east-side-new-york",
    name: "Upper East Side",
    city: "New York",
    country: "United States",
    countryCode: "US",
    blurb: "Museum-mile elegance",
    image: "/images/locations/upper-east-side.svg",
    lat: 40.7736,
    lng: -73.957,
  },
  {
    slug: "bantry-bay-cape-town",
    name: "Bantry Bay",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    blurb: "Sunset-facing slopes above the Atlantic",
    image: "/images/locations/bantry-bay.svg",
    lat: -33.9146,
    lng: 18.3786,
  },
];

export const CITIES = Array.from(
  new Map(
    POPULAR_DISTRICTS.map((d) => [
      d.city,
      { city: d.city, country: d.country, countryCode: d.countryCode, slug: d.city.toLowerCase().replace(/\s+/g, "-") },
    ])
  ).values()
);

export function districtBySlug(slug: string): District | undefined {
  return POPULAR_DISTRICTS.find((d) => d.slug === slug);
}
