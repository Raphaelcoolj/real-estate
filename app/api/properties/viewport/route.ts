/* ---------------------------------------------------------------------------
 * GET /api/properties/viewport?minLng=&minLat=&maxLng=&maxLat=&…
 * Returns the properties inside the map's current bounding box, applying the
 * same filter semantics as the search page. Powers map ↔ list synchronisation.
 * ------------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { searchPropertiesInBounds } from "@/lib/services/property.service";
import { searchFiltersSchema } from "@/lib/validation/property";
import { errorMessage } from "@/lib/errors";
import { parseList, parseNumber, parseOne } from "@/lib/utils";

export const runtime = "nodejs";

function boundsFrom(url: URL) {
  const minLng = parseNumber(url.searchParams.get("minLng"));
  const minLat = parseNumber(url.searchParams.get("minLat"));
  const maxLng = parseNumber(url.searchParams.get("maxLng"));
  const maxLat = parseNumber(url.searchParams.get("maxLat"));
  if (
    minLng == null ||
    minLat == null ||
    maxLng == null ||
    maxLat == null ||
    minLng > maxLng ||
    minLat > maxLat
  ) {
    return null;
  }
  return { minLng, minLat, maxLng, maxLat };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const bounds = boundsFrom(url);
    if (!bounds) {
      return NextResponse.json({ ok: false, error: "Invalid map bounds." }, { status: 400 });
    }

    const sp = url.searchParams;
    const parsed = searchFiltersSchema.safeParse({
      q: parseOne(sp.get("q")),
      transaction: parseOne(sp.get("transaction")),
      propertyType: parseList(sp.get("propertyType")),
      city: parseOne(sp.get("city")),
      district: parseOne(sp.get("district")),
      minPrice: parseNumber(sp.get("minPrice")),
      maxPrice: parseNumber(sp.get("maxPrice")),
      bedrooms: parseNumber(sp.get("bedrooms")),
      bathrooms: parseNumber(sp.get("bathrooms")),
      amenities: parseList(sp.get("amenities")),
      availability: parseOne(sp.get("availability")) ?? "all",
      sort: parseOne(sp.get("sort")) ?? "relevance",
      page: 1,
      view: "map",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid filters." },
        { status: 400 }
      );
    }

    const items = await searchPropertiesInBounds(bounds, parsed.data);
    return NextResponse.json({ ok: true, data: { items, truncated: items.length >= 60 } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 500 });
  }
}
