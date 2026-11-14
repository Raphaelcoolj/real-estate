import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Favourite — a user's saved property (unique per user + property).
 * ------------------------------------------------------------------------ */

const FavouriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  },
  { timestamps: true }
);

FavouriteSchema.index({ user: 1, property: 1 }, { unique: true });
FavouriteSchema.index({ property: 1, createdAt: -1 });

export type FavouriteDocument = InferSchemaType<typeof FavouriteSchema>;

export const Favourite: Model<FavouriteDocument> =
  (models.Favourite as Model<FavouriteDocument>) ?? model("Favourite", FavouriteSchema);
