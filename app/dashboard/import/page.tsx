import { DashboardHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ImportStudio } from "@/components/dashboard/import-studio";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { Property } from "@/models/Property";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireAdmin();

  const data = await settle(
    (async () => {
      await connectDB();
      const [agents, total, pending] = await Promise.all([
        User.find({ role: "agent", status: "active" })
          .select("name email")
          .sort({ name: 1 })
          .lean(),
        Property.countDocuments(),
        Property.countDocuments({ status: "pending" }),
      ]);
      return {
        agents: agents.map((agent) => ({ name: agent.name, email: agent.email })),
        total,
        pending,
      };
    })(),
    { agents: [], total: 0, pending: 0 }
  );

  return (
    <>
      <DashboardHeader
        eyebrow="Platform"
        title="Data import"
        description="Enter real inventory with the listing form, or paste/upload JSON to bulk-load synthetic demo data or genuine listings. JSON entries are validated and upserted by slug."
        action={
          <ButtonLink href="/dashboard/import/new" size="sm">
            Add listing with form
          </ButtonLink>
        }
      />

      <ImportStudio agents={data.agents} total={data.total} pending={data.pending} />
    </>
  );
}
