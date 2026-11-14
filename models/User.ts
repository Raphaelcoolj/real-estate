import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/* ---------------------------------------------------------------------------
 * User — customers, agents and administrators.
 * `passwordHash` is excluded from queries by default (select: false).
 * ------------------------------------------------------------------------ */

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      default: "customer",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    avatarUrl: { type: String, default: null },
    phone: { type: String, default: null, maxlength: 40 },
    bio: { type: String, default: null, maxlength: 2000 },
    website: { type: String, default: null, maxlength: 300 },

    /* Agent/agency profile */
    /* Sparse unique: customers/admins have no slug and the field is omitted. */
    slug: { type: String, default: undefined, unique: true, sparse: true },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    agency: { type: Schema.Types.ObjectId, ref: "Agency", default: null, index: true },
    licenseNumber: { type: String, default: null, maxlength: 80 },
    specializations: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    yearsExperience: { type: Number, default: null, min: 0, max: 80 },
    serviceAreas: { type: [String], default: [] },

    profileComplete: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    suspendedReason: { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

UserSchema.index({ role: 1, status: 1, verificationStatus: 1 });
UserSchema.index({ name: "text", email: "text" });

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ?? model("User", UserSchema);
