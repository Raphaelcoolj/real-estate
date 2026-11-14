import { describe, expect, it } from "vitest";
import { filtersToParams, parseSearchFilters } from "@/lib/search-params";

describe("parseSearchFilters", () => {
  it("returns safe defaults for empty input", () => {
    const filters = parseSearchFilters({});
    expect(filters.sort).toBe("relevance");
    expect(filters.view).toBe("grid");
    expect(filters.availability).toBe("all");
    expect(filters.propertyType).toEqual([]);
    expect(filters.amenities).toEqual([]);
    expect(filters.page).toBe(1);
  });

  it("normalises a full query string", () => {
    const filters = parseSearchFilters({
      q: "  lagoon villa ",
      transaction: "rent",
      propertyType: "villa,penthouse,spaceship",
      city: "Lagos",
      minPrice: "1000000",
      maxPrice: "9000000",
      bedrooms: "4",
      bathrooms: "3",
      amenities: "Swimming pool,Gym,NotAnAmenity",
      availability: "under_offer",
      sort: "price_asc",
      page: "3",
      view: "map",
    });

    expect(filters.q).toBe("lagoon villa");
    expect(filters.transaction).toBe("rent");
    expect(filters.propertyType).toEqual(["villa", "penthouse"]);
    expect(filters.city).toBe("Lagos");
    expect(filters.minPrice).toBe(1_000_000);
    expect(filters.maxPrice).toBe(9_000_000);
    expect(filters.bedrooms).toBe(4);
    expect(filters.amenities).toContain("Swimming pool");
    expect(filters.amenities).not.toContain("NotAnAmenity");
    expect(filters.availability).toBe("under_offer");
    expect(filters.sort).toBe("price_asc");
    expect(filters.page).toBe(3);
    expect(filters.view).toBe("map");
  });

  it("ignores unknown sorts and coerces bad pages", () => {
    const filters = parseSearchFilters({ sort: "most_expensive", page: "-4" });
    expect(filters.sort).toBe("relevance");
    expect(filters.page).toBe(1);
  });

  it("ignores invalid transactions and availability", () => {
    const filters = parseSearchFilters({ transaction: "lease", availability: "sold" });
    expect(filters.transaction).toBeUndefined();
    expect(filters.availability).toBe("all");
  });
});

describe("filtersToParams", () => {
  it("round-trips a filter set through the URL", () => {
    const filters = parseSearchFilters({
      q: "penthouse",
      transaction: "sale",
      propertyType: "apartment,penthouse",
      minPrice: "500000",
      amenities: "Swimming pool",
      sort: "newest",
      view: "map",
    });

    const params = filtersToParams(filters);
    expect(params).toMatchObject({
      q: "penthouse",
      transaction: "sale",
      propertyType: "apartment,penthouse",
      minPrice: "500000",
      amenities: "Swimming pool",
      sort: "newest",
      view: "map",
    });

    const reparsed = parseSearchFilters(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>);
    expect(reparsed.q).toBe("penthouse");
    expect(reparsed.propertyType).toEqual(["apartment", "penthouse"]);
    expect(reparsed.sort).toBe("newest");
    expect(reparsed.view).toBe("map");
  });

  it("omits defaults", () => {
    const params = filtersToParams(parseSearchFilters({}));
    expect(params.sort).toBeUndefined();
    expect(params.view).toBeUndefined();
    expect(params.availability).toBeUndefined();
  });
});
