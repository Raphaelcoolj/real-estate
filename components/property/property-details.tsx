import { SPEC_LABELS } from "@/constants";
import { formatArea } from "@/lib/utils";
import type { PropertySpecs } from "@/types";

const ORDER = [
  "areaSqm",
  "lotSqm",
  "yearBuilt",
  "floors",
  "parking",
  "furnishing",
  "orientation",
  "heating",
  "cooling",
  "tenure",
  "epc",
] as const;

const humanise = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value.replace(/_/g, " ");
  return String(value);
};

export function SpecGrid({ specs }: { specs: PropertySpecs }) {
  const entries = ORDER.map((key) => {
    const value = specs[key];
    const label = SPEC_LABELS[key] ?? key;
    if (key === "areaSqm" || key === "lotSqm") {
      return { label, value: value ? formatArea(Number(value)) : null };
    }
    return { label, value: humanise(value) };
  }).filter((entry) => entry.value);

  if (!entries.length) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.label} className="border-t border-ivory-200 pt-3">
          <dt className="label-caps text-stone-400">{entry.label}</dt>
          <dd className="mt-1.5 text-sm font-medium text-charcoal-900 capitalize">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AmenitiesList({
  amenities,
  groups,
}: {
  amenities: string[];
  groups: ReadonlyArray<{ group: string; items: readonly string[] }>;
}) {
  if (!amenities.length) return null;
  const set = new Set(amenities);

  const grouped = groups
    .map((g) => ({ group: g.group, items: g.items.filter((item) => set.has(item)) }))
    .filter((g) => g.items.length);

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {grouped.map((group) => (
        <div key={group.group}>
          <h3 className="label-caps mb-3 text-brass-600">{group.group}</h3>
          <ul className="space-y-2.5">
            {group.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-stone-600">
                <svg viewBox="0 0 14 14" className="mt-0.5 size-3.5 shrink-0 stroke-brass-500" fill="none" strokeWidth="1.6" aria-hidden>
                  <path d="M2.5 7.3 5.4 10.2 11.5 4" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
