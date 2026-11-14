import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Enquiry — a customer's message about a listing, owned by the listing agent.
 * ------------------------------------------------------------------------ */

const EnquirySchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    phone: { type: String, default: null, maxlength: 40 },
    status: {
      type: String,
      enum: ["new", "read", "replied", "closed"],
      default: "new",
      index: true,
    },
    reply: { type: String, default: null, maxlength: 3000 },
    repliedAt: { type: Date, default: null },
    /* Optional context when enquiring from a specific section */
    source: { type: String, enum: ["detail", "search", "agent"], default: "detail" },
  },
  { timestamps: true }
);

EnquirySchema.index({ agent: 1, status: 1, createdAt: -1 });
EnquirySchema.index({ customer: 1, createdAt: -1 });
EnquirySchema.index({ property: 1, customer: 1, createdAt: -1 });

export type EnquiryDocument = InferSchemaType<typeof EnquirySchema>;

export const Enquiry: Model<EnquiryDocument> =
  (models.Enquiry as Model<EnquiryDocument>) ?? model("Enquiry", EnquirySchema);
