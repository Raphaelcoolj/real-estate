/* ---------------------------------------------------------------------------
 * import-listings — load authentic listing data from data/listings.json.
 *
 *   npm run import                    # validate + upsert data/listings.json
 *   npm run import -- ./path/to.json  # use another file
 *   npm run import -- --dry-run       # validate and report, no writes
 *
 * Listings are matched by slug, so re-running updates the same records.
 * New records enter moderation as "pending" unless the entry sets
 * "status": "approved". Real media can be remote URLs or /uploads/* paths.
 * ------------------------------------------------------------------------ */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { z } from "zod";
import { Property } from "../models/Property";
import { User } from "../models/User";
import { Agency } from "../models/Agency";
import { propertyInputBaseSchema } from "../lib/validation/property";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/arcadia";

const listingImportSchema = propertyInputBaseSchema.extend({
  slug: z.string().trim().min(1).max(220).optional(),
  agentEmail: z.string().trim().toLowerCase().email("Enter the agent's account email"),
  agencySlug: z.string().trim().max(160).optional(),
  status: z.enum(["draft", "pending", "approved"]).default("pending"),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date().optional().nullable(),
});

const fileSchema = z.array(listingImportSchema);

type ImportListing = z.infer<typeof listingImportSchema>;

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

function issues(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const file = argv.find((arg) => !arg.startsWith("--")) ?? "data/listings.json";
  return { file, dryRun: flags.has("--dry-run") };
}

function recordFor(input: ImportListing, agentId: mongoose.Types.ObjectId, agencyId: mongoose.Types.ObjectId | null) {
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

async function main() {
  const { file, dryRun } = parseArgs(process.argv.slice(2));
  const absolute = path.resolve(process.cwd(), file);

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(absolute, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${file}: ${(error as Error).message}`);
  }

  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`\n${file} is not valid:\n`);
    for (const line of issues(parsed.error)) console.error(`  • ${line}`);
    process.exitCode = 1;
    return;
  }

  const listings = parsed.data;
  if (listings.length === 0) {
    console.log(`\n${file} contains no listings — nothing to import.\n`);
    return;
  }

  const seen = new Set<string>();
  for (const [index, listing] of listings.entries()) {
    const slug = listing.slug ?? slugify(listing.title);
    if (seen.has(slug)) {
      console.error(`\nDuplicate slug "${slug}" at entry ${index + 1} (${listing.title}).`);
      process.exitCode = 1;
      return;
    }
    seen.add(slug);
  }

  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [index, listing] of listings.entries()) {
    const label = `${index + 1}. ${listing.title}`;
    try {
      const agent = await User.findOne({ email: listing.agentEmail, role: "agent" })
        .select("_id agency")
        .lean();
      if (!agent) {
        throw new Error(
          `no agent account for ${listing.agentEmail} — create and verify an agent first`
        );
      }

      let agencyId = (agent.agency as mongoose.Types.ObjectId | null) ?? null;
      if (listing.agencySlug) {
        const agency = await Agency.findOne({ slug: listing.agencySlug }).select("_id").lean();
        if (!agency) throw new Error(`unknown agency slug "${listing.agencySlug}"`);
        agencyId = agency._id as mongoose.Types.ObjectId;
      }

      const slug = listing.slug ?? slugify(listing.title);
      const data = recordFor(listing, agent._id as mongoose.Types.ObjectId, agencyId);
      const existing = await Property.findOne({ slug }).select("_id").lean();

      if (dryRun) {
        console.log(`  ${existing ? "update" : "create"}  ${label}  →  /properties/${slug}`);
      } else if (existing) {
        await Property.updateOne({ _id: existing._id }, { $set: data });
        updated += 1;
        console.log(`  updated  ${label}  →  /properties/${slug}`);
      } else {
        await Property.create({
          ...data,
          slug,
          stats: { views: 0, favourites: 0, enquiries: 0 },
        });
        created += 1;
        console.log(`  created  ${label}  →  /properties/${slug}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`  failed   ${label}: ${(error as Error).message}`);
    }
  }

  console.log(
    dryRun
      ? `\nDry run complete — ${listings.length} listing(s) valid, nothing written.\n`
      : `\nImported ${listings.length} listing(s): ${created} created, ${updated} updated, ${failed} failed.\n`
  );
  if (failed > 0) process.exitCode = 1;
}

main()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error(`\nImport failed: ${(error as Error).message}\n`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
