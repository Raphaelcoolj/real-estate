import { DashboardHeader } from "@/components/dashboard/page-header";
import { ListingTable } from "@/components/dashboard/listing-table";
import { ButtonLink, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/constants";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireRole } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getAgentListings } from "@/lib/services/property.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["agent", "admin"]);
  const sp = await searchParams;
  const status = (parseOne(sp.status) ?? "all") as PropertyStatus | "all";
  const q = parseOne(sp.q) ?? "";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(getAgentListings(user.id, { status, q, page }), {
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
        eyebrow="Portfolio"
        title="Your listings"
        description={`${result.total} propert${result.total === 1 ? "y" : "ies"} in your portfolio.`}
        action={
          <ButtonLink
            href={user.role === "admin" ? "/dashboard/import/new" : "/dashboard/listings/new"}
            size="sm"
          >
            New listing
          </ButtonLink>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[{ value: "all", label: "All" }, ...PROPERTY_STATUSES].map((option) => {
            const active = status === option.value;
            const params = new URLSearchParams();
            if (option.value !== "all") params.set("status", option.value);
            if (q) params.set("q", q);
            const qs = params.toString();
            return (
              <Link
                key={option.value}
                href={qs ? `/dashboard/listings?${qs}` : "/dashboard/listings"}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <form action="/dashboard/listings" className="flex gap-2">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Search listings…" className="h-9 max-w-56" aria-label="Search listings" />
          <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
            Search
          </button>
        </form>
      </div>

      {result.items.length ? (
        <ListingTable items={result.items} />
      ) : (
        <EmptyState
          title={q ? "No listings match that search" : "Your portfolio is empty"}
          description={
            q
              ? "Try a different keyword or clear the filters."
              : "Publish your first property to start receiving enquiries and viewing requests."
          }
          action={
            <ButtonLink href={user.role === "admin" ? "/dashboard/import/new" : "/dashboard/listings/new"}>
              Create a listing
            </ButtonLink>
          }
        />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/listings"
        searchParams={{ status: status !== "all" ? status : undefined, q: q || undefined }}
        className="mt-10"
      />
    </>
  );
}
