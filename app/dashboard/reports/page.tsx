import { DashboardHeader } from "@/components/dashboard/page-header";
import { ReportList } from "@/components/dashboard/report-list";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listReports } from "@/lib/services/report.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = parseOne(sp.status) ?? "open";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(listReports({ status, page }), {
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
        eyebrow="Trust & safety"
        title="Reports"
        description="Member-submitted reports about listings, accounts and agencies."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "open" ? "/dashboard/reports" : `/dashboard/reports?status=${tab.value}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              status === tab.value
                ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {result.items.length ? (
        <ReportList items={result.items} />
      ) : (
        <EmptyState
          title={status === "open" ? "No open reports" : "Nothing in this view"}
          description="When members flag a listing or account, it appears here for review."
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/reports"
        searchParams={{ status: status !== "open" ? status : undefined }}
        className="mt-10"
      />
    </>
  );
}
