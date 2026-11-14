import { DashboardHeader } from "@/components/dashboard/page-header";
import { ModerationList } from "@/components/dashboard/moderation-list";
import { EmptyState } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { buttonStyles } from "@/components/ui/button";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getModerationQueue } from "@/lib/services/property.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Live" },
  { value: "rejected", label: "Returned" },
  { value: "archived", label: "Archived" },
];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (parseOne(sp.status) ?? "pending") as "pending" | "approved" | "rejected" | "archived";
  const q = parseOne(sp.q) ?? "";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(getModerationQueue({ status, q, page }), {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pageSize: 12,
    hasMore: false,
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Moderation"
        title="Listing review"
        description="Approve publication, request changes or curate the featured collection."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/moderation?status=${tab.value}`}
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

        <form action="/dashboard/moderation" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <Input name="q" defaultValue={q} placeholder="Title, city or slug…" className="h-9 max-w-60" aria-label="Search queue" />
          <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
            Search
          </button>
        </form>
      </div>

      {result.items.length ? (
        <ModerationList items={result.items} />
      ) : (
        <EmptyState
          title={q ? "Nothing matches that search" : "Queue is clear"}
          description={
            q
              ? "Try a different keyword, or switch tabs."
              : status === "pending"
                ? "No listings are waiting for review. New submissions will appear here."
                : "There are no listings in this bucket."
          }
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/moderation"
        searchParams={{ status, q: q || undefined }}
        className="mt-10"
      />
    </>
  );
}
