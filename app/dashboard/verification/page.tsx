import { DashboardHeader } from "@/components/dashboard/page-header";
import { VerificationList } from "@/components/dashboard/verification-list";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { parseNumber } from "@/lib/utils";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getAgentVerificationQueue } from "@/lib/services/user.service";

export const dynamic = "force-dynamic";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(getAgentVerificationQueue(page), {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pageSize: 20,
    hasMore: false,
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Trust"
        title="Agent verifications"
        description="Review identity and licence details before granting the verified badge."
      />
      {result.items.length ? (
        <VerificationList items={result.items} />
      ) : (
        <EmptyState
          title="No pending verifications"
          description="Agent verification requests appear here. Verified agents already display the badge across the marketplace."
        />
      )}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/verification"
        className="mt-10"
      />
    </>
  );
}
