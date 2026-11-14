import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { CITIES } from "@/constants/locations";
import { settle } from "@/lib/settle";
import { parseNumber, parseOne } from "@/lib/utils";
import { getAgents } from "@/lib/services/user.service";
import type { SearchParamMap } from "@/lib/search-params";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our agents",
  description: "Browse verified Arcadia agents across prime international markets.",
};

export default async function AgentsPage({ searchParams }: { searchParams: Promise<SearchParamMap> }) {
  const sp = await searchParams;
  const q = parseOne(sp.q);
  const city = parseOne(sp.city);
  const verifiedOnly = parseOne(sp.verified) === "1";
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(getAgents({ q, city, verifiedOnly, page }), {
    items: [],
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const searchParamsForPagination = {
    q,
    city,
    verified: verifiedOnly ? "1" : undefined,
  };

  return (
    <>
      <PageHeader
        eyebrow="The directory"
        title="Advisors with a point of view"
        description="Every Arcadia agent is identity-verified and accountable to our service standard. Find a specialist for your market."
      />

      <div className="container-page py-10 md:py-14">
        <form className="flex flex-col gap-3 rounded-xl border border-ivory-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg viewBox="0 0 16 16" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 stroke-stone-400" fill="none" strokeWidth="1.6" aria-hidden>
              <circle cx="7" cy="7" r="4.6" />
              <path d="m10.5 10.5 3.5 3.5" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, specialisation or area"
              className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-11 pr-4 text-sm focus:border-brass-500 focus:outline-none"
              aria-label="Search agents"
            />
          </div>
          <select
            name="city"
            defaultValue={city ?? ""}
            aria-label="Filter by city"
            className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm focus:border-brass-500 focus:outline-none"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
          <label className="flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-stone-200 px-4 text-xs text-stone-600">
            <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} className="size-4 accent-charcoal-900" />
            Verified only
          </label>
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            <span className="font-medium text-charcoal-900">{result.total}</span>{" "}
            {result.total === 1 ? "agent" : "agents"}
          </p>
          {(q || city || verifiedOnly) && (
            <Link href="/agents" className="text-xs text-stone-400 underline-offset-4 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {result.items.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((agent) => (
              <article
                key={agent.id}
                className="group flex flex-col rounded-xl border border-ivory-200 bg-white p-6 transition-shadow duration-500 hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    name={agent.name}
                    src={agent.avatarUrl}
                    size={64}
                    verified={agent.verificationStatus === "verified"}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-serif text-xl leading-tight text-charcoal-900">
                      <Link href={`/agents/${agent.slug}`} className="link-underline">
                        {agent.name}
                      </Link>
                    </h2>
                    {agent.agency && (
                      <p className="mt-0.5 truncate text-xs tracking-wide text-stone-400 uppercase">
                        {agent.agency.name}
                      </p>
                    )}
                    {agent.verificationStatus === "verified" && (
                      <Badge tone="success" className="mt-2">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 flex-1 text-[0.8125rem] leading-relaxed text-stone-500">
                  {agent.bio || "Specialist in prime residential sales and acquisitions."}
                </p>

                {agent.specializations && agent.specializations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {agent.specializations.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full bg-ivory-100 px-2.5 py-1 text-[0.6875rem] text-stone-500">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-ivory-200 pt-4">
                  <span className="text-[0.6875rem] font-medium tracking-[0.1em] text-stone-400 uppercase">
                    {agent.listingCount ?? 0} listings
                  </span>
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-900 transition-colors hover:text-brass-600"
                  >
                    View profile
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            title="No agents match your search"
            description="Try a different city or clear the filters to browse the full directory."
            action={
              <Link href="/agents" className="text-sm text-brass-700 underline underline-offset-4">
                View all agents
              </Link>
            }
          />
        )}

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/agents"
          searchParams={searchParamsForPagination}
          className="mt-12"
        />
      </div>
    </>
  );
}
