import { redirect } from "next/navigation";
import { DashboardHeader, StatCard } from "@/components/dashboard/page-header";
import { BarList, Sparkline } from "@/components/dashboard/charts";
import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getAdminOverview, getAgentOverview } from "@/lib/services/analytics.service";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (user.role === "customer") redirect("/dashboard");

  if (user.role === "admin") {
    const overview = await settle(getAdminOverview(), {
      totals: { users: 0, agents: 0, properties: 0, pendingListings: 0, enquiries: 0, inspections: 0, reports: 0 },
      listingStatus: [],
      signupsByMonth: [],
      listingsByMonth: [],
      topDistricts: [],
    });

    return (
      <>
        <DashboardHeader
          eyebrow="Insights"
          title="Platform analytics"
          description="Marketplace health across supply, demand and audience."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Members" value={overview.totals.users.toLocaleString()} hint={`${overview.totals.agents} agents`} />
          <StatCard label="Listings" value={overview.totals.properties.toLocaleString()} hint={`${overview.totals.pendingListings} awaiting review`} tone="dark" />
          <StatCard label="Enquiries" value={overview.totals.enquiries.toLocaleString()} hint={`${overview.totals.inspections} viewings`} />
          <StatCard label="Open reports" value={overview.totals.reports.toLocaleString()} hint="Trust & safety" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="New members" subtitle="Last 12 months">
            <Sparkline
              values={overview.signupsByMonth.map((d) => d.count)}
              labels={overview.signupsByMonth.map((d) => d.month.slice(5))}
            />
          </ChartCard>
          <ChartCard title="Listings published" subtitle="Last 12 months">
            <Sparkline
              values={overview.listingsByMonth.map((d) => d.count)}
              labels={overview.listingsByMonth.map((d) => d.month.slice(5))}
            />
          </ChartCard>
          <ChartCard title="Inventory by status">
            <BarList
              items={overview.listingStatus.map((row) => ({ label: row.status, value: row.count }))}
              emptyLabel="No listings yet"
            />
          </ChartCard>
          <ChartCard title="Top districts">
            <BarList
              items={overview.topDistricts.map((row) => ({ label: row.name, value: row.count }))}
              emptyLabel="No geographic data yet"
            />
          </ChartCard>
        </div>

        <p className="mt-6 text-xs text-stone-400">
          Looking for listing-level performance?{" "}
          <Link href="/dashboard/moderation" className="text-brass-700 underline-offset-4 hover:underline">
            Review the moderation queue
          </Link>
          .
        </p>
      </>
    );
  }

  const overview = await settle(getAgentOverview(user.id), {
    totals: { listings: 0, active: 0, pending: 0, views: 0, enquiries: 0, inspections: 0, favourites: 0 },
    viewsByDay: [],
    enquiriesByStatus: [],
    topListings: [],
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Insights"
        title="Your analytics"
        description="How buyers and renters are engaging with your portfolio."
        action={
          <Link href="/dashboard/listings" className="text-xs text-brass-700 underline-offset-4 hover:underline">
            Manage listings
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total views" value={overview.totals.views.toLocaleString()} hint={`${overview.totals.favourites} saves`} tone="dark" />
        <StatCard label="Enquiries" value={overview.totals.enquiries.toLocaleString()} hint={`${overview.totals.inspections} viewings`} />
        <StatCard label="Active listings" value={overview.totals.active} hint={`${overview.totals.listings} total`} />
        <StatCard label="Awaiting review" value={overview.totals.pending} hint="Editorial queue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Views over the last 14 days">
          <Sparkline
            values={overview.viewsByDay.map((d) => d.count)}
            labels={overview.viewsByDay.map((d) => d.day.slice(5))}
          />
        </ChartCard>
        <ChartCard title="Enquiry pipeline">
          <BarList
            items={overview.enquiriesByStatus.map((row) => ({ label: row.status, value: row.count }))}
            emptyLabel="No enquiries yet"
          />
        </ChartCard>
      </div>

      <section className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
        <h2 className="font-serif text-xl text-charcoal-900">Top performing listings</h2>
        {overview.topListings.length ? (
          <ul className="mt-4 divide-y divide-ivory-200">
            {overview.topListings.map((listing) => (
              <li key={listing.id} className="flex flex-wrap items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/properties/${listing.slug}`} className="truncate text-sm font-medium text-charcoal-900 hover:underline">
                    {listing.title}
                  </Link>
                  <p className="text-xs text-stone-400 capitalize">{listing.status.replace(/_/g, " ")}</p>
                </div>
                <span className="text-xs text-stone-500">{listing.views.toLocaleString()} views</span>
                <span className="text-xs text-stone-500">{listing.enquiries} enquiries</span>
                <span className="w-24 text-right text-sm font-medium text-charcoal-900">
                  {formatPrice(listing.price, listing.currency, { compact: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 py-6 text-sm text-stone-400">Publish a listing to start collecting data.</p>
        )}
      </section>
    </>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ivory-200 bg-white p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg text-charcoal-900">{title}</h2>
        {subtitle && <span className="text-[0.6875rem] text-stone-400">{subtitle}</span>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
