import { DashboardHeader } from "@/components/dashboard/page-header";
import { EnquiryList } from "@/components/dashboard/enquiry-list";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { ENQUIRY_STATUSES } from "@/constants";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listEnquiries } from "@/lib/services/enquiry.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = parseOne(sp.status) ?? "all";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(listEnquiries(user, { status, page }), {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    newCount: 0,
  });

  const scopeLabel = user.role === "customer" ? "Your enquiries" : "Incoming enquiries";

  return (
    <>
      <DashboardHeader
        eyebrow="Inbox"
        title={scopeLabel}
        description={
          user.role === "customer"
            ? "Conversations you've started with listing agents."
            : "Prospective buyers and renters who have contacted you."
        }
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        {[{ value: "all", label: "All" }, ...ENQUIRY_STATUSES].map((option) => {
          const active = status === option.value;
          return (
            <Link
              key={option.value}
              href={option.value === "all" ? "/dashboard/enquiries" : `/dashboard/enquiries?status=${option.value}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
              )}
            >
              {option.label}
              {option.value === "new" && result.newCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-brass-500 px-1.5 text-[0.625rem] text-charcoal-950">
                  {result.newCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {result.items.length ? (
        <EnquiryList items={result.items} role={user.role} />
      ) : (
        <EmptyState
          title={user.role === "customer" ? "No enquiries yet" : "No enquiries in this view"}
          description={
            user.role === "customer"
              ? "When you contact an agent about a property, the conversation will appear here."
              : "New messages from buyers and renters will appear here as they arrive."
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
        basePath="/dashboard/enquiries"
        searchParams={status !== "all" ? { status } : {}}
        className="mt-10"
      />
    </>
  );
}
