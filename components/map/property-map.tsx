"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import type { GeoJSONSource, Map as GLMap, Popup as GLPopup } from "mapbox-gl";
import type { PropertySummary } from "@/types";
import { formatMarkerPrice } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

type Props = {
  properties: PropertySummary[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBoundsChange?: (bounds: Bounds) => void;
  className?: string;
};

export function hasMapToken() {
  return Boolean(TOKEN);
}

export function PropertyMap({ properties, selectedId, onSelect, onBoundsChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GLMap | null>(null);
  const readyRef = useRef(false);
  const fittedRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    TOKEN ? "loading" : "error"
  );
  const propsRef = useRef({ properties, onSelect, onBoundsChange });

  function propertiesRef() {
    return propsRef.current.properties;
  }

  useEffect(() => {
    propsRef.current = { properties, onSelect, onBoundsChange };
  }, [properties, onSelect, onBoundsChange]);

  /* ------------------------------- init ---------------------------------- */
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;
    let removeResize: (() => void) | undefined;

    (async () => {
      try {
        const mod = await import("mapbox-gl");
        const mapboxgl = (mod.default ?? mod) as unknown as typeof import("mapbox-gl").default;
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [3.45, 7.2],
          zoom: 2.4,
          attributionControl: false,
          cooperativeGestures: true,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          if (cancelled) return;
          readyRef.current = true;
          setStatus("ready");
          sync(propertiesRef());
        });

        map.on("moveend", () => {
          const bounds = map.getBounds();
          if (!bounds) return;
          propsRef.current.onBoundsChange?.({
            minLng: bounds.getWest(),
            minLat: bounds.getSouth(),
            maxLng: bounds.getEast(),
            maxLat: bounds.getNorth(),
          });
        });

        map.on("click", "price-labels", (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const id = String(feature.properties?.id ?? "");
          const property = propsRef.current.properties.find((p) => p.id === id);
          if (!property) return;
          propsRef.current.onSelect?.(id);
          openPopup(map, property, mapboxgl);
        });

        map.on("click", "clusters", (event) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const clusterId = Number(feature.properties?.cluster_id);
          const source = map.getSource("properties") as GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || !feature.geometry || zoom == null) return;
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
            map.easeTo({ center: [lng!, lat!], zoom: zoom + 0.4, duration: 700 });
          });
        });

        for (const layer of ["price-labels", "clusters"]) {
          map.on("mouseenter", layer, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        const observer = new ResizeObserver(() => map.resize());
        observer.observe(containerRef.current);
        removeResize = () => observer.disconnect();

      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      removeResize?.();
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
      fittedRef.current = false;
    };
  }, []);

  /* ---------------------------- data sync -------------------------------- */
  function sync(items: PropertySummary[]) {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    for (const property of items) {
      const key = `price-${property.id}`;
      if (!map.hasImage(key) && property.location) {
        const image = makePriceImage(property, false, 2);
        if (image) map.addImage(key, image);
      }
    }

    const source = map.getSource("properties") as GeoJSONSource | undefined;
    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: items
        .filter((p) => p.location)
        .map((p) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.location!.lng, p.location!.lat] },
          properties: {
            id: p.id,
            slug: p.slug,
            title: p.title,
            iconKey: `price-${p.id}`,
          },
        })),
    };

    if (source) {
      source.setData(data);
    } else {
      map.addSource("properties", {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 12,
        promoteId: "id",
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "properties",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#1a1815",
          "circle-radius": ["step", ["get", "point_count"], 17, 10, 23, 40, 29],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#faf8f4",
          "circle-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "properties",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#faf8f4" },
      });
      map.addLayer({
        id: "price-labels",
        type: "symbol",
        source: "properties",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["get", "iconKey"],
          "icon-allow-overlap": true,
          "icon-anchor": "bottom",
          "icon-offset": [0, 10],
        },
      });
    }

    if (!fittedRef.current && items.length) {
      fittedRef.current = true;
      fitToProperties(map, items);
    }
  }

  useEffect(() => {
    sync(properties);
  }, [properties]);

  /* --------------------------- selection --------------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !selectedId) return;
    const property = properties.find((p) => p.id === selectedId);
    if (!property?.location) return;
    map.easeTo({
      center: [property.location.lng, property.location.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 700,
    });
  }, [selectedId, properties]);

  if (!TOKEN) {
    return (
      <div
        className={cn(
          "flex h-full min-h-80 flex-col items-center justify-center gap-3 bg-ivory-200 p-8 text-center",
          className
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-soft">
          <svg viewBox="0 0 24 24" className="size-5 stroke-charcoal-900" fill="none" strokeWidth="1.4">
            <path d="M12 21s7-6 7-11.5A7 7 0 0 0 5 9.5C5 15 12 21 12 21Z" />
            <circle cx="12" cy="9.3" r="2.4" />
          </svg>
        </div>
        <p className="font-serif text-xl text-charcoal-900">Interactive map</p>
        <p className="max-w-xs text-xs leading-relaxed text-stone-500">
          Add a <code className="rounded bg-white px-1 py-0.5 text-[0.7rem]">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
          to enable the live map. Browse the collection alongside for now.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ivory-200", className)}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Property map" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ivory-100/70">
          <span className="size-5 animate-spin rounded-full border-2 border-stone-300 border-t-charcoal-900" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ivory-200 p-6 text-center text-sm text-stone-500">
          The map could not be loaded. Check your Mapbox token and connection.
        </div>
      )}
    </div>
  );
}

/* ------------------------------- helpers --------------------------------- */

function fitToProperties(map: GLMap, items: PropertySummary[]) {
  const points = items.filter((p) => p.location);
  if (!points.length) return;
  if (points.length === 1) {
    map.easeTo({ center: [points[0]!.location!.lng, points[0]!.location!.lat], zoom: 12.5 });
    return;
  }
  const bounds = points.reduce(
    (acc, p) => {
      const { lng, lat } = p.location!;
      return {
        minLng: Math.min(acc.minLng, lng),
        minLat: Math.min(acc.minLat, lat),
        maxLng: Math.max(acc.maxLng, lng),
        maxLat: Math.max(acc.maxLat, lat),
      };
    },
    { minLng: 180, minLat: 90, maxLng: -180, maxLat: -90 }
  );
  map.fitBounds(
    [
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.maxLat],
    ],
    { padding: 70, maxZoom: 12.5, duration: 900 }
  );
}

function makePriceImage(property: PropertySummary, selected: boolean, ratio: number) {
  const label = `${property.transactionType === "rent" ? "·" : ""}${formatMarkerPrice(
    property.price,
    property.currency
  )}`;
  const fontSize = 12 * ratio;
  const padX = 9 * ratio;
  const height = 26 * ratio;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = `600 ${fontSize}px Manrope, system-ui, sans-serif`;
  const textWidth = ctx.measureText(label).width;
  const width = Math.ceil(textWidth + padX * 2);
  canvas.width = width;
  canvas.height = height;

  const c = canvas.getContext("2d")!;
  const radius = height / 2;
  const draw = () => {
    c.beginPath();
    c.moveTo(radius, 0);
    c.arcTo(width, 0, width, height, radius);
    c.arcTo(width, height, 0, height, radius);
    c.arcTo(0, height, 0, 0, radius);
    c.arcTo(0, 0, width, 0, radius);
    c.closePath();
  };

  c.fillStyle = selected ? "#b8935a" : "#ffffff";
  draw();
  c.fill();
  c.strokeStyle = selected ? "#9a7845" : "#e4dccb";
  c.lineWidth = ratio;
  draw();
  c.stroke();

  c.fillStyle = selected ? "#1a1815" : "#1a1815";
  c.font = `600 ${fontSize}px Manrope, system-ui, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(label, width / 2, height / 2 + 0.5);

  return c.getImageData(0, 0, width, height);
}

function openPopup(
  map: GLMap,
  property: PropertySummary,
  mapboxgl: typeof import("mapbox-gl").default
) {
  popupRefSafeRemove();
  const node = document.createElement("a");
  node.href = `/properties/${property.slug}`;
  node.className = "block w-52 text-left";

  const img = document.createElement("img");
  img.src = property.coverImage;
  img.alt = "";
  img.className = "h-28 w-full rounded-t object-cover";
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "px-3 py-2.5";

  const price = document.createElement("p");
  price.className = "text-sm font-semibold text-charcoal-900";
  price.textContent = `${property.currency} ${property.price.toLocaleString()}`;

  const title = document.createElement("p");
  title.className = "mt-0.5 line-clamp-2 text-xs text-stone-600";
  title.textContent = property.title;

  const meta = document.createElement("p");
  meta.className = "mt-1.5 text-[0.65rem] uppercase tracking-wider text-stone-400";
  meta.textContent = `${property.bedrooms} bd · ${property.bathrooms} ba · ${property.city}`;

  body.append(price, title, meta);
  node.append(img, body);

  const popup = new mapboxgl.Popup({
    closeButton: true,
    offset: 18,
    maxWidth: "240px",
    className: "arcadia-popup",
  })
    .setLngLat([property.location!.lng, property.location!.lat])
    .setDOMContent(node)
    .addTo(map);

  popup.on("close", () => {
    if (popupRefGlobal === popup) popupRefGlobal = null;
  });
  popupRefGlobal = popup;
  map.getCanvas().focus();
}

let popupRefGlobal: GLPopup | null = null;

function popupRefSafeRemove() {
  popupRefGlobal?.remove();
  popupRefGlobal = null;
}
