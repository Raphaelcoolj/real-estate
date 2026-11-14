import { PropertyGrid } from "@/components/property/property-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { settle } from "@/lib/settle";
import { searchProperties } from "@/lib/services/property.service";
import { getAgentBySlug } from "@/lib/services/user.service";
import { getFavouriteIds } from "@/lib/services/engagement.service";
import { searchFiltersSchema } from "@/lib/validation/property";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await settle(getAgentBySlug(slug), null);
  if (!agent) return { title: "Agent not found" };
  return {
    title: agent.name,
    description: agent.bio?.slice(0, 155) ?? `${agent.name} — verified Arcadia agent.`,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();

  const listings = await settle(
    searchProperties(searchFiltersSchema.parse({}), { agentId: agent.id, pageSize: 9 }),
    { items: [], page: 1, pageSize: 9, total: 0, totalPages: 1, hasMore: false }
  );
  const savedIds = user
    ? await settle(getFavouriteIds(user.id, listings.items.map((p) => p.id)), [])
    : [];

  return (
    <>
      <div className="border-b border-ivory-200 bg-ivory-100/50">
        <div className="container-page py-12 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar
                name={agent.name}
                src={agent.avatarUrl}
                size={112}
                verified={agent.verificationStatus === "verified"}
              />
              <div>
                <p className="eyebrow mb-2 text-brass-600">Listing agent</p>
                <h1 className="font-serif text-headline leading-none text-charcoal-900">{agent.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {agent.agency && (
                    <Link
                      href={`/agencies/${agent.agency.slug}`}
                      className="text-sm text-stone-600 underline-offset-4 hover:underline"
                    >
                      {agent.agency.name}
                    </Link>
                  )}
                  {agent.verificationStatus === "verified" && <Badge tone="success">Verified</Badge>}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-stone-500">
                  <span>{agent.listingCount ?? 0} active listings</span>
                  {agent.yearsExperience ? <span>{agent.yearsExperience} years experience</span> : null}
                  {agent.languages && agent.languages.length > 0 && (
                    <span>Speaks {agent.languages.join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {agent.phone && (
                <ButtonLink href={`tel:${agent.phone}`} variant="primary">
                  Call {agent.phone}
                </ButtonLink>
              )}
              {agent.email && (
                <ButtonLink href={`mailto:${agent.email}`} variant="outline">
                  Email agent
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <div>
          <h2 className="font-serif text-2xl text-charcoal-900">About {agent.name.split(" ")[0]}</h2>
          <p className="mt-4 whitespace-pre-line text-[0.9375rem] leading-[1.8] text-stone-600">
            {agent.bio ||
              "A trusted advisor in prime residential property, guiding private clients through acquisitions and sales with discretion and market intelligence."}
          </p>

          {agent.specializations && agent.specializations.length > 0 && (
            <div className="mt-8">
              <h3 className="label-caps mb-3 text-stone-400">Specialisations</h3>
              <div className="flex flex-wrap gap-2">
                {agent.specializations.map((s) => (
                  <span key={s} className="rounded-full border border-stone-200 px-3.5 py-1.5 text-xs text-stone-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listings.items.length > 0 && (
            <div className="mt-14">
              <SectionHeading eyebrow="Portfolio" title="Current listings" className="mb-8" />
              <PropertyGrid
                properties={listings.items}
                authed={Boolean(user)}
                savedIds={savedIds}
                className="lg:grid-cols-2 xl:grid-cols-2"
              />
              {listings.total > listings.items.length && (
                <p className="mt-8 text-sm text-stone-500">
                  Showing {listings.items.length} of {listings.total} listings.
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-ivory-200 bg-white p-6">
            <h2 className="font-serif text-xl text-charcoal-900">Credentials</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Status" value={agent.verificationStatus === "verified" ? "Verified agent" : "Under review"} />
              {agent.licenseNumber && <Row label="Licence" value={agent.licenseNumber} />}
              {agent.agency && <Row label="Agency" value={agent.agency.name} />}
              {agent.agency?.country && <Row label="Market" value={agent.agency.country} />}
              <Row label="Member since" value={new Date(agent.createdAt).getFullYear().toString()} />
            </dl>
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="mt-6 flex items-center justify-center rounded-full bg-charcoal-900 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-charcoal-800"
              >
                {agent.phone}
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ivory-200 pb-3">
      <dt className="text-[0.6875rem] tracking-[0.12em] text-stone-400 uppercase">{label}</dt>
      <dd className="text-right font-medium text-charcoal-900">{value}</dd>
    </div>
  );
}
