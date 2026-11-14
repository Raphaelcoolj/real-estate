import { describe, expect, it } from "vitest";
import {
  buildSearchHref,
  cn,
  formatArea,
  formatMarkerPrice,
  formatPrice,
  formatPricePeriod,
  initials,
  paginationRange,
  parseList,
  parseNumber,
  parseOne,
  slugify,
  truncate,
} from "@/lib/utils";

describe("cn", () => {
  it("joins strings, arrays and condition maps", () => {
    expect(cn("a", ["b", false, null], { c: true, d: false }, 0)).toBe("a b c 0");
  });

  it("ignores empty values", () => {
    expect(cn(null, undefined, "", false)).toBe("");
  });
});

describe("formatPrice", () => {
  it("formats full USD amounts with a symbol", () => {
    expect(formatPrice(1_250_000)).toBe("$1,250,000");
  });

  it("compacts large amounts", () => {
    expect(formatPrice(1_250_000, "USD", { compact: true })).toBe("$1.3M");
    expect(formatPrice(980_000, "GBP", { compact: true })).toBe("£980K");
    expect(formatPrice(1_500_000_000, "USD", { compact: true })).toBe("$1.5B");
  });

  it("preserves symbol spacing for AED and NGN", () => {
    expect(formatPrice(28_500_000, "AED", { compact: true })).toBe("AED 28.5M");
    expect(formatPrice(42_000_000, "NGN", { compact: true })).toBe("₦ 42M");
  });

  it("omits the symbol when asked", () => {
    expect(formatPrice(4200, "USD", { withSymbol: false })).toBe("4,200");
  });

  it("formats price periods", () => {
    expect(formatPricePeriod(18_500, "GBP", "per_month")).toBe("£18,500/mo");
    expect(formatPricePeriod(18_500, "GBP", "total")).toBe("£18,500");
  });
});

describe("formatMarkerPrice", () => {
  it("compacts for map pins", () => {
    expect(formatMarkerPrice(1_450_000_000, "NGN")).toBe("₦1.5B");
    expect(formatMarkerPrice(28_500_000, "AED")).toBe("AED 29M");
    expect(formatMarkerPrice(650, "USD")).toBe("$650");
  });
});

describe("formatArea", () => {
  it("formats square metres and handles missing values", () => {
    expect(formatArea(820)).toBe("820 m²");
    expect(formatArea(0)).toBe("0 m²");
    expect(formatArea(null)).toBe("—");
  });
});

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("Sterling & Co.")).toBe("sterling-and-co");
    expect(slugify("  Île Saint-Louis  ")).toBe("ile-saint-louis");
    expect(slugify("Palm Jumeirah — Signature Villa")).toBe("palm-jumeirah-signature-villa");
  });

  it("caps the slug length", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(90);
  });
});

describe("initials", () => {
  it("takes the first two name parts", () => {
    expect(initials("Ava Sterling")).toBe("AS");
    expect(initials("Noor Al-Farsi")).toBe("NA");
    expect(initials("Marion")).toBe("M");
  });
});

describe("truncate", () => {
  it("leaves short strings alone and ellipsises long ones", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a long sentence here", 10)).toBe("a long se…");
  });
});

describe("paginationRange", () => {
  it("lists every page when there are seven or fewer", () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipses around a middle page", () => {
    expect(paginationRange(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });

  it("keeps first and last pages", () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, "…", 20]);
    expect(paginationRange(20, 20)).toEqual([1, "…", 19, 20]);
  });
});

describe("parse helpers", () => {
  it("parses comma lists", () => {
    expect(parseList("a, b ,,c")).toEqual(["a", "b", "c"]);
    expect(parseList(["a", "b"])).toEqual(["a", "b"]);
    expect(parseList(undefined)).toEqual([]);
  });

  it("parses numbers safely", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber(["7"])).toBe(7);
    expect(parseNumber("abc")).toBeUndefined();
    expect(parseNumber("")).toBeUndefined();
  });

  it("parses single values from arrays", () => {
    expect(parseOne(["rent", "sale"])).toBe("rent");
    expect(parseOne("")).toBeUndefined();
  });
});

describe("buildSearchHref", () => {
  it("drops empty and all-values and joins arrays", () => {
    expect(
      buildSearchHref({
        q: "villa",
        transaction: "sale",
        propertyType: ["villa", "penthouse"],
        sort: "all",
        city: undefined,
      })
    ).toBe("/properties?q=villa&transaction=sale&propertyType=villa%2Cpenthouse");
  });

  it("returns the base path when nothing is set", () => {
    expect(buildSearchHref({})).toBe("/properties");
    expect(buildSearchHref({}, "/dashboard/saved")).toBe("/dashboard/saved");
  });
});
