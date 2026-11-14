/* ---------------------------------------------------------------------------
 * Listing import — shared by `npm run import` and the admin dashboard.
 *
 * Accepts an array of listings, validates them with the same rules as the
 * listing form, resolves the owning agent/agency, and upserts by slug.
 * No React or Next.js imports so the CLI and Server Actions can both use it.
 * ------------------------------------------------------------------------ */

import { Types } from "mongoose";
import { z } from "zod";
import { Agency } from "@/models/Agency";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { propertyInputBaseSchema } from "@/lib/validation/property";

export const MAX_IMPORT_ENTRIES = 500;
export const MAX_IMPORT_BYTES = 2_000_000;

export const listingImportSchema = propertyInputBaseSchema.extend({
  slug: z.string().trim().min(1).max(220).optional(),
  agentEmail: z.string().trim().toLowerCase().email("Enter the agent's account email"),
  agencySlug: z.string().trim().max(160).optional(),
  status: z.enum(["draft", "pending", "approved"]).default("pending"),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date().optional().nullable(),
});

export type ImportListing = z.infer<typeof listingImportSchema>;

export type ImportRow = {
  index: number;
  title: string;
  slug: string;
  action: "created" | "updated" | "failed";
  error?: string;
};

export type ImportSummary = {
  total: number;
  created: number;
  updated: number;
  failed: number;
  dryRun: boolean;
  results: ImportRow[];
};

export type ImportParseResult =
  | { ok: true; listings: ImportListing[] }
  | { ok: false; issues: string[] };

function zodIssues(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

export function parseListingPayload(raw: unknown): ImportParseResult {
  if (!Array.isArray(raw)) {
    return { ok: false, issues: ["Expected a JSON array of listing objects."] };
  }
  if (raw.length > MAX_IMPORT_ENTRIES) {
    return {
      ok: false,
      issues: [`Too many listings (${raw.length}). Import at most ${MAX_IMPORT_ENTRIES} at a time.`],
    };
  }

  const parsed = z.array(listingImportSchema).safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: zodIssues(parsed.error).map((issue) => (issue.startsWith("0.") ? issue : `entry ${issue}`)),
    };
  }

  const seen = new Map<string, number>();
  for (const [index, listing] of parsed.data.entries()) {
    const slug = listing.slug ?? slugify(listing.title);
    if (!slug) return { ok: false, issues: [`entry ${index + 1}: title must produce a slug`] };
    const duplicate = seen.get(slug);
    if (duplicate != null) {
      return {
        ok: false,
        issues: [`entry ${index + 1}: duplicate slug "${slug}" (already used by entry ${duplicate + 1})`],
      };
    }
    seen.set(slug, index);
  }

  return { ok: true, listings: parsed.data };
}

function recordFor(
  input: ImportListing,
  agentId: Types.ObjectId,
  agencyId: Types.ObjectId | null
) {
  const now = new Date();
  const approvedAt = input.status === "approved" ? (input.publishedAt ?? now) : null;
  const coordinates =
    input.lat != null && input.lng != null
      ? ([input.lng, input.lat] as [number, number])
      : null;

  return {
    title: input.title,
    description: input.description,
    transactionType: input.transactionType,
    propertyType: input.propertyType,
    status: input.status,
    featured: input.featured,
    availability: "available" as const,
    price: input.price,
    currency: input.currency,
    pricePeriod: input.transactionType === "rent" ? ("per_month" as const) : input.pricePeriod,
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
    location: coordinates ? { type: "Point" as const, coordinates } : null,
    locationMissing: !coordinates,
    highlights: input.highlights,
    amenities: input.amenities,
    images: input.images.map((image) => ({
      url: image.url,
      alt: image.alt || input.title,
      publicId: image.publicId ?? null,
    })),
    videoUrl: input.videoUrl ?? null,
    floorPlans: input.floorPlans,
    agent: agentId,
    agency: agencyId,
    submittedAt: input.status === "pending" ? now : null,
    approvedAt,
    publishedAt: approvedAt,
    rejectionReason: null,
  };
}

export async function runListingImport(
  listings: ImportListing[],
  options: { dryRun?: boolean } = {}
): Promise<ImportSummary> {
  const dryRun = options.dryRun === true;
  const summary: ImportSummary = {
    total: listings.length,
    created: 0,
    updated: 0,
    failed: 0,
    dryRun,
    results: [],
  };

  await connectDB();

  for (const [index, listing] of listings.entries()) {
    const slug = listing.slug ?? slugify(listing.title);
    const title = listing.title;

    try {
      const agent = await User.findOne({ email: listing.agentEmail, role: "agent" })
        .select("_id agency")
        .lean();
      if (!agent) {
        throw new Error(`no agent account for ${listing.agentEmail} — create and verify one first`);
      }

      let agencyId = (agent.agency as Types.ObjectId | null) ?? null;
      if (listing.agencySlug) {
        const agency = await Agency.findOne({ slug: listing.agencySlug }).select("_id").lean();
        if (!agency) throw new Error(`unknown agency slug "${listing.agencySlug}"`);
        agencyId = agency._id as Types.ObjectId;
      }

      const data = recordFor(listing, agent._id as Types.ObjectId, agencyId);
      const existing = await Property.findOne({ slug }).select("_id").lean();

      if (dryRun) {
        summary[existing ? "updated" : "created"] += 1;
        summary.results.push({
          index,
          title,
          slug,
          action: existing ? "updated" : "created",
        });
        continue;
      }

      if (existing) {
        await Property.updateOne({ _id: existing._id }, { $set: data });
        summary.updated += 1;
        summary.results.push({ index, title, slug, action: "updated" });
      } else {
        await Property.create({
          ...data,
          slug,
          stats: { views: 0, favourites: 0, enquiries: 0 },
        });
        summary.created += 1;
        summary.results.push({ index, title, slug, action: "created" });
      }
    } catch (error) {
      summary.failed += 1;
      summary.results.push({
        index,
        title,
        slug: slug || "(no slug)",
        action: "failed",
        error: (error as Error).message,
      });
    }
  }

  return summary;
}
