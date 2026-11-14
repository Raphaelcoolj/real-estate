import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PropertyMap } from "@/components/map/property-map";
import { SaveButton } from "@/components/property/save-button";
import { CompareButton } from "@/components/property/compare-button";
import { ShareButton } from "@/components/property/share-button";
import { EnquiryDialog } from "@/components/property/enquiry-dialog";
import { InspectionDialog } from "@/components/property/inspection-dialog";
import { Gallery } from "@/components/property/gallery";
import { ReportDialog } from "@/components/property/report-dialog";
import { AmenitiesList, SpecGrid } from "@/components/property/property-details";
import { PropertyGrid } from "@/components/property/property-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { AMENITY_GROUPS, PROPERTY_TYPES } from "@/constants";
import { getCurrentUser } from "@/lib/auth";
import { settle } from "@/lib/settle";
import { formatArea, formatDate, formatPrice } from "@/lib/utils";
import { getFavouriteIds } from "@/lib/services/engagement.service";
import { recordRecentlyViewed } from "@/lib/services/engagement.service";
import { getPropertyBySlug, incrementPropertyViews } from "@/lib/services/property.service";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const property = await settle(getPropertyBySlug(slug, { user }), null);
  if (!property) return { title: "Property not found" };
  return {
    title: property.title,
    description: property.description.slice(0, 158),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 158),
      images: property.coverImage ? [{ url: property.coverImage }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const property = await getPropertyBySlug(slug, { user });
  if (!property) notFound();

  const savedIds = user ? await settle(getFavouriteIds(user.id, [property.id]), []) : [];
  const saved = savedIds.includes(property.id);
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label ?? property.propertyType;
  const location = [property.neighbourhood, property.city, property.country].filter(Boolean).join(", ");

  after(async () => {
    await incrementPropertyViews(property.id);
    if (user) await recordRecentlyViewed(user.id, property.id);
  });

  return (
    <>
      <div className="border-b border-ivory-200 bg-ivory-100/40">
        <div className="container-page py-4">
          <Breadcrumbs
            items={[
              { label: "Properties", href: "/properties" },
              { label: property.city, href: `/properties?city=${encodeURIComponent(property.city)}` },
              { label: property.title },
            ]}
          />
        </div>
      </div>

      <article className="container-page py-8 md:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{typeLabel}</Badge>
              <Badge tone={property.transactionType === "rent" ? "brass" : "dark"}>
                {property.transactionType === "rent" ? "To rent" : "For sale"}
              </Badge>
              {property.status === "sold" && <Badge tone="dark">Sold</Badge>}
              {property.status === "rented" && <Badge tone="dark">Rented</Badge>}
              {property.featured && <Badge tone="warning">Featured</Badge>}
            </div>
            <h1 className="font-serif text-headline text-charcoal-900 text-balance">{property.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-stone-500">
              <svg viewBox="0 0 16 16" className="size-4 stroke-brass-500" fill="none" strokeWidth="1.5" aria-hidden>
                <path d="M8 14.5s5-4.2 5-8A5 5 0 0 0 3 6.5c0 3.8 5 8 5 8Z" />
                <circle cx="8" cy="6.4" r="1.7" />
              </svg>
              {location}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="font-serif text-4xl leading-none text-charcoal-900">
              {formatPrice(property.price, property.currency)}
              {property.pricePeriod === "per_month" && (
                <span className="ml-1.5 font-sans text-sm text-stone-400">/month</span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <SaveButton propertyId={property.id} initialSaved={saved} authed={Boolean(user)} variant="full" />
              <ShareButton title={property.title} />
              <span className="inline-flex h-11 items-center rounded-full border border-stone-300 px-5">
                <CompareButton propertyId={property.id} authed={Boolean(user)} />
              </span>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <Gallery images={property.images} title={property.title} className="relative" />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_21rem] lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-ivory-200 py-5">
              <Fact label="Bedrooms" value={String(property.bedrooms)} />
              <Fact label="Bathrooms" value={String(property.bathrooms)} />
              {property.areaSqm ? <Fact label="Internal area" value={formatArea(property.areaSqm)} /> : null}
              {property.lotSqm ? <Fact label="Plot" value={formatArea(property.lotSqm)} /> : null}
              {property.specs.yearBuilt ? <Fact label="Built" value={String(property.specs.yearBuilt)} /> : null}
              <Fact label="Listed" value={formatDate(property.publishedAt ?? property.createdAt)} />
            </div>

            {property.highlights.length > 0 && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-charcoal-900">Highlights</h2>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {property.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-600">
                      <span aria-hidden className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-brass-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-serif text-2xl text-charcoal-900">The residence</h2>
              <div className="mt-4 space-y-4 whitespace-pre-line text-[0.9375rem] leading-[1.8] text-stone-600">
                {property.description}
              </div>
            </section>

            <section className="mt-10 border-t border-ivory-200 pt-8">
              <h2 className="font-serif text-2xl text-charcoal-900">Details</h2>
              <div className="mt-5">
                <SpecGrid specs={property.specs} />
              </div>
            </section>

            {property.amenities.length > 0 && (
              <section className="mt-10 border-t border-ivory-200 pt-8">
                <h2 className="font-serif text-2xl text-charcoal-900">Amenities</h2>
                <div className="mt-6">
                  <AmenitiesList amenities={property.amenities} groups={AMENITY_GROUPS} />
                </div>
              </section>
            )}

            {property.floorPlans.length > 0 && (
              <section className="mt-10 border-t border-ivory-200 pt-8">
                <h2 className="font-serif text-2xl text-charcoal-900">Floor plans</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {property.floorPlans.map((plan) => (
                    <li key={plan.url}>
                      <a
                        href={plan.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-charcoal-900 transition-colors hover:border-charcoal-900"
                      >
                        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                          <path d="M2.5 2.5h11v11h-11zM2.5 6h4M6.5 6v7.5M10.5 2.5V9" />
                        </svg>
                        {plan.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {property.videoUrl && (
              <section className="mt-10 border-t border-ivory-200 pt-8">
                <h2 className="font-serif text-2xl text-charcoal-900">Film</h2>
                <a
                  href={property.videoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-brass-700 underline-offset-4 hover:underline"
                >
                  Watch the property film
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M3 13 13 3M6 3h7v7" />
                  </svg>
                </a>
              </section>
            )}

            <section className="mt-10 border-t border-ivory-200 pt-8">
              <h2 className="font-serif text-2xl text-charcoal-900">Location</h2>
              <p className="mt-2 text-sm text-stone-500">
                {property.address.line}, {property.address.city}
              </p>
              <div className="mt-5 h-80 overflow-hidden rounded-xl border border-ivory-200">
                {Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN) && property.location ? (
                  <PropertyMap properties={[property]} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-ivory-100 text-center">
                    <p className="font-serif text-xl text-charcoal-900">{property.address.neighbourhood ?? property.address.city}</p>
                    <p className="max-w-sm px-6 text-xs leading-relaxed text-stone-400">
                      {property.location
                        ? `Approximate position ${property.location.lat.toFixed(4)}, ${property.location.lng.toFixed(4)}. Enable the interactive map with a Mapbox token.`
                        : "Exact coordinates withheld at the seller's request."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ivory-200 pt-6">
              <p className="text-xs text-stone-400">
                Listing reference · {property.id.slice(-8).toUpperCase()}
              </p>
              <ReportDialog targetType="property" targetId={property.id} authed={Boolean(user)} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-xl border border-ivory-200 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3.5">
                <Avatar
                  name={property.agent.name}
                  src={property.agent.avatarUrl}
                  size={56}
                  verified={property.agent.verificationStatus === "verified"}
                />
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-stone-400 uppercase">
                    Listing agent
                  </p>
                  <Link href={`/agents/${property.agent.slug}`} className="link-underline block truncate font-serif text-xl text-charcoal-900">
                    {property.agent.name}
                  </Link>
                  {property.agent.agency && (
                    <p className="truncate text-xs text-stone-500">{property.agent.agency.name}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                <EnquiryDialog
                  propertyId={property.id}
                  propertyTitle={property.title}
                  authed={Boolean(user)}
                  agentName={property.agent.name}
                />
                <InspectionDialog propertyId={property.id} authed={Boolean(user)} />
              </div>

              {(property.agent.phone || property.agent.email) && (
                <div className="mt-5 space-y-2 border-t border-ivory-200 pt-5 text-sm">
                  {property.agent.phone && (
                    <a href={`tel:${property.agent.phone}`} className="flex items-center gap-2.5 text-stone-600 hover:text-charcoal-900">
                      <PhoneIcon /> {property.agent.phone}
                    </a>
                  )}
                  {property.agent.email && (
                    <a href={`mailto:${property.agent.email}`} className="flex items-center gap-2.5 text-stone-600 hover:text-charcoal-900">
                      <MailIcon /> {property.agent.email}
                    </a>
                  )}
                </div>
              )}

              <p className="mt-5 border-t border-ivory-200 pt-4 text-[0.6875rem] leading-relaxed text-stone-400">
                Arcadia verifies agent identity and listing accuracy. Always view a property before
                transferring funds.
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-charcoal-900 p-6 text-ivory-100">
              <p className="eyebrow mb-2 text-brass-400">Private advisory</p>
              <p className="font-serif text-xl leading-snug">Looking for something similar?</p>
              <p className="mt-2 text-xs leading-relaxed text-ivory-300/70">
                Our agents hold off-market opportunities that never reach the public listing.
              </p>
              <ButtonLink href={`/agents/${property.agent.slug}`} variant="outline" size="sm" className="mt-4 border-ivory-50/30 text-ivory-50 hover:border-brass-400 hover:bg-transparent">
                Contact the specialist
              </ButtonLink>
            </div>
          </aside>
        </div>
      </article>

      {property.similar.length > 0 && (
        <section className="border-t border-ivory-200 bg-ivory-100/40 py-16 md:py-20">
          <div className="container-page">
            <SectionHeading eyebrow="You may also like" title="Similar residences" />
            <PropertyGrid properties={property.similar} authed={Boolean(user)} />
          </div>
        </section>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-stone-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-charcoal-900">{value}</p>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.4" aria-hidden>
      <path d="M3 2.5h2.5l1.2 3-1.6 1.4a9 9 0 0 0 4 4l1.4-1.6 3 1.2V13a1.5 1.5 0 0 1-1.6 1.5A11.4 11.4 0 0 1 1.5 4.1 1.5 1.5 0 0 1 3 2.5Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.4" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="m2 4 6 4.5L14 4" />
    </svg>
  );
}
