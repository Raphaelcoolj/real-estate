"use client";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  AMENITY_GROUPS,
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  PROPERTY_TYPES,
} from "@/constants";
import { CITIES, POPULAR_DISTRICTS } from "@/constants/locations";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FilterState = {
  transaction?: string;
  propertyType?: string[];
  city?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  amenities?: string[];
  availability?: string;
  sort?: string;
};

export function FilterPanel({
  current,
  onApplied,
}: {
  current: FilterState;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of fd.entries()) {
      const v = String(value).trim();
      if (!v || v === "all") continue;
      if (key === "propertyType" || key === "amenities") {
        params.append(key, v);
      } else {
        params.set(key, v);
      }
    }
    if (current.sort && current.sort !== "relevance") params.set("sort", current.sort);
    if (current.availability && current.availability !== "all") params.set("availability", current.availability);
    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
    onApplied?.();
  };

  const clear = () => {
    router.push("/properties");
    onApplied?.();
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <Label>Transaction</Label>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-ivory-100 p-1">
          {[
            { value: "", label: "All" },
            { value: "sale", label: "Buy" },
            { value: "rent", label: "Rent" },
          ].map((option) => (
            <label
              key={option.value || "all"}
              className={cn(
                "cursor-pointer rounded-md py-2 text-center text-xs font-semibold tracking-wide transition-all has-[:checked]:bg-white has-[:checked]:text-charcoal-900 has-[:checked]:shadow-soft",
                current.transaction === option.value || (!current.transaction && !option.value)
                  ? "text-stone-500"
                  : "text-stone-500"
              )}
            >
              <input
                type="radio"
                name="transaction"
                value={option.value}
                defaultChecked={
                  option.value ? current.transaction === option.value : !current.transaction
                }
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="filter-city">City</Label>
        <Select id="filter-city" name="city" defaultValue={current.city ?? ""}>
          <option value="">All cities</option>
          {CITIES.map((city) => (
            <option key={city.slug} value={city.city}>
              {city.city}, {city.country}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-district">District</Label>
        <Select id="filter-district" name="district" defaultValue={current.district ?? ""}>
          <option value="">Any district</option>
          {POPULAR_DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}, {d.city}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Price range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="minPrice"
            type="number"
            min={0}
            step={1000}
            placeholder="Min"
            defaultValue={current.minPrice ?? ""}
            aria-label="Minimum price"
          />
          <Input
            name="maxPrice"
            type="number"
            min={0}
            step={1000}
            placeholder="Max"
            defaultValue={current.maxPrice ?? ""}
            aria-label="Maximum price"
          />
        </div>
        <p className="mt-1.5 text-[0.6875rem] text-stone-400">Amounts in the listing currency.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="filter-beds">Bedrooms</Label>
          <Select id="filter-beds" name="bedrooms" defaultValue={current.bedrooms ?? ""}>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-baths">Bathrooms</Label>
          <Select id="filter-baths" name="bathrooms" defaultValue={current.bathrooms ?? ""}>
            {BATHROOM_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Property type</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((type) => (
            <label
              key={type.value}
              className="cursor-pointer rounded-full border border-stone-200 px-3 py-1.5 text-xs transition-colors has-[:checked]:border-charcoal-900 has-[:checked]:bg-charcoal-900 has-[:checked]:text-ivory-50 hover:border-stone-400"
            >
              <input
                type="checkbox"
                name="propertyType"
                value={type.value}
                defaultChecked={current.propertyType?.includes(type.value)}
                className="sr-only"
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAmenitiesOpen((v) => !v)}
          aria-expanded={amenitiesOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="label-caps text-stone-600">Amenities</span>
          <span className="flex items-center gap-2 text-xs text-stone-400">
            {current.amenities?.length ? `${current.amenities.length} selected` : "Select"}
            <svg
              viewBox="0 0 12 8"
              className={cn("h-2 w-3 stroke-current transition-transform", amenitiesOpen && "rotate-180")}
              fill="none"
              strokeWidth="1.5"
            >
              <path d="M1 1.5 6 6.5 11 1.5" />
            </svg>
          </span>
        </button>
        {amenitiesOpen && (
          <div className="mt-4 space-y-4 rounded-lg border border-ivory-200 bg-ivory-50 p-4">
            {AMENITY_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-brass-600 uppercase">
                  {group.group}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <label key={item} className="flex cursor-pointer items-center gap-2.5 text-[0.8125rem] text-stone-600">
                      <input
                        type="checkbox"
                        name="amenities"
                        value={item}
                        defaultChecked={current.amenities?.includes(item)}
                        className="size-4 rounded border-stone-300 accent-charcoal-900"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="filter-availability">Availability</Label>
        <Select id="filter-availability" name="availability" defaultValue={current.availability ?? "all"}>
          <option value="all">Any availability</option>
          <option value="available">Available only</option>
          <option value="under_offer">Sold / rented</option>
        </Select>
      </div>

      <div className="flex gap-2 border-t border-ivory-200 pt-5">
        <Button type="button" variant="ghost" onClick={clear} className="flex-1">
          Reset
        </Button>
        <Button type="submit" className="flex-[1.6]">
          Show results
        </Button>
      </div>
    </form>
  );
}
