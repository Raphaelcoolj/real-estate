import { describe, expect, it } from "vitest";
import {
  ALL_AMENITIES,
  AMENITY_GROUPS,
  CURRENCIES,
  ENQUIRY_STATUSES,
  INSPECTION_SLOTS,
  INSPECTION_STATUSES,
  NOTIFICATION_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  REPORT_REASONS,
  ROLES,
  SORT_OPTIONS,
} from "@/constants";
import { CITIES, POPULAR_DISTRICTS } from "@/constants/locations";
import { DASHBOARD_NAV } from "@/constants/navigation";

describe("districts", () => {
  it("has ten curated districts with unique slugs and images", () => {
    expect(POPULAR_DISTRICTS).toHaveLength(10);
    expect(new Set(POPULAR_DISTRICTS.map((d) => d.slug)).size).toBe(10);
    expect(new Set(POPULAR_DISTRICTS.map((d) => d.image)).size).toBe(10);
  });

  it("points every district image at the generated asset", () => {
    for (const district of POPULAR_DISTRICTS) {
      expect(district.image.startsWith("/images/locations/")).toBe(true);
    }
  });

  it("keeps coordinates in valid ranges", () => {
    for (const district of POPULAR_DISTRICTS) {
      expect(district.lat).toBeGreaterThanOrEqual(-90);
      expect(district.lat).toBeLessThanOrEqual(90);
      expect(district.lng).toBeGreaterThanOrEqual(-180);
      expect(district.lng).toBeLessThanOrEqual(180);
    }
  });

  it("derives unique cities", () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(CITIES.map((c) => c.city)).size).toBe(CITIES.length);
  });
});

describe("taxonomy", () => {
  it("keeps property type values unique", () => {
    expect(new Set(PROPERTY_TYPES.map((t) => t.value)).size).toBe(PROPERTY_TYPES.length);
  });

  it("keeps status values unique", () => {
    expect(new Set(PROPERTY_STATUSES.map((s) => s.value)).size).toBe(PROPERTY_STATUSES.length);
    expect(new Set(ENQUIRY_STATUSES.map((s) => s.value)).size).toBe(ENQUIRY_STATUSES.length);
    expect(new Set(INSPECTION_STATUSES.map((s) => s.value)).size).toBe(INSPECTION_STATUSES.length);
  });

  it("keeps amenity groups deduplicated", () => {
    expect(new Set(ALL_AMENITIES).size).toBe(ALL_AMENITIES.length);
    expect(AMENITY_GROUPS.length).toBeGreaterThan(3);
  });

  it("defines time slots and report reasons", () => {
    expect(INSPECTION_SLOTS.length).toBeGreaterThan(3);
    expect(new Set(INSPECTION_SLOTS).size).toBe(INSPECTION_SLOTS.length);
    expect(REPORT_REASONS.every((r) => r.value && r.label)).toBe(true);
  });

  it("keeps sort options and roles coherent", () => {
    expect(SORT_OPTIONS[0]?.value).toBe("relevance");
    expect(ROLES.map((r) => r.value)).toEqual(["customer", "agent", "admin"]);
    expect(Object.keys(NOTIFICATION_TYPES)).toContain("listing_approved");
  });

  it("defines currency symbols", () => {
    expect(Object.keys(CURRENCIES)).toEqual(["USD", "EUR", "GBP", "AED", "NGN"]);
  });
});

describe("dashboard navigation", () => {
  const roles = ["customer", "agent", "admin"] as const;

  it("points every item at an in-app dashboard path", () => {
    for (const role of roles) {
      const items = DASHBOARD_NAV[role];
      expect(items.length).toBeGreaterThan(3);
      for (const item of items) {
        if ("href" in item && item.href) {
          expect(item.href.startsWith("/dashboard")).toBe(true);
        }
      }
    }
  });

  it("does not duplicate destinations within a role", () => {
    for (const role of roles) {
      const hrefs = DASHBOARD_NAV[role].flatMap((item) => ("href" in item && item.href ? [item.href] : []));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });
});
