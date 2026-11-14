import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * RecentlyViewed — per-user view history (capped in the service layer).
 * ------------------------------------------------------------------------ */

const RecentlyViewedSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

RecentlyViewedSchema.index({ user: 1, property: 1 }, { unique: true });
RecentlyViewedSchema.index({ user: 1, viewedAt: -1 });

export type RecentlyViewedDocument = InferSchemaType<typeof RecentlyViewedSchema>;

export const RecentlyViewed: Model<RecentlyViewedDocument> =
  (models.RecentlyViewed as Model<RecentlyViewedDocument>) ??
  model("RecentlyViewed", RecentlyViewedSchema);
