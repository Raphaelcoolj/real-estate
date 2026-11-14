/* ---------------------------------------------------------------------------
 * Mapbox integration — server-side geocoding helpers.
 * The access token never leaves the server here; browser-side map rendering
 * uses NEXT_PUBLIC_MAPBOX_TOKEN (a public token by design).
 * ------------------------------------------------------------------------ */

import "server-only";

const GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export function hasMapboxConfig(): boolean {
  return Boolean(process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
}

function mapboxToken(): string | null {
  return process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || null;
}

export type GeocodeResult = {
  label: string;
  lng: number;
  lat: number;
  placeName: string;
  city?: string;
  neighbourhood?: string;
  country?: string;
};

/**
 * Geocode a free-form address into [lng, lat].
 * Called when a listing is created or updated — never on page requests.
 */
export async function geocodeAddress(
  query: string,
  options: { proximity?: [number, number]; limit?: number } = {}
): Promise<GeocodeResult | null> {
  const token = mapboxToken();
  if (!token || !query.trim()) return null;

  const params = new URLSearchParams({
    access_token: token,
    limit: String(options.limit ?? 1),
    types: "address,place,poi,neighborhood",
    language: "en",
  });
  if (options.proximity) params.set("proximity", options.proximity.join(","));

  try {
    const res = await fetch(`${GEOCODE_URL}/${encodeURIComponent(query)}.json?${params}`, {
      headers: { accept: "application/json" },
      // Geocoding an address rarely changes — cache for a day.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        place_name: string;
        text: string;
        center: [number, number];
        context?: Array<{ id: string; text: string }>;
      }>;
    };
    const feature = data.features?.[0];
    if (!feature) return null;

    const context = feature.context ?? [];
    const city = context.find((c) => c.id.startsWith("place."))?.text;
    const neighbourhood = context.find((c) => c.id.startsWith("neighborhood."))?.text;
    const country = context.find((c) => c.id.startsWith("country."))?.text;

    return {
      label: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
      placeName: feature.text,
      city,
      neighbourhood,
      country,
    };
  } catch {
    return null;
  }
}

/** Forward geocode for the map's location search box. */
export async function searchPlaces(
  query: string,
  options: { proximity?: [number, number]; limit?: number } = {}
): Promise<GeocodeResult[]> {
  const token = mapboxToken();
  if (!token || !query.trim()) return [];

  const params = new URLSearchParams({
    access_token: token,
    limit: String(options.limit ?? 6),
    language: "en",
  });
  if (options.proximity) params.set("proximity", options.proximity.join(","));

  try {
    const res = await fetch(
      `${GEOCODE_URL}/${encodeURIComponent(query)}.json?${params.toString()}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: Array<{
        place_name: string;
        text: string;
        center: [number, number];
        context?: Array<{ id: string; text: string }>;
      }>;
    };
    return (data.features ?? []).map((f) => ({
      label: f.place_name,
      lng: f.center[0],
      lat: f.center[1],
      placeName: f.text,
      city: f.context?.find((c) => c.id.startsWith("place."))?.text,
      neighbourhood: f.context?.find((c) => c.id.startsWith("neighborhood."))?.text,
      country: f.context?.find((c) => c.id.startsWith("country."))?.text,
    }));
  } catch {
    return [];
  }
}
