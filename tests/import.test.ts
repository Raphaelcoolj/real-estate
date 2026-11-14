import { describe, expect, it } from "vitest";
import { parseListingPayload } from "@/lib/listings-import";
import { syntheticListings } from "@/lib/synthetic-listings";

const agents = [
  { name: "Ava Sterling", email: "ava@sterling.example" },
  { name: "Tunde Bakare", email: "tunde@atlantic.example" },
];

const sample = () => syntheticListings(1, agents, "pending")[0];

describe("synthetic listing generator", () => {
  it("generates entries that pass import validation", () => {
    const parsed = parseListingPayload(syntheticListings(24, agents, "approved"));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.listings).toHaveLength(24);
    expect(new Set(parsed.listings.map((listing) => listing.slug)).size).toBe(24);
    expect(parsed.listings.every((listing) => listing.status === "approved")).toBe(true);
    expect(new Set(parsed.listings.map((listing) => listing.agentEmail)).size).toBe(2);
  });

  it("spreads listings across multiple districts", () => {
    const listings = syntheticListings(12, agents, "pending");
    expect(new Set(listings.map((listing) => listing.city)).size).toBeGreaterThan(1);
  });
});

describe("parseListingPayload", () => {
  it("accepts a single valid listing", () => {
    expect(parseListingPayload([sample()]).ok).toBe(true);
  });

  it("rejects non-array payloads", () => {
    const parsed = parseListingPayload({ listings: [] });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues[0]).toMatch(/JSON array/);
  });

  it("rejects more than 500 entries", () => {
    const parsed = parseListingPayload(Array.from({ length: 501 }, sample));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues[0]).toMatch(/at most 500/);
  });

  it("rejects duplicate slugs", () => {
    const listing = sample();
    const parsed = parseListingPayload([listing, { ...listing }]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues[0]).toMatch(/duplicate slug/);
  });

  it("rejects amenities outside the taxonomy", () => {
    const parsed = parseListingPayload([{ ...sample(), amenities: ["Helipad"] }]);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.issues[0]).toMatch(/provided list/);
  });

  it("rejects listings with no agent email", () => {
    const { agentEmail: _omit, ...rest } = sample();
    void _omit;
    const parsed = parseListingPayload([rest]);
    expect(parsed.ok).toBe(false);
  });
});
