import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PropertySummary } from "@/types";

export function PropertyGrid({
  properties,
  authed,
  savedIds = [],
  className,
  emptyTitle = "No properties match your search",
  emptyDescription = "Try widening your filters or exploring a different district.",
}: {
  properties: PropertySummary[];
  authed: boolean;
  savedIds?: string[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!properties.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <ButtonLink href="/properties" variant="outline" size="sm">
            Reset filters
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          authed={authed}
          saved={savedIds.includes(property.id)}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
