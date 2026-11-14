import { DashboardHeader } from "@/components/dashboard/page-header";
import { PropertyGrid } from "@/components/property/property-grid";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listRecentlyViewed } from "@/lib/services/engagement.service";

export const dynamic = "force-dynamic";

export default async function RecentPage() {
  const user = await requireUser();
  const items = await settle(listRecentlyViewed(user.id), []);

  return (
    <>
      <DashboardHeader
        eyebrow="History"
        title="Recently viewed"
        description="The last homes you explored, kept for easy return."
        action={
          <ButtonLink href="/properties" size="sm" variant="outline">
            Continue browsing
          </ButtonLink>
        }
      />
      <PropertyGrid
        properties={items.map((item) => item.property)}
        authed
        emptyTitle="No history yet"
        emptyDescription="As you browse the marketplace, the homes you visit will appear here."
      />
    </>
  );
}
