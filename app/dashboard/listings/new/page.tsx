import { DashboardHeader } from "@/components/dashboard/page-header";
import { ListingForm } from "@/components/dashboard/listing-form";
import { emptyListingFormValues } from "@/lib/listing-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireRole(["agent", "admin"]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Listings", href: "/dashboard/listings" },
          { label: "New" },
        ]}
      />
      <DashboardHeader
        eyebrow="Portfolio"
        title="New listing"
        description="Present the property at its best. You can save a draft and finish later."
      />
      <ListingForm mode="create" initialValues={emptyListingFormValues()} />
    </>
  );
}
