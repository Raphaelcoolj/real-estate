import { ComparisonTable } from "@/components/property/comparison-table";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getComparisonProperties } from "@/lib/services/engagement.service";

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  const user = await requireUser();
  const properties = await settle(getComparisonProperties(user.id), []);

  return (
    <>
      <DashboardHeader
        eyebrow="Shortlist"
        title="Compare properties"
        description="Weigh the details side by side — up to four homes at a time."
        action={
          <ButtonLink href="/properties" size="sm" variant="outline">
            Add properties
          </ButtonLink>
        }
      />

      {properties.length ? (
        <ComparisonTable properties={properties} />
      ) : (
        <EmptyState
          title="No properties to compare"
          description="Use the compare action on any listing to build a side-by-side shortlist."
          action={
            <ButtonLink href="/properties" size="sm" variant="outline">
              Browse the collection
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
