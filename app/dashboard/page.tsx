import { BarList, Sparkline } from "@/components/dashboard/charts";
import { DashboardHeader, StatCard } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatPrice, relativeTime } from "@/lib/utils";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getAdminOverview, getAgentOverview, getCustomerOverview } from "@/lib/services/analytics.service";
import { getModerationQueue } from "@/lib/services/property.service";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();

  if (user.role === "admin") return <AdminHome />;
  if (user.role === "agent") return <AgentHome userId={user.id} name={user.name} />;
  return <CustomerHome name={user.name} />;
}

/* --------------------------------- Admin --------------------------------- */

async function AdminHome() {
  const [overview, pending] = await Promise.all([
    settle(getAdminOverview(), null),
    settle(getModerationQueue({ status: "pending", page: 1 }), {
      items: [],
      page: 1,
      pageSize: 12,
      total: 0,
      totalPages: 1,
      hasMore: false,
    }),
  ]);

  return (
    <>
      <DashboardHeader
        eyebrow="Administration"
        title="Platform overview"
        description="Marketplace health, moderation load and growth at a glance."
        action={
          <ButtonLink href="/dashboard/moderation" size="sm">
            Open moderation queue
          </ButtonLink>
        }
      />

      {!overview ? (
        <EmptyState title="Analytics unavailable" description="The database is not reachable right now." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Members" value={overview.totals.users} hint={`${overview.totals.agents} agents`} />
            <StatCard label="Listings" value={overview.totals.properties} hint={`${overview.totals.pendingListings} awaiting review`} tone="accent" />
            <StatCard label="Enquiries" value={overview.totals.enquiries} hint={`${overview.totals.inspections} viewings requested`} />
            <StatCard label="Open reports" value={overview.totals.reports} hint="Needs attention" tone={overview.totals.reports > 0 ? "dark" : "default"} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-ivory-200 bg-white p-6">
              <h2 className="font-serif text-xl text-charcoal-900">Listings by status</h2>
              <div className="mt-5">
                <BarList items={overview.listingStatus.map((s) => ({ label: s.status, value: s.count }))} />
              </div>
            </section>
            <section className="rounded-xl border border-ivory-200 bg-white p-6">
              <h2 className="font-serif text-xl text-charcoal-900">Signups by month</h2>
              <div className="mt-5">
                <BarList items={overview.signupsByMonth.map((s) => ({ label: s.month, value: s.count }))} />
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-charcoal-900">Awaiting review</h2>
              <Link href="/dashboard/moderation" className="text-xs text-brass-700 underline-offset-4 hover:underline">
                View all
              </Link>
            </div>
            {pending.items.length ? (
              <ul className="mt-4 divide-y divide-ivory-200">
                {pending.items.slice(0, 6).map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-ivory-200">
                      <Image src={item.coverImage} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-charcoal-900">{item.title}</p>
                      <p className="text-xs text-stone-400">
                        {item.agent.name} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <span className="hidden text-sm text-stone-500 sm:block">
                      {formatPrice(item.price, item.currency, { compact: true })}
                    </span>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-400">Nothing pending — the queue is clear.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

/* --------------------------------- Agent --------------------------------- */

async function AgentHome({ userId, name }: { userId: string; name: string }) {
  const overview = await settle(getAgentOverview(userId), null);

  return (
    <>
      <DashboardHeader
        eyebrow="Agent workspace"
        title={`Good to see you, ${name.split(" ")[0]}.`}
        description="Your portfolio performance, enquiries and audience in one place."
        action={
          <ButtonLink href="/dashboard/listings/new" size="sm">
            New listing
          </ButtonLink>
        }
      />

      {!overview ? (
        <EmptyState title="Analytics unavailable" description="The database is not reachable right now." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total listings" value={overview.totals.listings} hint={`${overview.totals.active} published`} />
            <StatCard label="In review" value={overview.totals.pending} hint="Awaiting moderation" tone="accent" />
            <StatCard label="Total views" value={overview.totals.views.toLocaleString()} hint={`${overview.totals.favourites} saves`} tone="dark" />
            <StatCard label="Enquiries" value={overview.totals.enquiries} hint={`${overview.totals.inspections} viewings`} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-xl border border-ivory-200 bg-white p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-xl text-charcoal-900">Views over the last 14 days</h2>
                <span className="text-xs text-stone-400">{overview.totals.views.toLocaleString()} total</span>
              </div>
              <div className="mt-6">
                <Sparkline
                  values={overview.viewsByDay.map((d) => d.count)}
                  labels={overview.viewsByDay.map((d) => d.day.slice(5))}
                />
              </div>
            </section>

            <section className="rounded-xl border border-ivory-200 bg-white p-6">
              <h2 className="font-serif text-xl text-charcoal-900">Enquiry pipeline</h2>
              <div className="mt-5">
                <BarList
                  items={overview.enquiriesByStatus.map((row) => ({ label: row.status, value: row.count }))}
                  emptyLabel="No enquiries yet"
                />
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-charcoal-900">Top performing listings</h2>
              <Link href="/dashboard/listings" className="text-xs text-brass-700 underline-offset-4 hover:underline">
                Manage listings
              </Link>
            </div>
            {overview.topListings.length ? (
              <ul className="mt-4 divide-y divide-ivory-200">
                {overview.topListings.map((listing) => (
                  <li key={listing.id} className="flex items-center gap-4 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-ivory-200">
                      <Image src={listing.coverImage} alt="" fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/properties/${listing.slug}`} className="truncate text-sm font-medium text-charcoal-900 hover:underline">
                        {listing.title}
                      </Link>
                      <p className="text-xs text-stone-400">
                        {listing.views} views · {listing.enquiries} enquiries
                      </p>
                    </div>
                    <span className="hidden text-sm text-stone-500 sm:block">
                      {formatPrice(listing.price, listing.currency, { compact: true })}
                    </span>
                    <StatusBadge status={listing.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-400">
                No listings yet.{" "}
                <Link href="/dashboard/listings/new" className="text-brass-700 underline underline-offset-4">
                  Create your first
                </Link>
                .
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}

/* -------------------------------- Customer ------------------------------- */

async function CustomerHome({ name }: { name: string }) {
  const user = await requireUser();
  const overview = await settle(getCustomerOverview(user), null);

  return (
    <>
      <DashboardHeader
        eyebrow="Private client"
        title={`Welcome back, ${name.split(" ")[0]}.`}
        description="Your saved homes, enquiries and upcoming viewings."
        action={
          <ButtonLink href="/properties" size="sm">
            Discover homes
          </ButtonLink>
        }
      />

      {!overview ? (
        <EmptyState title="Dashboard unavailable" description="The database is not reachable right now." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Saved homes" value={overview.saved} hint="Your private collection" />
            <StatCard label="Enquiries" value={overview.enquiries} hint="Conversations with agents" />
            <StatCard label="Viewings" value={overview.inspections} hint="Requested and confirmed" tone="accent" />
            <StatCard label="Unread notices" value={overview.unreadNotifications} hint="Since your last visit" tone="dark" />
          </div>

          <section className="mt-6 rounded-xl border border-ivory-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-charcoal-900">Upcoming viewings</h2>
              <Link href="/dashboard/inspections" className="text-xs text-brass-700 underline-offset-4 hover:underline">
                All appointments
              </Link>
            </div>
            {overview.upcomingInspections.length ? (
              <ul className="mt-4 divide-y divide-ivory-200">
                {overview.upcomingInspections.map((inspection) => (
                  <li key={inspection.id} className="flex flex-wrap items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-charcoal-900">
                        {inspection.property?.title ?? "Property"}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-400">
                        {formatDate(inspection.preferredDate, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                        {inspection.slot} · with {inspection.agent?.name ?? "agent"}
                      </p>
                    </div>
                    <StatusBadge status={inspection.status} />
                    {inspection.property && (
                      <Link
                        href={`/properties/${inspection.property.slug}`}
                        className="text-xs font-medium text-charcoal-900 underline-offset-4 hover:underline"
                      >
                        View property
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-400">
                No viewings booked.{" "}
                <Link href="/properties" className="text-brass-700 underline underline-offset-4">
                  Find a home
                </Link>{" "}
                and arrange a private visit.
              </p>
            )}
          </section>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Link href="/dashboard/saved" className="rounded-xl border border-ivory-200 bg-white p-6 transition-shadow hover:shadow-soft">
              <p className="font-serif text-2xl text-charcoal-900">{overview.saved}</p>
              <p className="mt-1 text-xs tracking-wide text-stone-400 uppercase">Saved properties</p>
            </Link>
            <Link href="/dashboard/comparisons" className="rounded-xl border border-ivory-200 bg-white p-6 transition-shadow hover:shadow-soft">
              <p className="font-serif text-2xl text-charcoal-900">{overview.comparisons}</p>
              <p className="mt-1 text-xs tracking-wide text-stone-400 uppercase">In comparison</p>
            </Link>
            <Link href="/dashboard/recent" className="rounded-xl border border-ivory-200 bg-white p-6 transition-shadow hover:shadow-soft">
              <p className="font-serif text-2xl text-charcoal-900">{overview.recentViewed}</p>
              <p className="mt-1 text-xs tracking-wide text-stone-400 uppercase">Recently viewed</p>
            </Link>
          </div>

          <p className="mt-8 text-xs text-stone-400">
            Last activity {relativeTime(overview.upcomingInspections[0]?.createdAt)} ·{" "}
            {formatDateTime(new Date())}
          </p>
        </>
      )}
    </>
  );
}
