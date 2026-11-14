/* ---------------------------------------------------------------------------
 * GET /api/geocode?q=&lng=&lat= — server-side Mapbox geocoding proxy.
 * Keeps the server token private; returns a compact place list.
 * ------------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { hasMapboxConfig, searchPlaces } from "@/lib/mapbox";
import { errorMessage } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const lng = Number(url.searchParams.get("lng"));
    const lat = Number(url.searchParams.get("lat"));

    if (q.length < 2) {
      return NextResponse.json({ ok: true, data: { places: [], configured: hasMapboxConfig() } });
    }
    if (!hasMapboxConfig()) {
      return NextResponse.json({
        ok: true,
        data: { places: [], configured: false },
      });
    }

    const proximity: [number, number] | undefined =
      Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : undefined;

    const places = await searchPlaces(q, { proximity, limit: 6 });
    return NextResponse.json({ ok: true, data: { places, configured: true } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 500 });
  }
}
