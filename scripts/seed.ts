/* ---------------------------------------------------------------------------
 * seed — deterministic demonstration data for Arcadia.
 *
 *   npm run seed
 *
 * Clears the marketplace collections and recreates agencies, members, 24
 * listings across ten districts, enquiries, viewings, saved searches and
 * moderation items. Safe to re-run at any time.
 * ------------------------------------------------------------------------ */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Agency } from "../models/Agency";
import { User } from "../models/User";
import { Property } from "../models/Property";
import { Enquiry } from "../models/Enquiry";
import { Inspection } from "../models/Inspection";
import { Favourite } from "../models/Favourite";
import { Comparison } from "../models/Comparison";
import { RecentlyViewed } from "../models/RecentlyViewed";
import { Notification } from "../models/Notification";
import { Report } from "../models/Report";
import { POPULAR_DISTRICTS, type District } from "../constants/locations";
import { ALL_AMENITIES, INSPECTION_SLOTS } from "../constants";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/arcadia";
const PASSWORD = "Arcadia!2026";
const SALT_ROUNDS = 12;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * DAY);
const daysAhead = (days: number) => new Date(now + days * DAY);

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

const pct = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.abs(x - Math.floor(x));
};

const districtBySlug = (slug: string): District => {
  const found = POPULAR_DISTRICTS.find((d) => d.slug === slug);
  if (!found) throw new Error(`Unknown district ${slug}`);
  return found;
};

/* --------------------------------- users -------------------------------- */

type SeedAgent = {
  name: string;
  email: string;
  avatar: string;
  agency: string;
  verification: "verified" | "pending" | "rejected";
  license: string | null;
  years: number;
  specializations: string[];
  languages: string[];
  serviceAreas: string[];
  bio: string;
};

const AGENTS: SeedAgent[] = [
  {
    name: "Ava Sterling",
    email: "ava@sterling.example",
    avatar: "/images/agents/ava.svg",
    agency: "Sterling & Co.",
    verification: "verified",
    license: "UK-NAEA-448201",
    years: 14,
    specializations: ["Luxury sales", "Waterfront", "Investment"],
    languages: ["English", "French"],
    serviceAreas: ["Mayfair", "Chelsea", "Belgravia"],
    bio: "Ava has spent fourteen years placing exceptional homes with private clients across prime central London, with a particular eye for riverside and garden-square addresses.",
  },
  {
    name: "Julian Okafor",
    email: "julian@meridian.example",
    avatar: "/images/agents/julian.svg",
    agency: "Meridian Estates",
    verification: "verified",
    license: "AE-RERA-77119",
    years: 11,
    specializations: ["Palm Jumeirah", "Branded residences", "Off-plan"],
    languages: ["English", "Arabic"],
    serviceAreas: ["Palm Jumeirah", "Downtown Dubai", "Emirates Hills"],
    bio: "Julian advises international buyers on Dubai's waterfront and branded-residence market, from first viewings through to handover and resale.",
  },
  {
    name: "Noor Al-Farsi",
    email: "noor@meridian.example",
    avatar: "/images/agents/noor.svg",
    agency: "Meridian Estates",
    verification: "verified",
    license: "AE-RERA-80344",
    years: 8,
    specializations: ["Downtown Dubai", "Penthouses", "Relocation"],
    languages: ["English", "Arabic", "German"],
    serviceAreas: ["Downtown Dubai", "Business Bay", "DIFC"],
    bio: "Noor looks after a discreet portfolio of skyline apartments and penthouses, and specialises in helping families relocate into Downtown Dubai.",
  },
  {
    name: "Lena Whitmore",
    email: "lena@sterling.example",
    avatar: "/images/agents/lena.svg",
    agency: "Sterling & Co.",
    verification: "pending",
    license: "UK-NAEA-992613",
    years: 5,
    specializations: ["Mews houses", "Townhouses"],
    languages: ["English"],
    serviceAreas: ["Mayfair", "Marylebone"],
    bio: "Lena joined Sterling & Co. after five years in heritage property, and is building a reputation for beautifully restored mews houses.",
  },
  {
    name: "Tunde Balogun",
    email: "tunde@atlantic.example",
    avatar: "/images/agents/tunde.svg",
    agency: "Atlantic & Vine",
    verification: "verified",
    license: "NG-LAG-2019-8842",
    years: 16,
    specializations: ["Waterfront", "Luxury sales", "Land"],
    languages: ["English", "Yoruba"],
    serviceAreas: ["Banana Island", "Ikoyi", "Lekki Phase 1"],
    bio: "Tunde is one of Lagos' most experienced luxury agents, with a long record of waterfront transactions on Banana Island and Ikoyi.",
  },
  {
    name: "Sofia Marchetti",
    email: "sofia@atlantic.example",
    avatar: "/images/agents/sofia.svg",
    agency: "Atlantic & Vine",
    verification: "rejected",
    license: null,
    years: 4,
    specializations: ["Rentals", "Serviced apartments"],
    languages: ["English", "Italian"],
    serviceAreas: ["Lekki Phase 1", "Victoria Island"],
    bio: "Sofia manages a portfolio of serviced rentals across Lagos' island districts, with a focus on relocating executives.",
  },
  {
    name: "Marcus Reed",
    email: "marcus@sterling.example",
    avatar: "/images/agents/marcus.svg",
    agency: "Sterling & Co.",
    verification: "verified",
    license: "US-NY-REB-1048821",
    years: 13,
    specializations: ["Lofts", "Co-ops", "Investment"],
    languages: ["English", "Spanish"],
    serviceAreas: ["Tribeca", "SoHo", "Upper East Side"],
    bio: "Marcus works with buyers and investors in downtown Manhattan, from cast-iron lofts in Tribeca to pre-war co-ops on the Upper East Side.",
  },
  {
    name: "Imani Cole",
    email: "imani@meridian.example",
    avatar: "/images/agents/imani.svg",
    agency: "Meridian Estates",
    verification: "pending",
    license: "ZA-PPRA-55208",
    years: 6,
    specializations: ["Coastal homes", "Architectural"],
    languages: ["English", "Afrikaans"],
    serviceAreas: ["Bantry Bay", "Camps Bay", "Clifton"],
    bio: "Imani represents architecturally significant homes along Cape Town's Atlantic seaboard, with a focus on sunset-facing slopes in Bantry Bay.",
  },
];

const AGENCIES = [
  {
    name: "Sterling & Co.",
    slug: "sterling-and-co",
    logoUrl: "/images/agencies/sterling.svg",
    description:
      "A private-client brokerage representing exceptional homes in London, New York and beyond. Founded on discretion, editorial standards and long-term relationships.",
    website: "https://sterling.example",
    email: "hello@sterling.example",
    phone: "+44 20 7946 0112",
    country: "United Kingdom",
    city: "London",
    address: "18 Mount Street, Mayfair",
    verified: true,
    foundedYear: 1998,
    licenseNumber: "UK-BROKER-20441",
  },
  {
    name: "Meridian Estates",
    slug: "meridian-estates",
    logoUrl: "/images/agencies/meridian.svg",
    description:
      "Waterfront and skyline specialists operating across Dubai and Cape Town, with an advisory-led approach to international acquisitions.",
    website: "https://meridian.example",
    email: "clients@meridian.example",
    phone: "+971 4 555 0182",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "Level 24, Gate Village 4, DIFC",
    verified: true,
    foundedYear: 2006,
    licenseNumber: "AE-BROKER-11872",
  },
  {
    name: "Atlantic & Vine",
    slug: "atlantic-and-vine",
    logoUrl: "/images/agencies/atlantic.svg",
    description:
      "Lagos' waterfront house, representing Banana Island, Ikoyi and Lekki with in-house legal, valuation and property-management teams.",
    website: "https://atlanticvine.example",
    email: "studio@atlanticvine.example",
    phone: "+234 1 460 7788",
    country: "Nigeria",
    city: "Lagos",
    address: "7A Glover Road, Ikoyi",
    verified: true,
    foundedYear: 2011,
    licenseNumber: "NG-LAG-BROKER-3320",
  },
];

/* ------------------------------- listings -------------------------------- */

type ListingSeed = {
  title: string;
  district: string;
  type: "apartment" | "villa" | "house" | "penthouse" | "townhouse" | "duplex";
  transaction: "sale" | "rent";
  price: number;
  currency: "USD" | "EUR" | "GBP" | "AED" | "NGN";
  beds: number;
  baths: number;
  area: number;
  lot?: number;
  year: number;
  status: "approved" | "pending" | "draft" | "rejected" | "sold" | "rented";
  featured?: boolean;
  agent: number;
  highlights: string[];
};

const LISTINGS: ListingSeed[] = [
  {
    title: "Lagoon-front villa with private jetty",
    district: "banana-island-lagos",
    type: "villa",
    transaction: "sale",
    price: 1_450_000_000,
    currency: "NGN",
    beds: 5,
    baths: 6,
    area: 820,
    lot: 1400,
    year: 2019,
    status: "approved",
    featured: true,
    agent: 4,
    highlights: ["Private jetty on the lagoon", "Infinity pool with sunset terrace", "Staff quarters and generator house"],
  },
  {
    title: "Contemporary mansion with staff quarters",
    district: "banana-island-lagos",
    type: "house",
    transaction: "sale",
    price: 1_150_000_000,
    currency: "NGN",
    beds: 6,
    baths: 7,
    area: 940,
    lot: 1600,
    year: 2021,
    status: "pending",
    agent: 4,
    highlights: ["Double-height entrance hall", "Cinema and gym wing", "Landscaped gardens by a Lagos studio"],
  },
  {
    title: "Furnished waterfront duplex, Banana Island",
    district: "banana-island-lagos",
    type: "duplex",
    transaction: "rent",
    price: 42_000_000,
    currency: "NGN",
    beds: 4,
    baths: 5,
    area: 460,
    year: 2020,
    status: "approved",
    agent: 4,
    highlights: ["Fully furnished and serviced", "Shared jetty access", "Backup power and water treatment"],
  },
  {
    title: "Garden residence off Glover Road",
    district: "ikoyi-lagos",
    type: "house",
    transaction: "sale",
    price: 780_000_000,
    currency: "NGN",
    beds: 4,
    baths: 5,
    area: 520,
    lot: 900,
    year: 2016,
    status: "approved",
    agent: 5,
    highlights: ["Mature tropical garden", "Recently refurbished kitchen", "Guest cottage at the rear"],
  },
  {
    title: "Penthouse with panoramic lagoon views",
    district: "ikoyi-lagos",
    type: "penthouse",
    transaction: "sale",
    price: 1_050_000_000,
    currency: "NGN",
    beds: 4,
    baths: 4,
    area: 390,
    year: 2022,
    status: "approved",
    featured: true,
    agent: 5,
    highlights: ["Full-floor private lift lobby", "Wrap-around terrace", "Concierge and residents' pool"],
  },
  {
    title: "Serviced three-bedroom apartment in Ikoyi",
    district: "ikoyi-lagos",
    type: "apartment",
    transaction: "rent",
    price: 18_500_000,
    currency: "NGN",
    beds: 3,
    baths: 3,
    area: 210,
    year: 2018,
    status: "approved",
    agent: 5,
    highlights: ["Hotel-style services", "Furnished to a high standard", "Pool and gym access"],
  },
  {
    title: "Architect-designed duplex in Lekki Phase 1",
    district: "lekki-phase-1-lagos",
    type: "duplex",
    transaction: "sale",
    price: 320_000_000,
    currency: "NGN",
    beds: 4,
    baths: 4,
    area: 340,
    lot: 480,
    year: 2023,
    status: "approved",
    agent: 4,
    highlights: ["Double-volume living space", "Solar and inverter backup", "Gated street with security"],
  },
  {
    title: "New-build terrace with rooftop lounge",
    district: "lekki-phase-1-lagos",
    type: "townhouse",
    transaction: "rent",
    price: 14_000_000,
    currency: "NGN",
    beds: 3,
    baths: 4,
    area: 260,
    year: 2024,
    status: "approved",
    agent: 5,
    highlights: ["Rooftop entertaining deck", "Fitted wardrobes throughout", "Secure estate with gym"],
  },
  {
    title: "Palm-facing villa with private beach",
    district: "palm-jumeirah-dubai",
    type: "villa",
    transaction: "sale",
    price: 28_500_000,
    currency: "AED",
    beds: 5,
    baths: 6,
    area: 700,
    lot: 1100,
    year: 2017,
    status: "approved",
    featured: true,
    agent: 1,
    highlights: ["Direct private beach frontage", "Temperature-controlled pool", "Skyline views from the roof terrace"],
  },
  {
    title: "Atlantis-view signature villa",
    district: "palm-jumeirah-dubai",
    type: "villa",
    transaction: "sale",
    price: 19_800_000,
    currency: "AED",
    beds: 4,
    baths: 5,
    area: 560,
    lot: 780,
    year: 2015,
    status: "pending",
    agent: 2,
    highlights: ["Uninterrupted Atlantis views", "Landscaped courtyard", "Upgraded kitchen and bathrooms"],
  },
  {
    title: "Furnished beach house on the Palm",
    district: "palm-jumeirah-dubai",
    type: "villa",
    transaction: "rent",
    price: 1_250_000,
    currency: "AED",
    beds: 4,
    baths: 4,
    area: 480,
    year: 2020,
    status: "approved",
    agent: 1,
    highlights: ["Available furnished", "Private pool and beach access", "Chiller and service charges included"],
  },
  {
    title: "Burj Khalifa-view sky residence",
    district: "downtown-dubai",
    type: "apartment",
    transaction: "sale",
    price: 8_900_000,
    currency: "AED",
    beds: 3,
    baths: 3,
    area: 210,
    year: 2016,
    status: "approved",
    featured: true,
    agent: 2,
    highlights: ["Direct Burj Khalifa outlook", "High floor with floor-to-ceiling glass", "Residents' pool and spa"],
  },
  {
    title: "Designer apartment in Downtown Dubai",
    district: "downtown-dubai",
    type: "apartment",
    transaction: "rent",
    price: 480_000,
    currency: "AED",
    beds: 2,
    baths: 2,
    area: 140,
    year: 2019,
    status: "approved",
    agent: 2,
    highlights: ["Fully furnished by an Italian studio", "Walk to Dubai Mall", "Two parking bays"],
  },
  {
    title: "Grade II townhouse on Mount Street",
    district: "mayfair-london",
    type: "townhouse",
    transaction: "sale",
    price: 14_750_000,
    currency: "GBP",
    beds: 5,
    baths: 5,
    area: 380,
    year: 1902,
    status: "approved",
    agent: 0,
    highlights: ["Grade II listed façade", "Private walled garden", "Lift to all five floors"],
  },
  {
    title: "Elegant lateral apartment in Mayfair",
    district: "mayfair-london",
    type: "apartment",
    transaction: "sale",
    price: 6_250_000,
    currency: "GBP",
    beds: 3,
    baths: 3,
    area: 235,
    year: 1935,
    status: "approved",
    agent: 0,
    highlights: ["First-floor lateral layout", "Original cornicing and fireplaces", "24-hour porterage"],
  },
  {
    title: "Furnished Mayfair pied-à-terre",
    district: "mayfair-london",
    type: "apartment",
    transaction: "rent",
    price: 18_500,
    currency: "GBP",
    beds: 2,
    baths: 2,
    area: 128,
    year: 1968,
    status: "approved",
    agent: 3,
    highlights: ["Turn-key furnished", "Quiet rear aspect", "Concierge and lift"],
  },
  {
    title: "Riverside Chelsea townhouse",
    district: "chelsea-london",
    type: "townhouse",
    transaction: "sale",
    price: 11_400_000,
    currency: "GBP",
    beds: 5,
    baths: 4,
    area: 410,
    year: 1895,
    status: "approved",
    agent: 0,
    highlights: ["Views over Chelsea Creek", "South-facing garden", "Self-contained lower ground floor"],
  },
  {
    title: "Chelsea Manor penthouse",
    district: "chelsea-london",
    type: "penthouse",
    transaction: "rent",
    price: 26_000,
    currency: "GBP",
    beds: 3,
    baths: 3,
    area: 260,
    year: 2014,
    status: "rented",
    agent: 3,
    highlights: ["Private roof terrace", "Two underground parking spaces", "Secured gated development"],
  },
  {
    title: "Cast-iron loft with private elevator",
    district: "tribeca-new-york",
    type: "apartment",
    transaction: "sale",
    price: 8_950_000,
    currency: "USD",
    beds: 3,
    baths: 3,
    area: 280,
    year: 1888,
    status: "approved",
    agent: 6,
    highlights: ["Keyed-elevator entry", "Original cast-iron columns", "12-foot ceilings"],
  },
  {
    title: "Pre-war classic six with park views",
    district: "upper-east-side-new-york",
    type: "apartment",
    transaction: "sale",
    price: 4_850_000,
    currency: "USD",
    beds: 3,
    baths: 2,
    area: 190,
    year: 1928,
    status: "approved",
    agent: 6,
    highlights: ["Central Park views", "Formal dining room", "Full-service white-glove building"],
  },
  {
    title: "Cliffside home above the Atlantic",
    district: "bantry-bay-cape-town",
    type: "house",
    transaction: "sale",
    price: 5_600_000,
    currency: "USD",
    beds: 4,
    baths: 5,
    area: 440,
    lot: 700,
    year: 2020,
    status: "approved",
    agent: 7,
    highlights: ["180-degree ocean views", "Solar-powered and water storage", "Infinity pool on the slope"],
  },
  {
    title: "Tribeca warehouse conversion",
    district: "tribeca-new-york",
    type: "apartment",
    transaction: "sale",
    price: 6_200_000,
    currency: "USD",
    beds: 2,
    baths: 2,
    area: 210,
    year: 1912,
    status: "draft",
    agent: 6,
    highlights: ["Corner loft with four exposures", "Chef's kitchen", "Storage room included"],
  },
  {
    title: "Mayfair mews house, newly refurbished",
    district: "mayfair-london",
    type: "house",
    transaction: "sale",
    price: 4_900_000,
    currency: "GBP",
    beds: 3,
    baths: 3,
    area: 170,
    year: 1910,
    status: "rejected",
    agent: 3,
    highlights: ["Rear mews conversion", "Roof terrace", "Garage with direct access"],
  },
  {
    title: "Signature Palm villa with sunset deck",
    district: "palm-jumeirah-dubai",
    type: "villa",
    transaction: "sale",
    price: 32_000_000,
    currency: "AED",
    beds: 6,
    baths: 7,
    area: 850,
    lot: 1250,
    year: 2018,
    status: "sold",
    agent: 1,
    highlights: ["West-facing sunset deck", "Private beach and pool", "Staff accommodation"],
  },
];

/* ------------------------------- helpers -------------------------------- */

const STREETS = ["Marina Crescent", "Glover Road", "Bourdon Place", "Oak Avenue", "Cedar Walk", "Harbour Lane", "Palm Esplanade", "Belgrave Row"];
const DESCRIPTION_OPENERS = [
  "A rare opportunity in one of the neighbourhood's most sought-after positions.",
  "Quietly confident architecture, executed with an exceptional level of finish.",
  "Designed for entertaining, with generous volumes and a strong sense of light.",
  "A beautifully proportioned home that balances period character with modern comfort.",
  "Set behind a discreet private entrance, with outlooks that change through the day.",
  "A considered renovation has created a calm, contemporary interior throughout.",
];

function descriptionFor(seed: ListingSeed, index: number, district: District) {
  const type = seed.type.replace(/_/g, " ");
  return [
    `${seed.title}. ${DESCRIPTION_OPENERS[index % DESCRIPTION_OPENERS.length]}`,
    `This ${type} extends to approximately ${seed.area} square metres, arranged over a practical and elegant plan. The principal reception opens to a south-facing terrace, while the kitchen is finished with integrated appliances and natural stone surfaces.`,
    `Set in ${district.name}, ${district.city}, the property is well placed for ${district.blurb.toLowerCase()}. Private viewings are strictly by appointment with the listing agent.`,
  ].join("\n\n");
}

function amenitiesFor(index: number) {
  const start = (index * 7) % ALL_AMENITIES.length;
  const picked = new Set<string>();
  let cursor = start;
  while (picked.size < 8 + (index % 4)) {
    picked.add(ALL_AMENITIES[cursor % ALL_AMENITIES.length]);
    cursor += 3;
  }
  return Array.from(picked);
}

/* --------------------------------- main --------------------------------- */

async function main() {
  console.log("\n  Arcadia — seeding demonstration data\n");
  await mongoose.connect(MONGODB_URI);
  console.log(`  Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  await mongoose.connection.dropDatabase();
  await Promise.all([
    Agency.createCollection(),
    User.createCollection(),
    Property.createCollection(),
    Enquiry.createCollection(),
    Inspection.createCollection(),
    Favourite.createCollection(),
    Comparison.createCollection(),
    RecentlyViewed.createCollection(),
    Notification.createCollection(),
    Report.createCollection(),
  ]);
  await Promise.all([
    Agency.syncIndexes(),
    User.syncIndexes(),
    Property.syncIndexes(),
    Enquiry.syncIndexes(),
    Inspection.syncIndexes(),
    Favourite.syncIndexes(),
    Comparison.syncIndexes(),
    RecentlyViewed.syncIndexes(),
    Notification.syncIndexes(),
    Report.syncIndexes(),
  ]);
  console.log("  Reset database and rebuilt indexes");

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  /* Agencies */
  const agencyDocs = await Agency.insertMany(
    AGENCIES.map((agency) => ({ ...agency, verifiedAt: daysAgo(120) }))
  );
  const agencyByName = new Map(agencyDocs.map((doc) => [doc.name, doc]));
  console.log(`  Seeded ${agencyDocs.length} agencies`);

  /* Admin + customers */
  const admin = await User.create({
    name: "Marion Voss",
    email: "admin@arcadia.example",
    passwordHash,
    role: "admin",
    avatarUrl: "/images/agents/imani.svg",
    phone: "+44 20 7946 0999",
    bio: "Platform curator at Arcadia.",
    status: "active",
    verificationStatus: "verified",
  });

  const customers = await User.insertMany([
    {
      name: "Chidi Nwosu",
      email: "chidi@example.com",
      passwordHash,
      role: "customer",
      phone: "+234 803 555 0142",
      status: "active",
      verificationStatus: "unverified",
    },
    {
      name: "Emily Carter",
      email: "emily@example.com",
      passwordHash,
      role: "customer",
      phone: "+44 7700 900182",
      status: "active",
      verificationStatus: "unverified",
    },
    {
      name: "Daniel Kim",
      email: "daniel@example.com",
      passwordHash,
      role: "customer",
      phone: "+1 212 555 0177",
      status: "active",
      verificationStatus: "unverified",
    },
  ]);

  /* Agents */
  const agentDocs = await User.insertMany(
    AGENTS.map((agent) => ({
      name: agent.name,
      email: agent.email,
      passwordHash,
      role: "agent",
      status: "active",
      avatarUrl: agent.avatar,
      slug: slugify(agent.name),
      verificationStatus: agent.verification,
      agency: agencyByName.get(agent.agency)?._id ?? null,
      licenseNumber: agent.license,
      specializations: agent.specializations,
      languages: agent.languages,
      yearsExperience: agent.years,
      serviceAreas: agent.serviceAreas,
      profileComplete: Boolean(agent.license && agent.specializations.length),
      bio: agent.bio,
      phone: "+44 20 7946 0" + (100 + AGENTS.indexOf(agent)),
    }))
  );
  console.log(`  Seeded ${agentDocs.length} agents, ${customers.length} customers, 1 admin`);

  /* Properties */
  const propertyDocs = await Property.insertMany(
    LISTINGS.map((seed, index) => {
      const district = districtBySlug(seed.district);
      const agent = agentDocs[seed.agent]!;
      const images = [1, 2, 3, 4].map((n) => ({ url: `/images/properties/property-${((index * 3 + n) % 12) + 1}.svg`, alt: seed.title }));
      const publishedAt = seed.status === "pending" || seed.status === "draft" ? null : daysAgo(20 + index * 4);
      const stats = {
        views: Math.round(160 + pct(index + 1) * 2400),
        favourites: Math.round(4 + pct(index + 2) * 70),
        enquiries: 0,
      };
      const viewLog = Object.fromEntries(
        Array.from({ length: 14 }, (_, d) => {
          const date = new Date(now - (13 - d) * DAY).toISOString().slice(0, 10);
          return [date, Math.round(6 + pct(index * 31 + d + 7) * 60)];
        })
      );

      return {
        slug: slugify(seed.title),
        title: seed.title,
        description: descriptionFor(seed, index, district),
        transactionType: seed.transaction,
        propertyType: seed.type,
        status: seed.status,
        featured: Boolean(seed.featured),
        availability: seed.status === "sold" || seed.status === "rented" ? "under_offer" : "available",
        price: seed.price,
        currency: seed.currency,
        pricePeriod: seed.transaction === "rent" ? "per_month" : "total",
        priceOnApplication: false,
        bedrooms: seed.beds,
        bathrooms: seed.baths,
        areaSqm: seed.area,
        lotSqm: seed.lot ?? null,
        yearBuilt: seed.year,
        floors: seed.type === "villa" || seed.type === "house" ? 2 : 1,
        parking: 2,
        furnishing: seed.transaction === "rent" ? "furnished" : "unfurnished",
        orientation: "South-west",
        heating: "Underfloor",
        cooling: "Central air",
        tenure: "Freehold",
        epc: "B",
        address: {
          line: `${4 + index} ${STREETS[index % STREETS.length]}`,
          neighbourhood: district.name,
          city: district.city,
          state: null,
          postalCode: null,
          country: district.country,
        },
        location: {
          type: "Point" as const,
          coordinates: [district.lng + (pct(index + 11) - 0.5) * 0.008, district.lat + (pct(index + 17) - 0.5) * 0.006],
        },
        locationMissing: false,
        highlights: seed.highlights,
        amenities: amenitiesFor(index),
        images,
        videoUrl: index % 5 === 0 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : null,
        floorPlans: [
          { url: "/images/floorplans/plan-1.svg", label: "Ground floor" },
          { url: "/images/floorplans/plan-2.svg", label: "Upper level" },
        ],
        agent: agent._id,
        agency: agent.agency ?? null,
        stats,
        viewLog,
        submittedAt: seed.status === "draft" ? null : daysAgo(28 + index * 2),
        approvedAt: ["approved", "sold", "rented"].includes(seed.status) ? publishedAt : null,
        publishedAt,
        rejectionReason: seed.status === "rejected" ? "Photography appears to be from another listing; please upload original images and a floor plan." : null,
        reviewedBy: ["approved", "sold", "rented", "rejected"].includes(seed.status) ? admin._id : null,
      };
    })
  );
  console.log(`  Seeded ${propertyDocs.length} listings across ${POPULAR_DISTRICTS.length} districts`);

  const approved = propertyDocs.filter((p) => ["approved", "sold", "rented"].includes(p.status));
  const live = propertyDocs.filter((p) => p.status === "approved");

  /* Saved properties, comparisons, history */
  const chidi = customers[0]!;
  const emily = customers[1]!;

  await Favourite.insertMany(
    [
      { user: chidi._id, property: live[0]!._id },
      { user: chidi._id, property: live[4]!._id },
      { user: chidi._id, property: live[8]!._id },
      { user: chidi._id, property: live[11]!._id },
      { user: emily._id, property: live[13]!._id },
      { user: emily._id, property: live[16]!._id },
    ].map((row, index) => ({ ...row, createdAt: daysAgo(index + 2), updatedAt: daysAgo(index + 2) }))
  );

  await Comparison.create({
    user: chidi._id,
    properties: [live[0]!._id, live[4]!._id, live[13]!._id],
  });
  await Comparison.create({
    user: emily._id,
    properties: [live[8]!._id, live[11]!._id],
  });

  await RecentlyViewed.insertMany(
    [0, 4, 7, 8, 13, 18].map((offset, index) => ({
      user: chidi._id,
      property: approved[offset % approved.length]!._id,
      viewedAt: new Date(now - index * 3 * 60 * 60 * 1000),
    }))
  );
  await RecentlyViewed.insertMany(
    [2, 10, 15].map((offset, index) => ({
      user: emily._id,
      property: approved[offset % approved.length]!._id,
      viewedAt: new Date(now - index * 8 * 60 * 60 * 1000),
    }))
  );

  /* Enquiries */
  const enquirySeeds = [
    { customer: chidi, property: live[0]!, status: "new", message: "We're relocating from London in the spring and this looks ideal. Could we see the jetty and staff quarters on a video call first?", reply: null },
    { customer: emily, property: live[13]!, status: "replied", message: "Is the garden freehold and is there any onward chain? We'd like to view this Saturday if possible.", reply: "The garden is freehold and there is no chain. Saturday at 11:00 works — I'll confirm the address by email." },
    { customer: chidi, property: live[8]!, status: "read", message: "What are the annual service charges and is the beach frontage private?", reply: null },
    { customer: emily, property: live[11]!, status: "new", message: "We're interested in a long-term rental. Is the furniture included and are chiller charges covered?", reply: null },
    { customer: customers[2]!, property: live[4]!, status: "replied", message: "Please send the floor plan and any recent service charge statements. Thank you.", reply: "Floor plan attached and service charges for the last two years are available on request." },
    { customer: customers[2]!, property: live[16]!, status: "closed", message: "We've decided to pause our search, but thank you for the quick response.", reply: "Understood — I'll keep you on the list for similar riverside homes." },
  ];

  const enquiryDocs = await Enquiry.insertMany(
    enquirySeeds.map((seed, index) => ({
      property: seed.property._id,
      customer: seed.customer._id,
      agent: seed.property.agent,
      message: seed.message,
      phone: seed.customer.phone ?? null,
      status: seed.status,
      reply: seed.reply,
      repliedAt: seed.reply ? daysAgo(index + 1) : null,
      source: index % 2 === 0 ? "detail" : "search",
      createdAt: daysAgo(index + 1),
      updatedAt: daysAgo(index + 1),
    }))
  );
  console.log(`  Seeded ${enquiryDocs.length} enquiries`);

  /* Inspections */
  const inspectionSeeds = [
    { customer: chidi, property: live[0]!, status: "requested", date: daysAhead(4), slot: INSPECTION_SLOTS[2]!, note: null },
    { customer: emily, property: live[13]!, status: "confirmed", date: daysAhead(2), slot: INSPECTION_SLOTS[1]!, note: null },
    { customer: chidi, property: live[5]!, status: "rescheduled", date: daysAhead(6), slot: INSPECTION_SLOTS[3]!, note: "The owner has asked to move the viewing two hours later." },
    { customer: customers[2]!, property: live[9]!, status: "completed", date: daysAgo(3), slot: INSPECTION_SLOTS[0]!, note: "Great viewing — client is considering an offer." },
    { customer: emily, property: live[11]!, status: "declined", date: daysAhead(1), slot: INSPECTION_SLOTS[4]!, note: "Apologies, the tenant cannot accommodate viewings this week." },
  ];

  const inspectionDocs = await Inspection.insertMany(
    inspectionSeeds.map((seed, index) => {
      const scheduled = ["confirmed", "completed"].includes(seed.status) ? seed.date : null;
      return {
        property: seed.property._id,
        customer: seed.customer._id,
        agent: seed.property.agent,
        preferredDate: seed.date,
        alternativeDate: index === 0 ? daysAhead(5) : null,
        slot: seed.slot,
        message: index % 2 === 0 ? "Please allow 45 minutes — we'd like to see the garden and parking." : null,
        status: seed.status,
        scheduledAt: scheduled,
        responseNote: seed.note,
        proposedDate: seed.status === "rescheduled" ? daysAhead(7) : null,
        proposedSlot: seed.status === "rescheduled" ? INSPECTION_SLOTS[5]! : null,
        createdAt: daysAgo(index + 2),
        updatedAt: daysAgo(index + 1),
      };
    })
  );
  console.log(`  Seeded ${inspectionDocs.length} viewings`);

  /* Keep listing stats consistent with seeded engagement */
  for (const property of propertyDocs) {
    const enquiries = enquiryDocs.filter((e) => String(e.property) === String(property._id)).length;
    const favourites = await Favourite.countDocuments({ property: property._id });
    await Property.updateOne(
      { _id: property._id },
      { $set: { "stats.enquiries": enquiries, "stats.favourites": property.stats.favourites + favourites } }
    );
  }

  /* Notifications */
  await Notification.insertMany([
    { user: admin._id, type: "system", title: "Three listings awaiting review", body: "New submissions from Lagos, Dubai and New York are ready for moderation.", href: "/dashboard/moderation", read: false, createdAt: daysAgo(0) },
    { user: admin._id, type: "system", title: "New report filed", body: "A member reported a Mayfair listing for misleading information.", href: "/dashboard/reports", read: false, createdAt: daysAgo(1) },
    { user: admin._id, type: "verification", title: "Verification requested", body: "Lena Whitmore submitted licence details for review.", href: "/dashboard/verification", read: true, readAt: daysAgo(2), createdAt: daysAgo(3) },
    { user: agentDocs[0]!._id, type: "enquiry", title: "New enquiry", body: "Emily Carter asked about Grade II townhouse on Mount Street.", href: "/dashboard/enquiries", read: false, createdAt: daysAgo(1) },
    { user: agentDocs[0]!._id, type: "inspection", title: "Viewing confirmed", body: "Emily Carter confirmed a viewing for Saturday at 10:00.", href: "/dashboard/inspections", read: false, createdAt: daysAgo(8) },
    { user: agentDocs[0]!._id, type: "listing_approved", title: "Listing approved", body: "“Grade II townhouse on Mount Street” is now live.", href: "/properties/grade-ii-townhouse-on-mount-street", read: true, readAt: daysAgo(5), createdAt: daysAgo(6) },
    { user: agentDocs[4]!._id, type: "enquiry", title: "New enquiry", body: "Chidi Nwosu asked about Lagoon-front villa with private jetty.", href: "/dashboard/enquiries", read: false, createdAt: daysAgo(0) },
    { user: agentDocs[4]!._id, type: "inspection", title: "New viewing request", body: "A viewing has been requested for Lagoon-front villa with private jetty.", href: "/dashboard/inspections", read: false, createdAt: daysAgo(1) },
    { user: agentDocs[5]!._id, type: "verification", title: "Verification not approved", body: "Your verification was not approved. Please add a valid licence number and reapply.", href: "/dashboard/settings", read: false, createdAt: daysAgo(4) },
    { user: chidi._id, type: "enquiry_reply", title: "Ava Sterling replied", body: "Your enquiry about Grade II townhouse on Mount Street has a reply.", href: "/dashboard/enquiries", read: false, createdAt: daysAgo(1) },
    { user: chidi._id, type: "inspection_update", title: "Viewing rescheduled", body: "The agent proposed a new time for your viewing at Serviced three-bedroom apartment in Ikoyi.", href: "/dashboard/inspections", read: false, createdAt: daysAgo(2) },
    { user: chidi._id, type: "system", title: "Welcome to Arcadia", body: "Save properties, compare shortlists and arrange private viewings from your dashboard.", href: "/dashboard", read: true, readAt: daysAgo(9), createdAt: daysAgo(10) },
    { user: emily._id, type: "inspection", title: "Viewing confirmed", body: "Your viewing at Grade II townhouse on Mount Street is confirmed for Saturday.", href: "/dashboard/inspections", read: true, readAt: daysAgo(1), createdAt: daysAgo(2) },
  ]);
  console.log("  Seeded notifications");

  /* Reports */
  await Report.insertMany([
    {
      reporter: emily._id,
      targetType: "property",
      targetId: propertyDocs[22]!._id,
      targetLabel: propertyDocs[22]!.title,
      reason: "misleading",
      details: "The photographs appear to show a different property to the floor plan.",
      status: "open",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      reporter: customers[2]!._id,
      targetType: "user",
      targetId: agentDocs[5]!._id,
      targetLabel: agentDocs[5]!.name,
      reason: "scam",
      details: "I was asked for a deposit before any viewing or contract was shared.",
      status: "reviewing",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      reporter: chidi._id,
      targetType: "agency",
      targetId: agencyDocs[0]!._id,
      targetLabel: agencyDocs[0]!.name,
      reason: "inaccurate",
      details: "The agency's stated service areas do not match the listings shown.",
      status: "resolved",
      resolution: "Agency profile corrected and verified with the branch principal.",
      reviewedBy: admin._id,
      reviewedAt: daysAgo(2),
      createdAt: daysAgo(6),
      updatedAt: daysAgo(2),
    },
  ]);
  console.log("  Seeded 3 reports");

  console.log(`
  ────────────────────────────────────────────────────────────
  Seed complete.

    Admin     admin@arcadia.example     ${PASSWORD}
    Agent     ava@sterling.example      ${PASSWORD}
    Agent     tunde@atlantic.example    ${PASSWORD}
    Customer  chidi@example.com         ${PASSWORD}
    Customer  emily@example.com         ${PASSWORD}

    ${agentDocs.length} agents · ${propertyDocs.length} listings · ${live.length} live
  ────────────────────────────────────────────────────────────
`);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n  Seed failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
