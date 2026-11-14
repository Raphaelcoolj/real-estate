import { DashboardHeader } from "@/components/dashboard/page-header";
import { ListingForm, type AgentChoice } from "@/components/dashboard/listing-form";
import { emptyListingFormValues } from "@/lib/listing-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function AdminNewListingPage() {
  await requireAdmin();

  const agents = await settle(
    (async () => {
      await connectDB();
      const docs = await User.find({ role: "agent", status: "active" })
        .select("name email")
        .sort({ name: 1 })
        .lean();
      return docs.map(
        (agent): AgentChoice => ({
          id: String(agent._id),
          name: agent.name,
          email: agent.email,
        })
      );
    })(),
    []
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Data import", href: "/dashboard/import" },
          { label: "New listing" },
        ]}
      />
      <DashboardHeader
        eyebrow="Platform"
        title="Add a listing"
        description="Enter genuine inventory with the full listing form. Assign it to an active agent, then publish immediately, send it to moderation, or save a draft."
      />
      <ListingForm
        mode="create"
        admin
        agents={agents}
        initialValues={emptyListingFormValues()}
      />
    </>
  );
}
