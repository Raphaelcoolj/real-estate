import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Agency — brokerage/office profile that owns agents and listings.
 * ------------------------------------------------------------------------ */

const AgencySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true, maxlength: 160 },
    logoUrl: { type: String, default: null },
    coverImage: { type: String, default: null },
    description: { type: String, default: null, maxlength: 4000 },
    website: { type: String, default: null, maxlength: 300 },
    email: { type: String, default: null, maxlength: 200, lowercase: true },
    phone: { type: String, default: null, maxlength: 40 },
    country: { type: String, default: null, maxlength: 80 },
    city: { type: String, default: null, maxlength: 120 },
    address: { type: String, default: null, maxlength: 300 },
    verified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date, default: null },
    foundedYear: { type: Number, default: null },
    licenseNumber: { type: String, default: null, maxlength: 80 },
  },
  { timestamps: true }
);

AgencySchema.index({ name: "text", description: "text", city: "text" });

export type AgencyDocument = InferSchemaType<typeof AgencySchema>;

export const Agency: Model<AgencyDocument> =
  (models.Agency as Model<AgencyDocument>) ?? model("Agency", AgencySchema);
