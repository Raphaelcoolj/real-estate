"use client";

import { clearComparisonAction, removeComparisonAction } from "@/actions/engagement.actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatArea, formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ComparisonTable({ properties }: { properties: PropertySummary[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  const remove = (id: string) => {
    setRemoving(id);
    startTransition(async () => {
      const result = await removeComparisonAction(id);
      setRemoving(null);
      if (!result.ok) toast(result.error, "error");
      else {
        toast("Removed from comparison", "success");
        router.refresh();
      }
    });
  };

  const clear = () => {
    startTransition(async () => {
      const result = await clearComparisonAction();
      if (!result.ok) toast(result.error, "error");
      else {
        toast("Comparison cleared", "success");
        router.refresh();
      }
    });
  };

  const rows: { label: string; render: (p: PropertySummary) => string }[] = [
    { label: "Price", render: (p) => formatPrice(p.price, p.currency) + (p.pricePeriod === "per_month" ? " /mo" : "") },
    { label: "Type", render: (p) => p.propertyType },
    { label: "Bedrooms", render: (p) => String(p.bedrooms) },
    { label: "Bathrooms", render: (p) => String(p.bathrooms) },
    { label: "Internal area", render: (p) => (p.areaSqm ? formatArea(p.areaSqm) : "—") },
    { label: "Plot", render: (p) => (p.lotSqm ? formatArea(p.lotSqm) : "—") },
    { label: "Location", render: (p) => [p.neighbourhood, p.city].filter(Boolean).join(", ") },
    { label: "Status", render: (p) => p.status.replace(/_/g, " ") },
    { label: "Agent", render: (p) => p.agent.name },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-stone-500">Comparing {properties.length} homes</p>
        <Button variant="ghost" size="sm" onClick={clear} loading={pending}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ivory-200 bg-white">
        <table className="w-full min-w-[54rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-40 border-b border-ivory-200 bg-ivory-50 p-4 text-[0.625rem] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                Property
              </th>
              {properties.map((property) => (
                <th key={property.id} className="border-b border-l border-ivory-200 p-4 align-top">
                  <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-ivory-200">
                    <Image src={property.coverImage} alt="" fill sizes="260px" className="object-cover" />
                  </div>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="font-serif text-base leading-snug text-charcoal-900 hover:underline"
                  >
                    {property.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(property.id)}
                    disabled={pending && removing === property.id}
                    className="mt-2 block text-[0.6875rem] text-stone-400 underline-offset-4 hover:text-rust-600 hover:underline"
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label} className={index % 2 === 0 ? "bg-ivory-50/40" : ""}>
                <th className="border-b border-ivory-200 p-4 text-[0.625rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
                  {row.label}
                </th>
                {properties.map((property) => (
                  <td key={property.id} className="border-b border-l border-ivory-200 p-4 text-sm text-charcoal-800 capitalize">
                    {row.render(property)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
