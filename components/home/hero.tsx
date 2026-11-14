import { QuickSearch } from "@/components/property/quick-search";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[min(92svh,54rem)] items-end overflow-hidden bg-charcoal-950">
      <Image
        src="/hero.jpg"
        alt="A contemporary villa with a reflecting pool at dusk"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-charcoal-950/70 via-charcoal-950/15 to-charcoal-950/85"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,transparent_0%,rgba(18,17,15,0.28)_100%)]"
      />

      <div className="container-page relative z-10 pb-14 pt-36 md:pb-20">
        <p className="eyebrow mb-6 flex items-center gap-3 text-brass-300">
          <span aria-hidden className="h-px w-10 bg-brass-400/70" />
          The international property marketplace
        </p>
        <h1 className="max-w-4xl font-serif text-display text-ivory-50 text-balance">
          Extraordinary homes,
          <br className="hidden sm:block" /> <em className="font-normal italic text-brass-200/95">quietly</em>{" "}
          discovered.
        </h1>
        <p className="mt-6 max-w-lg text-lead text-ivory-200/85">
          A curated collection of villas, penthouses and estates from the world&apos;s most
          desired addresses — presented by verified agents.
        </p>

        <div className="mt-10 max-w-3xl">
          <QuickSearch />
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-ivory-200/80">
          {[
            ["24", "Curated residences"],
            ["10", "Signature districts"],
            ["100%", "Verified agents"],
          ].map(([value, label]) => (
            <div key={label} className="flex items-baseline gap-2.5">
              <dt className="font-serif text-2xl text-ivory-50">{value}</dt>
              <dd className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
