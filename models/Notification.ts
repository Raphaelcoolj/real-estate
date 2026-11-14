import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * Notification — in-app notifications delivered to a user's dashboard.
 * ------------------------------------------------------------------------ */

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "enquiry",
        "enquiry_reply",
        "inspection",
        "inspection_update",
        "listing_approved",
        "listing_rejected",
        "listing_sold",
        "verification",
        "system",
      ],
      default: "system",
    },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, required: true, maxlength: 500 },
    href: { type: String, default: null, maxlength: 300 },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;

export const Notification: Model<NotificationDocument> =
  (models.Notification as Model<NotificationDocument>) ??
  model("Notification", NotificationSchema);
