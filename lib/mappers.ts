/* ---------------------------------------------------------------------------
 * Mappers — lean Mongoose documents → JSON-safe DTOs.
 * Nothing from this layer leaks password hashes or internal bookkeeping.
 * ------------------------------------------------------------------------ */

import type {
  AgencySummary,
  ComparisonDTO,
  EnquiryDTO,
  FavouriteDTO,
  InspectionDTO,
  NotificationDTO,
  PropertyDetail,
  PropertySpecs,
  PropertySummary,
  PublicAgent,
  RecentlyViewedDTO,
  ReportDTO,
} from "@/types";
import type { CurrencyCode, PropertyStatus, PropertyType, VerificationStatus } from "@/constants";

type AnyDoc = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "" : String(v));
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const strOrNull = (v: unknown): string | null => (v == null ? null : String(v));
const iso = (v: unknown): string => {
  if (!v) return new Date(0).toISOString();
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
};
const isoOrNull = (v: unknown): string | null => {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function idOf(v: unknown): string {
  if (v && typeof v === "object" && "_id" in (v as AnyDoc)) return str((v as AnyDoc)._id);
  return str(v);
}

function coordsOf(doc: AnyDoc): { lat: number; lng: number } | null {
  const loc = doc.location as AnyDoc | null | undefined;
  if (!loc || !Array.isArray(loc.coordinates) || loc.coordinates.length < 2) return null;
  const [lng, lat] = loc.coordinates as [number, number];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return { lat, lng };
}

function imageUrls(doc: AnyDoc): string[] {
  const images = Array.isArray(doc.images) ? doc.images : [];
  return images
    .map((img) => (typeof img === "string" ? img : str((img as AnyDoc).url)))
    .filter((u) => Boolean(u));
}

export function serializePropertySummary(doc: AnyDoc): PropertySummary {
  const stats = (doc.stats as AnyDoc) ?? {};
  const agent = (doc.agent as AnyDoc) ?? {};
  const agency = doc.agency as AnyDoc | null | undefined;
  const address = (doc.address as AnyDoc) ?? {};
  const images = imageUrls(doc);

  return {
    id: idOf(doc),
    slug: str(doc.slug),
    title: str(doc.title),
    transactionType: str(doc.transactionType) as PropertySummary["transactionType"],
    propertyType: str(doc.propertyType) as PropertyType,
    status: str(doc.status) as PropertyStatus,
    featured: Boolean(doc.featured),
    price: num(doc.price) ?? 0,
    currency: str(doc.currency || "USD") as CurrencyCode,
    pricePeriod: (str(doc.pricePeriod) || "total") as PropertySummary["pricePeriod"],
    bedrooms: num(doc.bedrooms) ?? 0,
    bathrooms: num(doc.bathrooms) ?? 0,
    areaSqm: num(doc.areaSqm),
    lotSqm: num(doc.lotSqm),
    city: str(address.city),
    country: str(address.country),
    neighbourhood: strOrNull(address.neighbourhood),
    addressLine: str(address.line),
    coverImage: images[0] ?? "/images/placeholder-property.svg",
    images,
    publishedAt: isoOrNull(doc.publishedAt),
    createdAt: iso(doc.createdAt),
    agent: {
      id: idOf(agent),
      name: str(agent.name),
      slug: str(agent.slug) || idOf(agent),
      avatarUrl: strOrNull(agent.avatarUrl),
      verificationStatus: str(agent.verificationStatus || "unverified") as VerificationStatus,
    },
    agency: agency
      ? {
          id: idOf(agency),
          name: str(agency.name),
          slug: str(agency.slug),
          logoUrl: strOrNull(agency.logoUrl),
        }
      : null,
    location: coordsOf(doc),
    stats: {
      views: num(stats.views) ?? 0,
      favourites: num(stats.favourites) ?? 0,
      enquiries: num(stats.enquiries) ?? 0,
    },
  };
}

export function serializePropertyDetail(doc: AnyDoc, similar: PropertySummary[]): PropertyDetail {
  const summary = serializePropertySummary(doc);
  const agent = (doc.agent as AnyDoc) ?? {};
  const address = (doc.address as AnyDoc) ?? {};

  const specs: PropertySpecs = {
    areaSqm: num(doc.areaSqm),
    lotSqm: num(doc.lotSqm),
    yearBuilt: num(doc.yearBuilt),
    floors: num(doc.floors),
    parking: num(doc.parking),
    furnishing: (strOrNull(doc.furnishing) ?? null) as PropertySpecs["furnishing"],
    orientation: strOrNull(doc.orientation),
    heating: strOrNull(doc.heating),
    cooling: strOrNull(doc.cooling),
    tenure: strOrNull(doc.tenure),
    epc: strOrNull(doc.epc),
  };

  const floorPlans = Array.isArray(doc.floorPlans)
    ? doc.floorPlans.map((fp: unknown) => ({
        url: str((fp as AnyDoc).url),
        label: str((fp as AnyDoc).label) || "Floor plan",
      }))
    : [];

  return {
    ...summary,
    description: str(doc.description),
    highlights: Array.isArray(doc.highlights) ? doc.highlights.map(str) : [],
    amenities: Array.isArray(doc.amenities) ? doc.amenities.map(str) : [],
    specs,
    videoUrl: strOrNull(doc.videoUrl),
    floorPlans,
    address: {
      line: str(address.line),
      neighbourhood: strOrNull(address.neighbourhood),
      city: str(address.city),
      state: strOrNull(address.state),
      postalCode: strOrNull(address.postalCode),
      country: str(address.country),
    },
    approvedAt: isoOrNull(doc.approvedAt),
    agent: serializeAgent(agent),
    similar,
  };
}

export function serializeAgent(doc: AnyDoc): PublicAgent {
  const agency = doc.agency as AnyDoc | null | undefined;
  const email = strOrNull(doc.email);
  return {
    id: idOf(doc),
    name: str(doc.name),
    slug: str(doc.slug) || idOf(doc),
    role: (str(doc.role) || "agent") as PublicAgent["role"],
    avatarUrl: strOrNull(doc.avatarUrl),
    bio: strOrNull(doc.bio),
    phone: strOrNull(doc.phone),
    email: email ?? undefined,
    verificationStatus: str(doc.verificationStatus || "unverified") as VerificationStatus,
    agency: agency
      ? {
          id: idOf(agency),
          name: str(agency.name),
          slug: str(agency.slug),
          logoUrl: strOrNull(agency.logoUrl),
          country: strOrNull(agency.country),
        }
      : null,
    specializations: Array.isArray(doc.specializations) ? doc.specializations.map(str) : [],
    languages: Array.isArray(doc.languages) ? doc.languages.map(str) : [],
    yearsExperience: num(doc.yearsExperience),
    licenseNumber: strOrNull(doc.licenseNumber),
    createdAt: iso(doc.createdAt),
  };
}

export function serializeAgency(doc: AnyDoc, counts: { agents: number; listings: number }): AgencySummary {
  return {
    id: idOf(doc),
    name: str(doc.name),
    slug: str(doc.slug),
    logoUrl: strOrNull(doc.logoUrl),
    description: strOrNull(doc.description),
    country: strOrNull(doc.country),
    city: strOrNull(doc.city),
    website: strOrNull(doc.website),
    email: strOrNull(doc.email),
    phone: strOrNull(doc.phone),
    verified: Boolean(doc.verified),
    agentCount: counts.agents,
    listingCount: counts.listings,
    coverImage: strOrNull(doc.coverImage),
  };
}

export function serializeEnquiry(doc: AnyDoc): EnquiryDTO {
  const property = doc.property as AnyDoc | null | undefined;
  const customer = doc.customer as AnyDoc | null | undefined;
  const agent = doc.agent as AnyDoc | null | undefined;
  return {
    id: idOf(doc),
    property: property
      ? {
          id: idOf(property),
          title: str(property.title),
          slug: str(property.slug),
          coverImage:
            imageUrls(property)[0] ?? "/images/placeholder-property.svg",
          price: num(property.price) ?? 0,
          currency: str(property.currency || "USD") as CurrencyCode,
        }
      : null,
    customer: customer
      ? {
          id: idOf(customer),
          name: str(customer.name),
          email: str(customer.email),
          avatarUrl: strOrNull(customer.avatarUrl),
        }
      : null,
    agent: agent
      ? { id: idOf(agent), name: str(agent.name), slug: str(agent.slug) || idOf(agent) }
      : null,
    message: str(doc.message),
    phone: strOrNull(doc.phone),
    status: str(doc.status) as EnquiryDTO["status"],
    createdAt: iso(doc.createdAt),
    reply: strOrNull(doc.reply),
    repliedAt: isoOrNull(doc.repliedAt),
  };
}

export function serializeInspection(doc: AnyDoc): InspectionDTO {
  const property = doc.property as AnyDoc | null | undefined;
  const customer = doc.customer as AnyDoc | null | undefined;
  const agent = doc.agent as AnyDoc | null | undefined;
  return {
    id: idOf(doc),
    property: property
      ? {
          id: idOf(property),
          title: str(property.title),
          slug: str(property.slug),
          coverImage: imageUrls(property)[0] ?? "/images/placeholder-property.svg",
          addressLine: str((property.address as AnyDoc | undefined)?.line),
          city: str((property.address as AnyDoc | undefined)?.city),
        }
      : null,
    customer: customer
      ? { id: idOf(customer), name: str(customer.name), email: str(customer.email) }
      : null,
    agent: agent
      ? { id: idOf(agent), name: str(agent.name), slug: str(agent.slug) || idOf(agent) }
      : null,
    preferredDate: iso(doc.preferredDate),
    alternativeDate: isoOrNull(doc.alternativeDate),
    slot: str(doc.slot),
    message: strOrNull(doc.message),
    status: str(doc.status) as InspectionDTO["status"],
    createdAt: iso(doc.createdAt),
    scheduledAt: isoOrNull(doc.scheduledAt),
    responseNote: strOrNull(doc.responseNote),
  };
}

export function serializeNotification(doc: AnyDoc): NotificationDTO {
  return {
    id: idOf(doc),
    type: str(doc.type) as NotificationDTO["type"],
    title: str(doc.title),
    body: str(doc.body),
    href: strOrNull(doc.href),
    read: Boolean(doc.read),
    createdAt: iso(doc.createdAt),
  };
}

export function serializeFavourite(doc: AnyDoc): FavouriteDTO {
  const property = doc.property as AnyDoc;
  return {
    id: idOf(doc),
    property: serializePropertySummary(property),
    createdAt: iso(doc.createdAt),
  };
}

export function serializeComparison(doc: AnyDoc): ComparisonDTO {
  const properties = Array.isArray(doc.properties) ? doc.properties : [];
  return {
    id: idOf(doc),
    properties: properties.filter((p) => p && (p as AnyDoc).slug).map((p) => serializePropertySummary(p as AnyDoc)),
  };
}

export function serializeRecentlyViewed(doc: AnyDoc): RecentlyViewedDTO {
  return {
    property: serializePropertySummary(doc.property as AnyDoc),
    viewedAt: iso(doc.viewedAt ?? doc.updatedAt),
  };
}

export function serializeReport(doc: AnyDoc): ReportDTO {
  const reporter = doc.reporter as AnyDoc | null | undefined;
  const targetLabel =
    str(doc.targetLabel) ||
    (doc.targetType === "property"
      ? `Property ${idOf(doc.targetId)}`
      : `${str(doc.targetType)} ${idOf(doc.targetId)}`);
  return {
    id: idOf(doc),
    targetType: str(doc.targetType) as ReportDTO["targetType"],
    targetId: idOf(doc.targetId),
    targetLabel,
    reason: str(doc.reason),
    details: strOrNull(doc.details),
    status: str(doc.status) as ReportDTO["status"],
    reporter: reporter
      ? { id: idOf(reporter), name: str(reporter.name), email: str(reporter.email) }
      : null,
    resolution: strOrNull(doc.resolution),
    createdAt: iso(doc.createdAt),
  };
}
