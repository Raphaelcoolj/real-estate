import { AgentStrip, AgentsPrompt } from "@/components/home/agent-strip";
import { CollectionBand } from "@/components/home/collection-band";
import { DistrictGrid } from "@/components/home/district-grid";
import { Hero } from "@/components/home/hero";
import { PropertyGrid } from "@/components/property/property-grid";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { settle } from "@/lib/settle";
import { getFavouriteIds } from "@/lib/services/engagement.service";
import {
  getDistrictCounts,
  getFeaturedProperties,
  getNewListings,
} from "@/lib/services/property.service";
import { getAgents } from "@/lib/services/user.service";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [featured, newest, districtCounts, agentPage] = await Promise.all([
    settle(getFeaturedProperties(3), []),
    settle(getNewListings(3), []),
    settle(getDistrictCounts(), []),
    settle(getAgents({ page: 1 }), {
      items: [],
      page: 1,
      pageSize: 12,
      total: 0,
      totalPages: 1,
      hasMore: false,
    }),
  ]);

  const ids = [...featured, ...newest].map((p) => p.id);
  const savedIds = user && ids.length ? await settle(getFavouriteIds(user.id, ids), []) : [];

  const agents = agentPage.items.slice(0, 4);

  return (
    <>
      <Hero />

      <section className="border-b border-ivory-200 bg-ivory-50">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
          {[
            {
              title: "Verified agents",
              body: "Every professional is identity-checked and held to our service standard.",
            },
            {
              title: "Considered listings",
              body: "Each home is reviewed by our editorial team before it reaches the marketplace.",
            },
            {
              title: "A global view",
              body: "Prime addresses across Lagos, London, Dubai, New York and Cape Town.",
            },
          ].map((item, index) => (
            <div key={item.title} className="flex gap-4">
              <span className="font-serif text-sm text-brass-500">0{index + 1}</span>
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-charcoal-900">{item.title}</h2>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-stone-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-20 md:py-28" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="The private collection"
          title="Homes that speak softly"
          description="A hand-picked selection of the season's most compelling residences."
          action={
            <ButtonLink href="/properties" variant="outline" size="sm">
              View all properties
            </ButtonLink>
          }
        />
        {featured.length ? (
          <PropertyGrid properties={featured} authed={Boolean(user)} savedIds={savedIds} className="lg:grid-cols-3" />
        ) : (
          <p className="text-sm text-stone-500">
            New listings are being prepared — check back shortly.
          </p>
        )}
      </section>

      <section className="border-y border-ivory-200 bg-white py-20 md:py-28" aria-labelledby="types-heading">
        <div className="container-page">
          <SectionHeading
            id="types-heading"
            eyebrow="By residence"
            title="Find your form of living"
            description="From skyline apartments to beachfront villas, explore homes by character."
          />
          <CollectionBand />
        </div>
      </section>

      <section id="locations" className="container-page py-20 md:py-28" aria-labelledby="locations-heading">
        <SectionHeading
          id="locations-heading"
          eyebrow="Destinations"
          title="Addresses worth keeping"
          description="Ten districts where architecture, landscape and provenance align."
          action={
            <ButtonLink href="/properties" variant="outline" size="sm">
              Explore all locations
            </ButtonLink>
          }
        />
        <DistrictGrid counts={districtCounts} />
      </section>

      <section className="border-t border-ivory-200 bg-ivory-100/50 py-20 md:py-28" aria-labelledby="new-heading">
        <div className="container-page">
          <SectionHeading
            id="new-heading"
            eyebrow="Just listed"
            title="New to the marketplace"
            action={
              <ButtonLink href="/properties?sort=newest" variant="outline" size="sm">
                See what&apos;s new
              </ButtonLink>
            }
          />
          {newest.length ? (
            <PropertyGrid properties={newest} authed={Boolean(user)} savedIds={savedIds} className="lg:grid-cols-3" />
          ) : (
            <p className="text-sm text-stone-500">Nothing new yet — come back soon.</p>
          )}
        </div>
      </section>

      <section className="container-page py-20 md:py-28" aria-labelledby="agents-heading">
        <SectionHeading
          id="agents-heading"
          eyebrow="The people"
          title="Advisors, not salespeople"
          description="Work with specialists who know each street, building and board."
        />
        {agents.length ? (
          <>
            <AgentStrip agents={agents} />
            <div className="mt-6">
              <AgentsPrompt />
            </div>
          </>
        ) : (
          <AgentsPrompt />
        )}
      </section>

      <section className="container-page pb-20 md:pb-28">
        <div className="relative overflow-hidden rounded-2xl bg-charcoal-950 px-6 py-16 md:px-16 md:py-20">
          <Image
            src="/images/locations/mayfair.svg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/85 to-charcoal-950/40" />
          <div className="relative max-w-xl text-ivory-50">
            <p className="eyebrow mb-4 text-brass-400">For sellers and agents</p>
            <h2 className="font-serif text-headline text-balance">
              Present your property to the right audience.
            </h2>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-ivory-200/80">
              Join a moderated marketplace where quality is the standard. List with confidence,
              reach qualified buyers and renters worldwide.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={user?.role === "agent" ? "/dashboard/listings/new" : "/sign-up?role=agent"} variant="accent">
                List a property
              </ButtonLink>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-full border border-ivory-50/30 px-6 text-sm text-ivory-50 transition-colors hover:border-brass-400 hover:text-brass-300"
              >
                Why Arcadia
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
