import { describe, expect, it } from "vitest";
import { propertyInputSchema } from "@/lib/validation/property";
import { enquirySchema, enquiryStatusSchema, inspectionRequestSchema, inspectionUpdateSchema, reportSchema } from "@/lib/validation/interaction";
import { changePasswordSchema, signInSchema, signUpSchema, updateProfileSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation";

const baseProperty = {
  title: "Lagoon-front villa with private jetty",
  description:
    "A rare waterfront villa with a private jetty, infinity pool and sunset terrace, set on Banana Island and finished to an exceptional standard throughout.",
  transactionType: "sale" as const,
  propertyType: "villa" as const,
  price: 1_450_000,
  currency: "USD" as const,
  bedrooms: 5,
  bathrooms: 6,
  addressLine: "12 Marina Crescent",
  city: "Lagos",
  country: "Nigeria",
  images: [{ url: "/images/properties/property-1.svg" }],
  lat: 6.4436,
  lng: 3.4346,
};

describe("propertyInputSchema", () => {
  it("accepts a complete listing and applies defaults", () => {
    const parsed = propertyInputSchema.parse(baseProperty);
    expect(parsed.status).toBe("pending");
    expect(parsed.highlights).toEqual([]);
    expect(parsed.amenities).toEqual([]);
    expect(parsed.images[0]?.alt).toBe("");
    expect(parsed.images[0]?.publicId).toBeNull();
    expect(parsed.pricePeriod).toBe("total");
  });

  it("rejects short titles and descriptions", () => {
    const result = propertyInputSchema.safeParse({ ...baseProperty, title: "Villa", description: "Too short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = toFieldErrors(result.error);
      expect(fields.title?.length).toBe(1);
      expect(fields.description?.length).toBe(1);
    }
  });

  it("requires at least one image", () => {
    const result = propertyInputSchema.safeParse({ ...baseProperty, images: [] });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported image addresses", () => {
    const result = propertyInputSchema.safeParse({
      ...baseProperty,
      images: [{ url: "javascript:alert(1)" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects amenities outside the curated list", () => {
    const result = propertyInputSchema.safeParse({ ...baseProperty, amenities: ["Helipad"] });
    expect(result.success).toBe(false);
  });

  it("accepts curated amenities", () => {
    const parsed = propertyInputSchema.parse({ ...baseProperty, amenities: ["Swimming pool", "Concierge"] });
    expect(parsed.amenities).toEqual(["Swimming pool", "Concierge"]);
  });

  it("requires both coordinates or neither", () => {
    expect(propertyInputSchema.safeParse({ ...baseProperty, lng: undefined }).success).toBe(false);
    const withoutBoth = propertyInputSchema.safeParse({ ...baseProperty, lat: undefined, lng: undefined });
    expect(withoutBoth.success).toBe(true);
  });

  it("rejects negative prices and unknown types", () => {
    expect(propertyInputSchema.safeParse({ ...baseProperty, price: -1 }).success).toBe(false);
    expect(propertyInputSchema.safeParse({ ...baseProperty, propertyType: "castle" }).success).toBe(false);
  });

  it("rejects more images than the limit", () => {
    const images = Array.from({ length: 13 }, (_, i) => ({ url: `/images/properties/property-${i + 1}.svg` }));
    expect(propertyInputSchema.safeParse({ ...baseProperty, images }).success).toBe(false);
  });

  it("validates video links", () => {
    expect(propertyInputSchema.safeParse({ ...baseProperty, videoUrl: "not-a-url" }).success).toBe(false);
    expect(propertyInputSchema.safeParse({ ...baseProperty, videoUrl: "https://vimeo.com/12345" }).success).toBe(true);
  });
});

describe("interaction schemas", () => {
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  it("validates enquiries", () => {
    expect(enquirySchema.safeParse({ propertyId: "abc", message: "Too short" }).success).toBe(false);
    expect(enquirySchema.safeParse({ propertyId: "abc", message: "Could we arrange a viewing this week?" }).success).toBe(true);
  });

  it("validates enquiry status updates", () => {
    expect(enquiryStatusSchema.safeParse({ enquiryId: "abc", status: "replied", reply: "Saturday works." }).success).toBe(true);
    expect(enquiryStatusSchema.safeParse({ enquiryId: "abc", status: "ignored" }).success).toBe(false);
  });

  it("validates inspection requests with a future date and known slot", () => {
    const valid = inspectionRequestSchema.safeParse({
      propertyId: "abc",
      preferredDate: future,
      slot: "09:00 – 10:00",
    });
    expect(valid.success).toBe(true);

    const past = inspectionRequestSchema.safeParse({
      propertyId: "abc",
      preferredDate: new Date("2020-01-01").toISOString(),
      slot: "09:00 – 10:00",
    });
    expect(past.success).toBe(false);

    const badSlot = inspectionRequestSchema.safeParse({ propertyId: "abc", preferredDate: future, slot: "midnight" });
    expect(badSlot.success).toBe(false);
  });

  it("requires alternative dates after the preferred date", () => {
    const result = inspectionRequestSchema.safeParse({
      propertyId: "abc",
      preferredDate: future,
      alternativeDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      slot: "09:00 – 10:00",
    });
    expect(result.success).toBe(false);
  });

  it("validates inspection actions", () => {
    expect(inspectionUpdateSchema.safeParse({ inspectionId: "abc", action: "confirm" }).success).toBe(true);
    expect(inspectionUpdateSchema.safeParse({ inspectionId: "abc", action: "reschedule", proposedDate: future, proposedSlot: "10:00 – 11:00" }).success).toBe(true);
    expect(inspectionUpdateSchema.safeParse({ inspectionId: "abc", action: "reschedule" }).success).toBe(false);
    expect(inspectionUpdateSchema.safeParse({ inspectionId: "abc", action: "delete" }).success).toBe(false);
  });

  it("validates reports", () => {
    expect(reportSchema.safeParse({ targetType: "property", targetId: "abc", reason: "scam", details: "Asked for a deposit upfront." }).success).toBe(true);
    expect(reportSchema.safeParse({ targetType: "listing", targetId: "abc", reason: "scam" }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  const validSignUp = {
    name: "Ava Sterling",
    email: "  Ava@Sterling.Example ",
    password: "Arcadia2026",
    role: "agent" as const,
    terms: true as const,
  };

  it("normalises sign-up email addresses", () => {
    const parsed = signUpSchema.parse(validSignUp);
    expect(parsed.email).toBe("ava@sterling.example");
  });

  it("requires terms and a strong password", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, terms: false }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, password: "password" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, password: "short1" }).success).toBe(false);
  });

  it("validates sign-in credentials", () => {
    expect(signInSchema.safeParse({ email: "ava@sterling.example", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("validates profile websites", () => {
    expect(updateProfileSchema.safeParse({ name: "Ava Sterling", website: "sterling.example" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ name: "Ava Sterling", website: "https://sterling.example" }).success).toBe(true);
  });

  it("requires matching passwords", () => {
    const base = { currentPassword: "OldPassword1", newPassword: "NewPassword1", confirmPassword: "NewPassword1" };
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...base, confirmPassword: "Different1" }).success).toBe(false);
  });
});
