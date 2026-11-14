import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Report — user complaints about listings, users or agencies.
 * ------------------------------------------------------------------------ */

const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["property", "user", "agency"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, maxlength: 120 },
    details: { type: String, default: null, maxlength: 3000 },
    targetLabel: { type: String, default: null, maxlength: 300 },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    resolution: { type: String, default: null, maxlength: 2000 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporter: 1, targetType: 1, targetId: 1 });

export type ReportDocument = InferSchemaType<typeof ReportSchema>;

export const Report: Model<ReportDocument> =
  (models.Report as Model<ReportDocument>) ?? model("Report", ReportSchema);
