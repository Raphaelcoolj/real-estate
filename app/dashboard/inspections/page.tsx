import { DashboardHeader } from "@/components/dashboard/page-header";
import { InspectionList } from "@/components/dashboard/inspection-list";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { INSPECTION_STATUSES } from "@/constants";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listInspections } from "@/lib/services/inspection.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = parseOne(sp.status) ?? "all";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(listInspections(user, { status, page }), {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pendingCount: 0,
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Appointments"
        title={user.role === "customer" ? "Your viewings" : "Viewing requests"}
        description={
          user.role === "customer"
            ? "Private viewings you've requested, and their status."
            : "Coordinate private viewings with prospective buyers and renters."
        }
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {[{ value: "all", label: "All" }, ...INSPECTION_STATUSES].map((option) => {
          const active = status === option.value;
          return (
            <Link
              key={option.value}
              href={option.value === "all" ? "/dashboard/inspections" : `/dashboard/inspections?status=${option.value}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
              )}
            >
              {option.label}
              {option.value === "requested" && result.pendingCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-brass-500 px-1.5 text-[0.625rem] text-charcoal-950">
                  {result.pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {result.items.length ? (
        <InspectionList items={result.items} role={user.role} />
      ) : (
        <EmptyState
          title={user.role === "customer" ? "No viewings yet" : "No viewing requests"}
          description={
            user.role === "customer"
              ? "Open any property and choose ‘Book a viewing’ to arrange a private visit."
              : "Requests from interested buyers and renters will appear here."
          }
          action={
            user.role === "customer" ? (
              <Link href="/properties" className="text-sm text-brass-700 underline underline-offset-4">
                Browse properties
              </Link>
            ) : undefined
          }
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/inspections"
        searchParams={status !== "all" ? { status } : {}}
        className="mt-10"
      />
    </>
  );
}
