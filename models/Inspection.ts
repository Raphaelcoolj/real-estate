import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Inspection — a viewing appointment requested by a customer and managed by
 * the listing agent (confirm / decline / reschedule).
 * ------------------------------------------------------------------------ */

const InspectionSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    preferredDate: { type: Date, required: true, index: true },
    alternativeDate: { type: Date, default: null },
    slot: { type: String, required: true, maxlength: 40 },
    message: { type: String, default: null, maxlength: 2000 },
    status: {
      type: String,
      enum: ["requested", "confirmed", "declined", "rescheduled", "completed", "cancelled"],
      default: "requested",
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    responseNote: { type: String, default: null, maxlength: 2000 },
    /* Set when the agent proposes a new time */
    proposedDate: { type: Date, default: null },
    proposedSlot: { type: String, default: null, maxlength: 40 },
  },
  { timestamps: true }
);

InspectionSchema.index({ agent: 1, status: 1, preferredDate: 1 });
InspectionSchema.index({ customer: 1, status: 1, preferredDate: 1 });

export type InspectionDocument = InferSchemaType<typeof InspectionSchema>;

export const Inspection: Model<InspectionDocument> =
  (models.Inspection as Model<InspectionDocument>) ?? model("Inspection", InspectionSchema);
