/* ---------------------------------------------------------------------------
 * Property service — search, discovery, creation, moderation.
 * All queries run against MongoDB; no business logic lives in the UI.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Property, type PropertyDocument } from "@/models/Property";
import { POPULAR_DISTRICTS } from "@/constants/locations";
import {
  MAP_PAGE_SIZE,
  PAGE_SIZE,
  PUBLIC_PROPERTY_STATUSES,
  type PropertyStatus,
} from "@/constants";
import { geocodeAddress } from "@/lib/mapbox";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import type { ParsedFilters, PropertyInput } from "@/lib/validation/property";
import type {
  Paginated,
  PropertyDetail,
  PropertySummary,
} from "@/types";
import {
  serializePropertyDetail,
  serializePropertySummary,
} from "@/lib/mappers";
import { notify } from "@/lib/services/notification.service";
import type { SessionUser } from "@/types";

type AnyDoc = Record<string, unknown>;

const PUBLIC_STATUS_SET: PropertyStatus[] = [...PUBLIC_PROPERTY_STATUSES];

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "property";
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const exists = await Property.exists({ slug });
    if (!exists) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function districtFilter(districtSlug?: string) {
  if (!districtSlug) return null;
  const district = POPULAR_DISTRICTS.find((d) => d.slug === districtSlug);
  if (!district) return null;
  // Match the district name, or any property inside the district's city.
  return { district };
}

/* -------------------------------------------------------------------------- */
/* Search & discovery                                                         */
/* -------------------------------------------------------------------------- */

export async function searchProperties(
  filters: ParsedFilters,
  options: {
    statuses?: PropertyStatus[];
    agentId?: string;
    agencyId?: string;
    pageSize?: number;
    withLocationOnly?: boolean;
  } = {}
): Promise<Paginated<PropertySummary>> {
  await connectDB();

  const pageSize = options.pageSize ?? PAGE_SIZE;
  const query: QueryFilter<PropertyDocument> = {};

  if (options.statuses) {
    query.status = { $in: options.statuses };
  } else {
    query.status = { $in: PUBLIC_STATUS_SET };
  }
  if (options.agentId) query.agent = new Types.ObjectId(options.agentId);
  if (options.agencyId) query.agency = new Types.ObjectId(options.agencyId);
  if (options.withLocationOnly) query.location = { $ne: null };

  if (filters.transaction) query.transactionType = filters.transaction;
  if (filters.propertyType.length) query.propertyType = { $in: filters.propertyType };

  if (filters.city) {
    query["address.city"] = new RegExp(`^${escapeRegex(filters.city)}$`, "i");
  }

  const districtMatch = districtFilter(filters.district);
  if (districtMatch) {
    const district = POPULAR_DISTRICTS.find((d) => d.slug === filters.district)!;
    query["address.neighbourhood"] = new RegExp(`^${escapeRegex(district.name)}$`, "i");
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    const range: Record<string, number> = {};
    if (filters.minPrice != null) range.$gte = filters.minPrice;
    if (filters.maxPrice != null) range.$lte = filters.maxPrice;
    query.price = range;
  }

  if (filters.bedrooms != null) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms != null) query.bathrooms = { $gte: filters.bathrooms };
  if (filters.amenities.length) query.amenities = { $all: filters.amenities };
  if (filters.availability !== "all") query.availability = filters.availability;

  const useTextSearch = Boolean(filters.q && filters.q.length >= 2);
  if (useTextSearch) {
    query.$text = { $search: filters.q! };
  }

  const total = await Property.countDocuments(query);

  const sort: Record<string, 1 | -1 | { $meta: string }> = {};
  if (useTextSearch && filters.sort === "relevance") {
    sort.score = { $meta: "textScore" };
  }
  switch (filters.sort) {
    case "price_asc":
      sort.price = 1;
      sort.publishedAt = -1;
      break;
    case "price_desc":
      sort.price = -1;
      sort.publishedAt = -1;
      break;
    case "newest":
      sort.publishedAt = -1;
      sort.createdAt = -1;
      break;
    case "area_desc":
      sort.areaSqm = -1;
      sort.publishedAt = -1;
      break;
    default:
      sort.featured = -1;
      sort.publishedAt = -1;
  }
  if (!("publishedAt" in sort)) sort.publishedAt = -1;

  let findQuery = Property.find(query)
    .sort(sort)
    .skip((filters.page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  if (useTextSearch) {
    findQuery = findQuery.select({ score: { $meta: "textScore" } } as never);
  }

  const docs = (await findQuery) as unknown as AnyDoc[];

  return {
    items: docs.map(serializePropertySummary),
    page: filters.page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: filters.page * pageSize < total,
  };
}

/**
 * Viewport query for the map — properties inside a bounding box, respecting
 * the active search filters.
 */
export async function searchPropertiesInBounds(
  bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  filters: ParsedFilters
): Promise<PropertySummary[]> {
  await connectDB();

  const query: QueryFilter<PropertyDocument> = {
    status: { $in: PUBLIC_STATUS_SET },
    location: {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
              [bounds.minLng, bounds.maxLat],
              [bounds.minLng, bounds.minLat],
            ],
          ],
        },
      },
    },
  };

  if (filters.transaction) query.transactionType = filters.transaction;
  if (filters.propertyType.length) query.propertyType = { $in: filters.propertyType };
  if (filters.minPrice != null || filters.maxPrice != null) {
    const range: Record<string, number> = {};
    if (filters.minPrice != null) range.$gte = filters.minPrice;
    if (filters.maxPrice != null) range.$lte = filters.maxPrice;
    query.price = range;
  }
  if (filters.bedrooms != null) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms != null) query.bathrooms = { $gte: filters.bathrooms };
  if (filters.amenities.length) query.amenities = { $all: filters.amenities };
  if (filters.availability !== "all") query.availability = filters.availability;

  const docs = (await Property.find(query)
    .sort({ featured: -1, price: -1 })
    .limit(MAP_PAGE_SIZE)
    .lean()) as unknown as AnyDoc[];

  return docs.map(serializePropertySummary);
}

export type PropertyViewerContext = {
  user: SessionUser | null;
};

/** Fetch a property by slug, honouring draft/pending visibility rules. */
export async function getPropertyBySlug(
  slug: string,
  viewer: PropertyViewerContext
): Promise<PropertyDetail | null> {
  await connectDB();

  const doc = (await Property.findOne({ slug }).lean()) as unknown as AnyDoc | null;
  if (!doc) return null;

  const status = String(doc.status);
  const isOwner =
    viewer.user && String((doc.agent as AnyDoc)?._id ?? doc.agent) === viewer.user.id;
  const isStaff = viewer.user?.role === "admin";

  if (!PUBLIC_STATUS_SET.includes(status as PropertyStatus) && !isOwner && !isStaff) {
    return null;
  }

  const similar = await getSimilarProperties(doc, 4);
  return serializePropertyDetail(doc, similar);
}

export async function getSimilarProperties(source: AnyDoc, limit = 4): Promise<PropertySummary[]> {
  await connectDB();
  const id = source._id as Types.ObjectId;
  const city = ((source.address as AnyDoc | undefined)?.city ?? null) as string | null;

  const base = {
    _id: { $ne: id },
    status: { $in: PUBLIC_STATUS_SET },
    transactionType: source.transactionType,
    propertyType: source.propertyType,
  } as Record<string, unknown>;

  let docs = (await Property.find(base)
    .sort({ featured: -1, publishedAt: -1 })
    .limit(limit)
    .lean()) as unknown as AnyDoc[];

  if (docs.length < limit) {
    const filler = (await Property.find({
      _id: {
        $ne: id,
        ...(docs.length ? { $nin: docs.map((d) => d._id as Types.ObjectId) } : {}),
      },
      status: { $in: PUBLIC_STATUS_SET },
      ...(city ? { "address.city": city } : {}),
    })
      .sort({ featured: -1, publishedAt: -1 })
      .limit(limit - docs.length)
      .lean()) as unknown as AnyDoc[];
    docs = docs.concat(filler);
  }

  if (docs.length < limit) {
    const filler = (await Property.find({
      _id: {
        $ne: id,
        ...(docs.length ? { $nin: docs.map((d) => d._id as Types.ObjectId) } : {}),
      },
      status: { $in: PUBLIC_STATUS_SET },
    })
      .sort({ featured: -1, publishedAt: -1 })
      .limit(limit - docs.length)
      .lean()) as unknown as AnyDoc[];
    docs = docs.concat(filler);
  }

  return docs.map(serializePropertySummary);
}

export async function getFeaturedProperties(limit = 6): Promise<PropertySummary[]> {
  await connectDB();
  const docs = (await Property.find({
    status: { $in: PUBLIC_STATUS_SET },
    featured: true,
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean()) as unknown as AnyDoc[];
  return docs.map(serializePropertySummary);
}

export async function getNewListings(limit = 6): Promise<PropertySummary[]> {
  await connectDB();
  const docs = (await Property.find({ status: { $in: PUBLIC_STATUS_SET } })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()) as unknown as AnyDoc[];
  return docs.map(serializePropertySummary);
}

export async function getPropertiesByIds(ids: string[]): Promise<PropertySummary[]> {
  await connectDB();
  const objectIds = ids
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
  const docs = (await Property.find({ _id: { $in: objectIds } }).lean()) as unknown as AnyDoc[];
  const byId = new Map(docs.map((d) => [String(d._id), serializePropertySummary(d)]));
  return ids.map((id) => byId.get(id)).filter((p): p is PropertySummary => Boolean(p));
}

/** District counters powering the "Popular locations" section. */
export async function getDistrictCounts(): Promise<
  Array<{ slug: string; count: number }>
> {
  await connectDB();
  const rows = (await Property.aggregate([
    { $match: { status: { $in: PUBLIC_STATUS_SET } } },
    {
      $group: {
        _id: { neighbourhood: "$address.neighbourhood", city: "$address.city" },
        count: { $sum: 1 },
      },
    },
  ])) as Array<{ _id: { neighbourhood: string | null; city: string | null }; count: number }>;

  return POPULAR_DISTRICTS.map((d) => {
    const exact = rows
      .filter(
        (r) =>
          r._id.neighbourhood?.toLowerCase() === d.name.toLowerCase() ||
          r._id.city?.toLowerCase() === d.city.toLowerCase()
      )
      .reduce((sum, r) => sum + r.count, 0);
    return { slug: d.slug, count: exact };
  });
}

export async function getCityCounts(): Promise<Array<{ city: string; count: number }>> {
  await connectDB();
  const rows = (await Property.aggregate([
    { $match: { status: { $in: PUBLIC_STATUS_SET } } },
    { $group: { _id: "$address.city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ])) as Array<{ _id: string; count: number }>;
  return rows.map((r) => ({ city: r._id, count: r.count }));
}

export async function incrementPropertyViews(propertyId: string): Promise<void> {
  if (!Types.ObjectId.isValid(propertyId)) return;
  try {
    await connectDB();
    const today = new Date().toISOString().slice(0, 10);
    await Property.updateOne(
      { _id: propertyId },
      { $inc: { "stats.views": 1, [`viewLog.${today}`]: 1 } }
    );

    // Occasionally prune the daily log so it stays bounded (last 30 days).
    if (Math.random() < 0.1) {
      const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
      await Property.updateOne(
        { _id: propertyId },
        [
          {
            $set: {
              viewLog: {
                $arrayToObject: {
                  $filter: {
                    input: { $objectToArray: "$viewLog" },
                    cond: { $gte: ["$$this.k", cutoff] },
                  },
                },
              },
            },
          },
        ] as never
      );
    }
  } catch {
    /* non-critical */
  }
}

/* -------------------------------------------------------------------------- */
/* Creation & updates                                                         */
/* -------------------------------------------------------------------------- */

async function resolveLocation(
  input: PropertyInput
): Promise<{ coordinates: [number, number] | null; missing: boolean }> {
  if (input.lat != null && input.lng != null) {
    return { coordinates: [input.lng, input.lat], missing: false };
  }
  const query = [input.addressLine, input.city, input.country].filter(Boolean).join(", ");
  const result = await geocodeAddress(query);
  if (result) return { coordinates: [result.lng, result.lat], missing: false };
  return { coordinates: null, missing: true };
}

export async function createProperty(
  input: PropertyInput,
  actor: SessionUser
): Promise<PropertySummary> {
  if (actor.role !== "agent" && actor.role !== "admin") {
    throw new ForbiddenError("Only agents can publish listings.");
  }
  await connectDB();

  const slug = await uniqueSlug(input.title);
  const { coordinates, missing } = await resolveLocation(input);

  const status: PropertyStatus = input.status === "draft" ? "draft" : "pending";
  const now = new Date();

  const doc = await Property.create({
    slug,
    title: input.title,
    description: input.description,
    transactionType: input.transactionType,
    propertyType: input.propertyType,
    status,
    featured: false,
    availability: "available",
    price: input.price,
    currency: input.currency,
    pricePeriod: input.transactionType === "rent" ? "per_month" : input.pricePeriod,
    priceOnApplication: input.priceOnApplication,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSqm: input.areaSqm ?? null,
    lotSqm: input.lotSqm ?? null,
    yearBuilt: input.yearBuilt ?? null,
    floors: input.floors ?? null,
    parking: input.parking ?? null,
    furnishing: input.furnishing ?? null,
    orientation: input.orientation ?? null,
    heating: input.heating ?? null,
    cooling: input.cooling ?? null,
    tenure: input.tenure ?? null,
    epc: input.epc ?? null,
    address: {
      line: input.addressLine,
      neighbourhood: input.neighbourhood ?? null,
      city: input.city,
      state: input.state ?? null,
      postalCode: input.postalCode ?? null,
      country: input.country,
    },
    location: coordinates ? { type: "Point", coordinates } : undefined,
    locationMissing: missing,
    highlights: input.highlights,
    amenities: input.amenities,
    images: input.images.map((img) => ({
      url: img.url,
      alt: img.alt || input.title,
      publicId: img.publicId ?? null,
    })),
    videoUrl: input.videoUrl ?? null,
    floorPlans: input.floorPlans,
    agent: new Types.ObjectId(actor.id),
    agency: actor.agencyId ? new Types.ObjectId(actor.agencyId) : null,
    submittedAt: status === "pending" ? now : null,
    stats: { views: 0, favourites: 0, enquiries: 0 },
  });

  const created = (await Property.findById(doc._id).lean()) as unknown as AnyDoc;
  return serializePropertySummary(created);
}

export async function updateProperty(
  propertyId: string,
  input: PropertyInput,
  actor: SessionUser
): Promise<PropertySummary> {
  await connectDB();
  const existing = (await Property.findById(propertyId).lean()) as unknown as AnyDoc | null;
  if (!existing) throw new NotFoundError("Listing not found.");

  const ownerId = String((existing.agent as AnyDoc)?._id ?? existing.agent);
  if (ownerId !== actor.id && actor.role !== "admin") {
    throw new ForbiddenError("You can only edit your own listings.");
  }

  const previousAddress = [
    (existing.address as AnyDoc)?.line,
    (existing.address as AnyDoc)?.city,
    (existing.address as AnyDoc)?.country,
  ].join(", ");
  const nextAddress = [input.addressLine, input.city, input.country].join(", ");

  let coordinates: [number, number] | null = null;
  let missing = false;

  if (input.lat != null && input.lng != null) {
    coordinates = [input.lng, input.lat];
  } else if (nextAddress !== previousAddress) {
    const resolved = await resolveLocation(input);
    coordinates = resolved.coordinates;
    missing = resolved.missing;
  } else {
    const loc = existing.location as { coordinates?: [number, number] } | null;
    if (loc?.coordinates?.length === 2) coordinates = loc.coordinates;
    else missing = true;
  }

  // A rejected or draft listing returns to review when resubmitted.
  const currentStatus = String(existing.status);
  const nextStatus: PropertyStatus =
    input.status === "draft"
      ? currentStatus === "rejected"
        ? "draft"
        : (currentStatus as PropertyStatus)
      : currentStatus === "approved" || currentStatus === "pending"
        ? currentStatus
        : "pending";

  const update: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    transactionType: input.transactionType,
    propertyType: input.propertyType,
    status: nextStatus,
    price: input.price,
    currency: input.currency,
    pricePeriod: input.transactionType === "rent" ? "per_month" : input.pricePeriod,
    priceOnApplication: input.priceOnApplication,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    areaSqm: input.areaSqm ?? null,
    lotSqm: input.lotSqm ?? null,
    yearBuilt: input.yearBuilt ?? null,
    floors: input.floors ?? null,
    parking: input.parking ?? null,
    furnishing: input.furnishing ?? null,
    orientation: input.orientation ?? null,
    heating: input.heating ?? null,
    cooling: input.cooling ?? null,
    tenure: input.tenure ?? null,
    epc: input.epc ?? null,
    address: {
      line: input.addressLine,
      neighbourhood: input.neighbourhood ?? null,
      city: input.city,
      state: input.state ?? null,
      postalCode: input.postalCode ?? null,
      country: input.country,
    },
    highlights: input.highlights,
    amenities: input.amenities,
    images: input.images.map((img) => ({
      url: img.url,
      alt: img.alt || input.title,
      publicId: img.publicId ?? null,
    })),
    videoUrl: input.videoUrl ?? null,
    floorPlans: input.floorPlans,
    locationMissing: missing,
    rejectionReason: nextStatus === "pending" ? null : (existing.rejectionReason ?? null),
  };

  if (coordinates) update.location = { type: "Point", coordinates };
  if (input.status === "pending" && currentStatus !== "approved") {
    update.submittedAt = new Date();
    update.rejectionReason = null;
  }

  await Property.updateOne({ _id: propertyId }, { $set: update });

  const updated = (await Property.findById(propertyId).lean()) as unknown as AnyDoc;
  return serializePropertySummary(updated);
}

export async function deleteProperty(propertyId: string, actor: SessionUser): Promise<void> {
  await connectDB();
  const existing = (await Property.findById(propertyId).lean()) as unknown as AnyDoc | null;
  if (!existing) throw new NotFoundError("Listing not found.");
  const ownerId = String((existing.agent as AnyDoc)?._id ?? existing.agent);
  if (ownerId !== actor.id && actor.role !== "admin") {
    throw new ForbiddenError("You can only delete your own listings.");
  }
  if (String(existing.status) === "approved" && actor.role !== "admin") {
    // Approved listings are archived rather than hard-deleted (audit trail).
    await Property.updateOne(
      { _id: propertyId },
      { $set: { status: "archived", featured: false } }
    );
    return;
  }
  await Property.deleteOne({ _id: propertyId });
}

/* -------------------------------------------------------------------------- */
/* Moderation (admin)                                                         */
/* -------------------------------------------------------------------------- */

export type ModerationAction = "approve" | "reject" | "feature" | "unfeature" | "archive" | "restore";

export async function moderateProperty(
  propertyId: string,
  action: ModerationAction,
  reason: string | undefined,
  admin: SessionUser
): Promise<PropertySummary> {
  await connectDB();
  const doc = (await Property.findById(propertyId).lean()) as unknown as AnyDoc | null;
  if (!doc) throw new NotFoundError("Listing not found.");

  const update: Record<string, unknown> = {};
  const now = new Date();

  switch (action) {
    case "approve":
      update.status = "approved";
      update.approvedAt = now;
      update.publishedAt = (doc.publishedAt as Date | null) ?? now;
      update.rejectionReason = null;
      update.reviewedBy = new Types.ObjectId(admin.id);
      update.availability = "available";
      break;
    case "reject":
      if (!reason) throw new AppError("A reason is required to reject a listing.");
      update.status = "rejected";
      update.rejectionReason = reason;
      update.reviewedBy = new Types.ObjectId(admin.id);
      update.featured = false;
      break;
    case "feature":
      update.featured = true;
      if (String(doc.status) !== "approved") {
        update.status = "approved";
        update.publishedAt = (doc.publishedAt as Date | null) ?? now;
        update.approvedAt = now;
      }
      break;
    case "unfeature":
      update.featured = false;
      break;
    case "archive":
      update.status = "archived";
      update.featured = false;
      break;
    case "restore":
      update.status = doc.approvedAt ? "approved" : "pending";
      update.publishedAt = (doc.publishedAt as Date | null) ?? now;
      break;
  }

  await Property.updateOne({ _id: propertyId }, { $set: update });

  // Notify the listing agent about the decision.
  const agentId = String((doc.agent as AnyDoc)?._id ?? doc.agent);
  if (action === "approve" || action === "reject") {
    await notify({
      userId: agentId,
      type: action === "approve" ? "listing_approved" : "listing_rejected",
      title: action === "approve" ? "Your listing is live" : "Listing needs changes",
      body:
        action === "approve"
          ? `“${String(doc.title)}” has been approved and is now visible in the marketplace.`
          : `“${String(doc.title)}” was returned for changes: ${reason}`,
      href: `/dashboard/listings`,
    });
  }

  const updated = (await Property.findById(propertyId).lean()) as unknown as AnyDoc;
  return serializePropertySummary(updated);
}

/* -------------------------------------------------------------------------- */
/* Agent listing management                                                   */
/* -------------------------------------------------------------------------- */

export async function getAgentListings(
  agentId: string,
  options: {
    status?: PropertyStatus | "all";
    q?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<Paginated<PropertySummary>> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? PAGE_SIZE;

  const query: QueryFilter<PropertyDocument> = { agent: new Types.ObjectId(agentId) };
  if (options.status && options.status !== "all") query.status = options.status;
  if (options.q) {
    const re = new RegExp(escapeRegex(options.q), "i");
    query.$or = [{ title: re }, { "address.city": re }, { "address.neighbourhood": re }];
  }

  const total = await Property.countDocuments(query);
  const docs = (await Property.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()) as unknown as AnyDoc[];

  return {
    items: docs.map(serializePropertySummary),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

export async function getPropertyForEdit(
  propertyId: string,
  actor: SessionUser
): Promise<AnyDoc> {
  await connectDB();
  const doc = (await Property.findById(propertyId).lean()) as unknown as AnyDoc | null;
  if (!doc) throw new NotFoundError("Listing not found.");
  const ownerId = String((doc.agent as AnyDoc)?._id ?? doc.agent);
  if (ownerId !== actor.id && actor.role !== "admin") {
    throw new ForbiddenError("You can only edit your own listings.");
  }
  return doc;
}

/** Moderation queue for admins. */
export async function getModerationQueue(
  options: { status?: PropertyStatus; page?: number; q?: string } = {}
): Promise<Paginated<PropertySummary>> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = PAGE_SIZE;
  const query: QueryFilter<PropertyDocument> = {};
  query.status = options.status ?? { $in: ["pending", "rejected", "approved"] as PropertyStatus[] };
  if (options.q) {
    const re = new RegExp(escapeRegex(options.q), "i");
    query.$or = [{ title: re }, { "address.city": re }, { slug: re }];
  }

  const total = await Property.countDocuments(query);
  const docs = (await Property.find(query)
    .sort({ submittedAt: -1, createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean()) as unknown as AnyDoc[];

  return {
    items: docs.map(serializePropertySummary),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

/** Owner-driven availability change (sold / rented / back on market). */
export async function setListingAvailability(
  propertyId: string,
  action: "mark_sold" | "mark_rented" | "mark_available" | "archive",
  actor: SessionUser
): Promise<PropertySummary> {
  await connectDB();
  const doc = (await Property.findById(propertyId).lean()) as unknown as AnyDoc | null;
  if (!doc) throw new NotFoundError("Listing not found.");
  const ownerId = String((doc.agent as AnyDoc)?._id ?? doc.agent);
  if (ownerId !== actor.id && actor.role !== "admin") {
    throw new ForbiddenError("You can only update your own listings.");
  }

  const update: Record<string, unknown> = {};
  switch (action) {
    case "mark_sold":
      update.status = "sold";
      update.availability = "under_offer";
      update.featured = false;
      break;
    case "mark_rented":
      update.status = "rented";
      update.availability = "under_offer";
      update.featured = false;
      break;
    case "mark_available":
      update.status = "approved";
      update.availability = "available";
      update.publishedAt = (doc.publishedAt as Date | null) ?? new Date();
      break;
    case "archive":
      update.status = "archived";
      update.featured = false;
      break;
  }

  await Property.updateOne({ _id: propertyId }, { $set: update });
  const updated = (await Property.findById(propertyId).lean()) as unknown as AnyDoc;
  return serializePropertySummary(updated);
}
