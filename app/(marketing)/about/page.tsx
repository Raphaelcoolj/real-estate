import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description: "Arcadia is a curated international marketplace for exceptional homes, built on verified agents and considered presentation.",
};

const principles = [
  {
    title: "Curation over volume",
    body: "We would rather present twenty remarkable homes than two thousand ordinary ones. Every listing is reviewed before it appears.",
  },
  {
    title: "Verification as standard",
    body: "Agents confirm their identity and licence. Listings are checked for accuracy. Trust is the product.",
  },
  {
    title: "Discretion by design",
    body: "Private clients can enquire, arrange viewings and negotiate without their details circulating widely.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-charcoal-950">
        <Image src="/images/locations/bantry-bay.svg" alt="" fill sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/60 via-charcoal-950/40 to-charcoal-950/90" />
        <div className="container-page relative z-10 py-24 text-center md:py-36">
          <p className="eyebrow mb-5 text-brass-300">Our point of view</p>
          <h1 className="mx-auto max-w-3xl font-serif text-display text-ivory-50 text-balance">
            Property, presented with restraint.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lead text-ivory-200/80">
            Arcadia exists for the buyer who values judgement over inventory — and for the agent
            who believes presentation matters.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow mb-4 text-brass-600">The marketplace</p>
          <h2 className="font-serif text-headline text-charcoal-900 text-balance">
            A quieter way to discover extraordinary homes.
          </h2>
          <div className="mt-6 space-y-4 text-[0.9375rem] leading-[1.8] text-stone-600">
            <p>
              The best homes rarely announce themselves. They are introduced — by people who know
              the street, the building and the provenance. Arcadia brings that introduction online,
              without losing the discretion that makes it valuable.
            </p>
            <p>
              We operate across ten signature districts in Lagos, Dubai, London, New York and Cape
              Town, working exclusively with identity-verified agents. Listings are moderated for
              accuracy and quality, so what you see is what exists.
            </p>
            <p>
              Whether you are acquiring a first home or a fifth, the tools are the same: considered
              search, honest detail, direct access to the specialist who knows the property.
            </p>
          </div>
          <div className="mt-8">
            <ButtonLink href="/properties" variant="primary">
              Explore the collection
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src="/images/locations/chelsea.svg"
            alt="Riverside townhouses in Chelsea"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="border-y border-ivory-200 bg-white py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Principles"
            title="What we hold to"
            description="Three commitments that shape every decision on the platform."
            align="center"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {principles.map((item, index) => (
              <div key={item.title} className="border-t border-ivory-200 pt-6">
                <p className="font-serif text-sm text-brass-500">0{index + 1}</p>
                <h3 className="mt-3 font-serif text-2xl text-charcoal-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20 md:py-28">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            ["10", "Signature districts"],
            ["5", "Global cities"],
            ["100%", "Verified agents"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-serif text-5xl text-charcoal-900">{value}</p>
              <p className="mt-2 text-[0.6875rem] font-medium tracking-[0.18em] text-stone-400 uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20 md:pb-28">
        <div className="rounded-2xl bg-charcoal-900 px-6 py-14 text-center md:px-16">
          <h2 className="mx-auto max-w-2xl font-serif text-headline text-ivory-50 text-balance">
            Thinking of selling, or representing exceptional homes?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ivory-300/70">
            Apply to join as a verified agent. We welcome specialists who share our standard of
            presentation and service.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/sign-up?role=agent" variant="accent">
              Apply as an agent
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="border-ivory-50/30 text-ivory-50 hover:border-brass-400 hover:bg-transparent">
              Speak with us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
