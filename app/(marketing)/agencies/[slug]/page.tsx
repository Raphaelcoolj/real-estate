import { PropertyGrid } from "@/components/property/property-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { settle } from "@/lib/settle";
import { searchProperties } from "@/lib/services/property.service";
import { getAgencyBySlug } from "@/lib/services/user.service";
import { getFavouriteIds } from "@/lib/services/engagement.service";
import { searchFiltersSchema } from "@/lib/validation/property";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await settle(getAgencyBySlug(slug), null);
  if (!agency) return { title: "Agency not found" };
  return { title: agency.name, description: agency.description?.slice(0, 155) ?? `${agency.name} on Arcadia.` };
}

export default async function AgencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const listings = await settle(
    searchProperties(searchFiltersSchema.parse({}), { agencyId: agency.id, pageSize: 9 }),
    { items: [], page: 1, pageSize: 9, total: 0, totalPages: 1, hasMore: false }
  );
  const savedIds = user
    ? await settle(getFavouriteIds(user.id, listings.items.map((p) => p.id)), [])
    : [];

  return (
    <>
      <div className="relative isolate overflow-hidden border-b border-ivory-200 bg-charcoal-900">
        {agency.coverImage && (
          <Image src={agency.coverImage} alt="" fill sizes="100vw" className="object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/80 to-charcoal-900/40" />
        <div className="container-page relative z-10 py-16 md:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {agency.logoUrl ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-white">
                <Image src={agency.logoUrl} alt={agency.name} fill sizes="80px" className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-ivory-50 font-serif text-3xl text-charcoal-900">
                {agency.name.charAt(0)}
              </div>
            )}
            <div className="text-ivory-50">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-headline leading-none">{agency.name}</h1>
                {agency.verified && <Badge tone="brass">Verified agency</Badge>}
              </div>
              <p className="mt-2 text-sm text-ivory-300/80">
                {[agency.city, agency.country].filter(Boolean).join(", ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs tracking-wide text-ivory-300/70 uppercase">
                <span>{agency.agentCount} agents</span>
                <span>{agency.listingCount} listings</span>
                {agency.website && (
                  <a href={agency.website} target="_blank" rel="noreferrer noopener" className="hover:text-brass-300">
                    Website ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-12 md:py-16">
        {agency.description && (
          <p className="max-w-3xl whitespace-pre-line text-[0.975rem] leading-[1.8] text-stone-600">
            {agency.description}
          </p>
        )}

        {agency.agents.length > 0 && (
          <section className="mt-14">
            <SectionHeading eyebrow="The team" title="Agents at this agency" className="mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {agency.agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.slug}`}
                  className="flex items-center gap-3.5 rounded-xl border border-ivory-200 bg-white p-4 transition-shadow hover:shadow-soft"
                >
                  <Avatar
                    name={agent.name}
                    src={agent.avatarUrl}
                    size={48}
                    verified={agent.verificationStatus === "verified"}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal-900">{agent.name}</p>
                    <p className="truncate text-[0.6875rem] text-stone-400">
                      {agent.specializations?.[0] ?? "Property advisor"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {listings.items.length > 0 && (
          <section className="mt-14">
            <SectionHeading
              eyebrow="Portfolio"
              title="Listings"
              className="mb-8"
              action={
                <ButtonLink href="/properties" variant="outline" size="sm">
                  Browse all
                </ButtonLink>
              }
            />
            <PropertyGrid properties={listings.items} authed={Boolean(user)} savedIds={savedIds} />
          </section>
        )}
      </div>
    </>
  );
}
