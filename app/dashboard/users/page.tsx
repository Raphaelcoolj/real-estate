import { DashboardHeader } from "@/components/dashboard/page-header";
import { UserTable, type AdminUserRow } from "@/components/dashboard/user-table";
import { EmptyState } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { buttonStyles } from "@/components/ui/button";
import { cn, parseNumber, parseOne } from "@/lib/utils";
import { requireAdmin } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { listUsers } from "@/lib/services/user.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLES = [
  { value: "all", label: "Everyone" },
  { value: "customer", label: "Customers" },
  { value: "agent", label: "Agents" },
  { value: "admin", label: "Admins" },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const role = parseOne(sp.role) ?? "all";
  const q = parseOne(sp.q) ?? "";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(listUsers({ role: role as "all" | "customer" | "agent" | "admin", q, page }), {
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
        eyebrow="People"
        title="Members"
        description={`${result.total} account${result.total === 1 ? "" : "s"} across the marketplace.`}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((option) => (
            <Link
              key={option.value}
              href={option.value === "all" ? "/dashboard/users" : `/dashboard/users?role=${option.value}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                role === option.value
                  ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <form action="/dashboard/users" className="flex gap-2">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          <Input name="q" defaultValue={q} placeholder="Name or email…" className="h-9 max-w-60" aria-label="Search members" />
          <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
            Search
          </button>
        </form>
      </div>

      {result.items.length ? (
        <UserTable items={result.items as unknown as AdminUserRow[]} />
      ) : (
        <EmptyState title="No members found" description="Adjust the filters or try a different search." />
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/users"
        searchParams={{ role: role !== "all" ? role : undefined, q: q || undefined }}
        className="mt-10"
      />
    </>
  );
}
