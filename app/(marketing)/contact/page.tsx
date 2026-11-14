import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Speak with the Arcadia team about buying, selling or representing exceptional property.",
};

const offices = [
  { city: "Lagos", area: "Ikoyi", address: "12 Glover Road, Ikoyi, Lagos", phone: "+234 1 000 0000" },
  { city: "London", area: "Mayfair", address: "48 Grosvenor Street, London W1K", phone: "+44 20 7946 0000" },
  { city: "Dubai", area: "Downtown", address: "Boulevard Plaza, Downtown Dubai", phone: "+971 4 000 0000" },
  { city: "New York", area: "Tribeca", address: "88 Franklin Street, New York, NY", phone: "+1 212 000 0000" },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Start a conversation"
        description="Whether you are buying, selling or simply curious about a market, our advisors are glad to help."
        align="center"
      />

      <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="font-serif text-3xl text-charcoal-900">General enquiries</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone-500">
            For buyers, sellers and press. We reply to every message within one business day.
          </p>

          <div className="mt-8 space-y-5">
            <a
              href="mailto:concierge@arcadia.example"
              className="flex items-start gap-4 rounded-xl border border-ivory-200 bg-white p-5 transition-shadow hover:shadow-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory-100">
                <svg viewBox="0 0 16 16" className="size-4 stroke-charcoal-900" fill="none" strokeWidth="1.4">
                  <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                  <path d="m2 4 6 4.5L14 4" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-charcoal-900">concierge@arcadia.example</span>
                <span className="mt-0.5 block text-xs text-stone-400">Buying, selling and general enquiries</span>
              </span>
            </a>

            <a
              href="mailto:agents@arcadia.example"
              className="flex items-start gap-4 rounded-xl border border-ivory-200 bg-white p-5 transition-shadow hover:shadow-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory-100">
                <svg viewBox="0 0 16 16" className="size-4 stroke-charcoal-900" fill="none" strokeWidth="1.4">
                  <circle cx="8" cy="5.5" r="2.8" />
                  <path d="M2.5 14c.6-2.7 2.8-4.2 5.5-4.2s4.9 1.5 5.5 4.2" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-charcoal-900">agents@arcadia.example</span>
                <span className="mt-0.5 block text-xs text-stone-400">Agency and agent applications</span>
              </span>
            </a>

            <a
              href="tel:+442079460000"
              className="flex items-start gap-4 rounded-xl border border-ivory-200 bg-white p-5 transition-shadow hover:shadow-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivory-100">
                <svg viewBox="0 0 16 16" className="size-4 stroke-charcoal-900" fill="none" strokeWidth="1.4">
                  <path d="M3 2.5h2.5l1.2 3-1.6 1.4a9 9 0 0 0 4 4l1.4-1.6 3 1.2V13a1.5 1.5 0 0 1-1.6 1.5A11.4 11.4 0 0 1 1.5 4.1 1.5 1.5 0 0 1 3 2.5Z" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-medium text-charcoal-900">+44 20 7946 0000</span>
                <span className="mt-0.5 block text-xs text-stone-400">Monday to Friday, 09:00–18:00 GMT</span>
              </span>
            </a>
          </div>

          <div className="mt-10 rounded-xl bg-charcoal-900 p-6 text-ivory-100">
            <p className="eyebrow mb-2 text-brass-400">Already a member?</p>
            <p className="font-serif text-xl">Your advisor is one message away.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <ButtonLink href="/dashboard/enquiries" size="sm" variant="accent">
                My enquiries
              </ButtonLink>
              <ButtonLink href="/agents" size="sm" variant="outline" className="border-ivory-50/30 text-ivory-50 hover:border-brass-400 hover:bg-transparent">
                Find an agent
              </ButtonLink>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-3xl text-charcoal-900">Our houses</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone-500">
            By appointment. Each office is staffed by specialists in its local market.
          </p>
          <div className="mt-8 divide-y divide-ivory-200 border-y border-ivory-200">
            {offices.map((office) => (
              <div key={office.city} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-serif text-xl text-charcoal-900">
                    {office.city} <span className="text-sm font-sans tracking-wide text-stone-400">— {office.area}</span>
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">{office.address}</p>
                </div>
                <a
                  href={`tel:${office.phone.replace(/\s/g, "")}`}
                  className="shrink-0 text-xs font-medium text-brass-700 underline-offset-4 hover:underline"
                >
                  {office.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
