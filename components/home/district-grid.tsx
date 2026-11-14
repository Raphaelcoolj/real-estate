import { POPULAR_DISTRICTS } from "@/constants/locations";
import { buildSearchHref } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function DistrictGrid({ counts }: { counts: Array<{ slug: string; count: number }> }) {
  const countBySlug = new Map(counts.map((c) => [c.slug, c.count]));
  const [lead, ...rest] = POPULAR_DISTRICTS;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {lead && (
        <Link
          href={buildSearchHref({ district: lead.slug })}
          className="group relative col-span-1 overflow-hidden rounded-xl md:col-span-2 md:row-span-2"
        >
          <div className="relative aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[30rem]">
            <Image
              src={lead.image}
              alt={`${lead.name}, ${lead.city}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.04]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-ivory-50">
            <div>
              <p className="label-caps mb-1.5 text-brass-300">{lead.country}</p>
              <h3 className="font-serif text-3xl">{lead.name}</h3>
              <p className="mt-1 text-sm text-ivory-200/80">{lead.blurb}</p>
            </div>
            <span className="shrink-0 rounded-full bg-ivory-50/12 px-3 py-1 text-xs backdrop-blur">
              {countBySlug.get(lead.slug) ?? 0} homes
            </span>
          </div>
        </Link>
      )}

      {rest.slice(0, 6).map((district) => (
        <Link
          key={district.slug}
          href={buildSearchHref({ district: district.slug })}
          className="group relative overflow-hidden rounded-xl"
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={district.image}
              alt={`${district.name}, ${district.city}`}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.05]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/75 via-charcoal-950/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50">
            <h3 className="font-serif text-xl leading-tight">{district.name}</h3>
            <p className="mt-0.5 text-xs text-ivory-200/80">
              {district.city} · {countBySlug.get(district.slug) ?? 0} homes
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
