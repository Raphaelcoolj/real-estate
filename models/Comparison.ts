import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Comparison — one active comparison set per user (max 4 properties).
 * ------------------------------------------------------------------------ */

const ComparisonSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    properties: {
      type: [{ type: Schema.Types.ObjectId, ref: "Property" }],
      default: [],
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length <= 4,
        message: "A comparison can contain at most 4 properties.",
      },
    },
  },
  { timestamps: true }
);

export type ComparisonDocument = InferSchemaType<typeof ComparisonSchema>;

export const Comparison: Model<ComparisonDocument> =
  (models.Comparison as Model<ComparisonDocument>) ?? model("Comparison", ComparisonSchema);
