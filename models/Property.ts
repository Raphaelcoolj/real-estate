import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Property — the core marketplace record.
 * `location` is a GeoJSON Point ([lng, lat]) with a 2dsphere index for
 * viewport and proximity queries.
 * ------------------------------------------------------------------------ */

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const FloorPlanSchema = new Schema(
  {
    url: { type: String, required: true },
    label: { type: String, default: "Floor plan" },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const PropertySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, maxlength: 220 },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, maxlength: 12000 },

    transactionType: { type: String, enum: ["sale", "rent"], required: true, index: true },
    propertyType: {
      type: String,
      enum: [
        "apartment",
        "villa",
        "house",
        "penthouse",
        "townhouse",
        "duplex",
        "land",
        "commercial",
        "chalet",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "sold", "rented", "archived"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    availability: { type: String, enum: ["available", "under_offer"], default: "available" },

    price: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, enum: ["USD", "EUR", "GBP", "AED", "NGN"], default: "USD" },
    pricePeriod: { type: String, enum: ["total", "per_month"], default: "total" },
    priceOnApplication: { type: Boolean, default: false },

    bedrooms: { type: Number, default: 0, min: 0, max: 60 },
    bathrooms: { type: Number, default: 0, min: 0, max: 60 },
    areaSqm: { type: Number, default: null, min: 0 },
    lotSqm: { type: Number, default: null, min: 0 },
    yearBuilt: { type: Number, default: null, min: 1800, max: 2100 },
    floors: { type: Number, default: null, min: 0, max: 200 },
    parking: { type: Number, default: null, min: 0, max: 60 },
    furnishing: {
      type: String,
      enum: ["furnished", "semi_furnished", "unfurnished"],
      default: null,
    },
    orientation: { type: String, default: null, maxlength: 60 },
    heating: { type: String, default: null, maxlength: 60 },
    cooling: { type: String, default: null, maxlength: 60 },
    tenure: { type: String, default: null, maxlength: 60 },
    epc: { type: String, default: null, maxlength: 10 },

    address: {
      line: { type: String, required: true, maxlength: 300 },
      neighbourhood: { type: String, default: null, maxlength: 120 },
      city: { type: String, required: true, maxlength: 120 },
      state: { type: String, default: null, maxlength: 120 },
      postalCode: { type: String, default: null, maxlength: 40 },
      country: { type: String, required: true, maxlength: 80 },
    },

    /* GeoJSON Point — [longitude, latitude] */
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: null },
    },
    locationMissing: { type: Boolean, default: false },

    highlights: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    images: { type: [ImageSchema], default: [] },
    videoUrl: { type: String, default: null, maxlength: 500 },
    floorPlans: { type: [FloorPlanSchema], default: [] },

    agent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agency: { type: Schema.Types.ObjectId, ref: "Agency", default: null, index: true },

    stats: {
      views: { type: Number, default: 0 },
      favourites: { type: Number, default: 0 },
      enquiries: { type: Number, default: 0 },
    },
    /* Rolling daily view counters (ISO date → count), pruned by the service. */
    viewLog: { type: Map, of: Number, default: {} },

    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null, index: true },
    rejectionReason: { type: String, default: null, maxlength: 1000 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    searchKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

/* --- Indexes ------------------------------------------------------------ */
PropertySchema.index({ location: "2dsphere" }, { name: "location_2dsphere" });
PropertySchema.index({ status: 1, featured: -1, publishedAt: -1 });
PropertySchema.index({ status: 1, transactionType: 1, price: 1 });
PropertySchema.index({ status: 1, propertyType: 1, createdAt: -1 });
PropertySchema.index({ agent: 1, status: 1, createdAt: -1 });
PropertySchema.index({ agency: 1, status: 1 });
PropertySchema.index(
  { title: "text", description: "text", "address.city": "text", "address.neighbourhood": "text" },
  { name: "property_text", weights: { title: 10, "address.neighbourhood": 6, "address.city": 4, description: 1 } }
);

export type PropertyDocument = InferSchemaType<typeof PropertySchema>;

export const Property: Model<PropertyDocument> =
  (models.Property as Model<PropertyDocument>) ?? model("Property", PropertySchema);
