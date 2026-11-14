import { z } from "zod";
import {
  ALL_AMENITIES,
  MAX_FLOOR_PLANS,
  MAX_IMAGES_PER_LISTING,
  PROPERTY_TYPES,
  SORT_OPTIONS,
} from "@/constants";

type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];
const typeValues = PROPERTY_TYPES.map((t) => t.value) as [PropertyTypeValue, ...PropertyTypeValue[]];
const sortValues = SORT_OPTIONS.map((s) => s.value) as [SortValue, ...SortValue[]];

/** Media URLs must be local uploads, seeded art, or Cloudinary assets. */
const mediaUrl = z
  .string()
  .trim()
  .min(1)
  .max(600)
  .refine(
    (v) =>
      v.startsWith("/uploads/") ||
      v.startsWith("/images/") ||
      v.startsWith("https://res.cloudinary.com/") ||
      v.startsWith("https://"),
    "Unsupported image address"
  );

export const imageItemSchema = z.object({
  url: mediaUrl,
  alt: z.string().trim().max(160).optional().default(""),
  publicId: z.string().trim().max(200).optional().nullable().default(null),
});

export const floorPlanSchema = z.object({
  url: mediaUrl,
  label: z.string().trim().max(80).default("Floor plan"),
});

export const propertyInputBaseSchema = z.object({
    title: z.string().trim().min(8, "Title must be at least 8 characters").max(180),
    description: z
      .string()
      .trim()
      .min(40, "Describe the property in at least 40 characters")
      .max(12000),
    transactionType: z.enum(["sale", "rent"]),
    propertyType: z.enum(typeValues),
    price: z.coerce.number().min(0, "Price cannot be negative").max(1_000_000_000),
    currency: z.enum(["USD", "EUR", "GBP", "AED", "NGN"]).default("USD"),
    pricePeriod: z.enum(["total", "per_month"]).default("total"),
    priceOnApplication: z.coerce.boolean().default(false),

    bedrooms: z.coerce.number().int().min(0).max(60).default(0),
    bathrooms: z.coerce.number().int().min(0).max(60).default(0),
    areaSqm: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
    lotSqm: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
    yearBuilt: z.coerce.number().int().min(1800).max(2100).nullable().optional(),
    floors: z.coerce.number().int().min(0).max(200).nullable().optional(),
    parking: z.coerce.number().int().min(0).max(60).nullable().optional(),
    furnishing: z
      .enum(["furnished", "semi_furnished", "unfurnished"])
      .nullable()
      .optional(),
    orientation: z.string().trim().max(60).optional().nullable(),
    heating: z.string().trim().max(60).optional().nullable(),
    cooling: z.string().trim().max(60).optional().nullable(),
    tenure: z.string().trim().max(60).optional().nullable(),
    epc: z.string().trim().max(10).optional().nullable(),

    addressLine: z.string().trim().min(4, "Enter the street address").max(300),
    neighbourhood: z.string().trim().max(120).optional().nullable(),
    city: z.string().trim().min(2, "Enter the city").max(120),
    state: z.string().trim().max(120).optional().nullable(),
    postalCode: z.string().trim().max(40).optional().nullable(),
    country: z.string().trim().min(2, "Enter the country").max(80),

    lat: z.coerce.number().min(-90).max(90).nullable().optional(),
    lng: z.coerce.number().min(-180).max(180).nullable().optional(),

    highlights: z
      .array(z.string().trim().min(3).max(90))
      .max(6, "Up to 6 highlights")
      .default([]),
    amenities: z
      .array(z.string().trim().min(2).max(60))
      .max(30, "Up to 30 amenities")
      .default([])
      .refine(
        (items) => items.every((i) => ALL_AMENITIES.includes(i as never)),
        "Choose amenities from the provided list"
      ),
    images: z
      .array(imageItemSchema)
      .min(1, "Add at least one image")
      .max(MAX_IMAGES_PER_LISTING),
    videoUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .nullable()
      .refine((v) => !v || /^https?:\/\//i.test(v), "Video URL must be a valid link")
      .refine(
        (v) =>
          !v ||
          /youtube\.com|youtu\.be|vimeo\.com|\.mp4/i.test(v),
        "Supported: YouTube, Vimeo or .mp4 links"
      ),
    floorPlans: z.array(floorPlanSchema).max(MAX_FLOOR_PLANS).default([]),

    status: z.enum(["draft", "pending"]).default("pending"),
  });

export const propertyInputSchema = propertyInputBaseSchema.refine(
  (data) => !(data.lat && !data.lng) && !(data.lng && !data.lat),
  {
    message: "Provide both latitude and longitude, or neither",
    path: ["lat"],
  }
);

export type PropertyInput = z.infer<typeof propertyInputSchema>;

/** Admin creation on behalf of an agent: any publish state plus an owner. */
export const adminListingInputSchema = propertyInputBaseSchema
  .extend({
    status: z.enum(["draft", "pending", "approved"]).default("pending"),
    agentId: z.string().trim().min(1, "Choose the agent who owns this listing"),
  })
  .refine((data) => !(data.lat && !data.lng) && !(data.lng && !data.lat), {
    message: "Provide both latitude and longitude, or neither",
    path: ["lat"],
  });

export type AdminListingInput = z.infer<typeof adminListingInputSchema>;

export const moderationSchema = z.object({
  propertyId: z.string().min(1),
  action: z.enum(["approve", "reject", "feature", "unfeature", "archive", "restore"]),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ModerationInput = z.infer<typeof moderationSchema>;

/* ---------------------------- Search filters ---------------------------- */

export const searchFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  transaction: z.enum(["sale", "rent"]).optional(),
  propertyType: z.array(z.enum(typeValues)).default([]),
  city: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).max(1_000_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000_000).optional(),
  bedrooms: z.coerce.number().int().min(0).max(60).optional(),
  bathrooms: z.coerce.number().int().min(0).max(60).optional(),
  amenities: z.array(z.string().max(60)).default([]),
  availability: z.enum(["all", "available", "under_offer"]).default("all"),
  sort: z.enum(sortValues).default("relevance"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  view: z.enum(["grid", "map"]).default("grid"),
});

export type ParsedFilters = z.infer<typeof searchFiltersSchema>;
