import Link from "next/link";
import { ActiveFilters } from "@/components/property/active-filters";
import { FilterPanel, type FilterState } from "@/components/property/filter-panel";
import { PropertyGrid } from "@/components/property/property-grid";
import { SearchControls } from "@/components/property/search-controls";
import { MapExplorer } from "@/components/map/map-explorer";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, MAP_PAGE_SIZE } from "@/constants";
import { POPULAR_DISTRICTS } from "@/constants/locations";
import { getCurrentUser } from "@/lib/auth";
import { settle } from "@/lib/settle";
import { filtersToParams, parseSearchFilters, type SearchParamMap } from "@/lib/search-params";
import { getFavouriteIds } from "@/lib/services/engagement.service";
import { searchProperties } from "@/lib/services/property.service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParamMap>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const filters = parseSearchFilters(sp);
  const where = filters.district
    ? POPULAR_DISTRICTS.find((d) => d.slug === filters.district)?.name
    : filters.city;
  const what = filters.transaction === "rent" ? "Properties to rent" : filters.transaction === "sale" ? "Properties for sale" : "Luxury property";
  return {
    title: where ? `${what} in ${where}` : what,
    description: `Browse verified ${what.toLowerCase()} on Arcadia${where ? ` in ${where}` : ""}.`,
  };
}

function toFilterState(filters: ReturnType<typeof parseSearchFilters>): FilterState {
  return {
    transaction: filters.transaction,
    propertyType: filters.propertyType.length ? filters.propertyType : undefined,
    city: filters.city,
    district: filters.district,
    minPrice: filters.minPrice != null ? String(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice != null ? String(filters.maxPrice) : undefined,
    bedrooms: filters.bedrooms != null ? String(filters.bedrooms) : undefined,
    bathrooms: filters.bathrooms != null ? String(filters.bathrooms) : undefined,
    amenities: filters.amenities.length ? filters.amenities : undefined,
    availability: filters.availability,
    sort: filters.sort,
  };
}

function activeCount(filters: ReturnType<typeof parseSearchFilters>): number {
  return (
    (filters.transaction ? 1 : 0) +
    filters.propertyType.length +
    filters.amenities.length +
    (filters.city ? 1 : 0) +
    (filters.district ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.bedrooms != null ? 1 : 0) +
    (filters.bathrooms != null ? 1 : 0) +
    (filters.availability !== "all" ? 1 : 0)
  );
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamMap>;
}) {
  const sp = await searchParams;
  const filters = parseSearchFilters(sp);
  const user = await getCurrentUser();

  const district = filters.district
    ? POPULAR_DISTRICTS.find((d) => d.slug === filters.district)
    : undefined;

  const result = await settle(
    searchProperties(filters, {
      pageSize: filters.view === "map" ? MAP_PAGE_SIZE : PAGE_SIZE,
    }),
    { items: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1, hasMore: false }
  );

  const savedIds = user
    ? await settle(getFavouriteIds(user.id, result.items.map((p) => p.id)), [])
    : [];

  const title = filters.q
    ? `Results for “${filters.q}”`
    : district
      ? district.name
      : filters.city
        ? filters.city
        : filters.transaction === "sale"
          ? "Properties for sale"
          : filters.transaction === "rent"
            ? "Properties to rent"
            : "The collection";

  const description = district
    ? district.blurb
    : "Verified residences across the world's most compelling addresses — refined by price, type and character.";

  const filterState = toFilterState(filters);
  const query = filtersToParams(filters) as Record<string, string | undefined>;

  return (
    <>
      <PageHeader eyebrow={filters.transaction === "rent" ? "To rent" : filters.transaction === "sale" ? "For sale" : "Discover"} title={title} description={description} />

      {filters.view === "map" ? (
        <div className="container-page py-8">
          <SearchControls total={result.total} current={filterState} filterCount={activeCount(filters)} />
          <div className="mt-5">
            <ActiveFilters filters={filters} params={sp} />
          </div>
          <div className="mt-5">
            <MapExplorer
              initialProperties={result.items}
              authed={Boolean(user)}
              savedIds={savedIds}
              query={query}
              total={result.total}
            />
          </div>
          <p className="mt-4 text-center text-xs text-stone-400">
            Showing up to {MAP_PAGE_SIZE} homes in the current map area. Pan and zoom to refine.
          </p>
        </div>
      ) : (
        <div className="container-page grid gap-10 py-10 lg:grid-cols-[17.5rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-ivory-200 bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-xl text-charcoal-900">Refine</h2>
                {activeCount(filters) > 0 && (
                  <Link href="/properties" className="text-[0.6875rem] text-stone-400 underline-offset-4 hover:underline">
                    Clear
                  </Link>
                )}
              </div>
              <FilterPanel current={filterState} />
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-5">
              <SearchControls total={result.total} current={filterState} filterCount={activeCount(filters)} />
              <ActiveFilters filters={filters} params={sp} />
            </div>

            <div className="mt-8">
              {result.items.length ? (
                <>
                  <PropertyGrid
                    properties={result.items}
                    authed={Boolean(user)}
                    savedIds={savedIds}
                    className="xl:grid-cols-3"
                  />
                  <Pagination
                    page={result.page}
                    totalPages={result.totalPages}
                    searchParams={query}
                    className="mt-14"
                  />
                </>
              ) : (
                <EmptyState
                  title="No properties match these filters"
                  description="Try removing a filter, widening the price range or exploring another district."
                  action={
                    <Link
                      href="/properties"
                      className="inline-flex h-9 items-center rounded-full border border-stone-300 px-4 text-[0.8125rem] font-medium text-charcoal-900 transition-colors hover:border-charcoal-900"
                    >
                      Reset all filters
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
