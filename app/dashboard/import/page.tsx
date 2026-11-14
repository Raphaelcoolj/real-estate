import { DashboardHeader } from "@/components/dashboard/page-header";
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
        description="Paste or upload a JSON array of listings to populate the marketplace with synthetic demo data or genuine inventory. Entries are validated and upserted by slug."
      />

      <ImportStudio agents={data.agents} total={data.total} pending={data.pending} />
    </>
  );
}
