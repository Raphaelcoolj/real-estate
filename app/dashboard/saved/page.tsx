import { DashboardHeader } from "@/components/dashboard/page-header";
import { PropertyGrid } from "@/components/property/property-grid";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { parseNumber } from "@/lib/utils";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listFavourites } from "@/lib/services/engagement.service";

export const dynamic = "force-dynamic";

export default async function SavedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(listFavourites(user.id, page), {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Collection"
        title="Saved properties"
        description={`${result.total} ${result.total === 1 ? "home" : "homes"} you've set aside for a closer look.`}
        action={
          <ButtonLink href="/properties" size="sm" variant="outline">
            Browse marketplace
          </ButtonLink>
        }
      />
      <PropertyGrid
        properties={result.items.map((f) => f.property)}
        authed
        savedIds={result.items.map((f) => f.property.id)}
        emptyTitle="Nothing saved yet"
        emptyDescription="Tap the heart on any listing to keep it here — a private collection, visible only to you."
      />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/saved"
        searchParams={{}}
        className="mt-12"
      />
    </>
  );
}
