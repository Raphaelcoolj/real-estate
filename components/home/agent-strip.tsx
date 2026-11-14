import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import type { PublicAgent } from "@/types";
import Link from "next/link";

export function AgentStrip({ agents }: { agents: PublicAgent[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {agents.map((agent) => (
        <article
          key={agent.id}
          className="group flex flex-col items-center rounded-xl border border-ivory-200 bg-white px-6 py-8 text-center transition-shadow duration-500 hover:shadow-lift"
        >
          <Avatar
            name={agent.name}
            src={agent.avatarUrl}
            size={84}
            verified={agent.verificationStatus === "verified"}
          />
          <h3 className="mt-5 font-serif text-xl text-charcoal-900">
            <Link href={`/agents/${agent.slug}`} className="link-underline">
              {agent.name}
            </Link>
          </h3>
          {agent.agency && (
            <p className="mt-1 text-xs tracking-wide text-stone-400 uppercase">{agent.agency.name}</p>
          )}
          <p className="mt-3 line-clamp-3 text-[0.8125rem] leading-relaxed text-stone-500">
            {agent.bio || "Private client advisory across prime international markets."}
          </p>
          <div className="mt-5 flex items-center gap-4 text-[0.6875rem] font-medium tracking-[0.1em] text-stone-400 uppercase">
            <span>{agent.listingCount ?? 0} listings</span>
            {agent.yearsExperience ? <span>{agent.yearsExperience} yrs</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function AgentsPrompt() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-stone-300 bg-white/60 p-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-serif text-2xl text-charcoal-900">Work with a specialist</h3>
        <p className="mt-1.5 max-w-md text-sm text-stone-500">
          Every Arcadia agent is verified, with a proven record in their market.
        </p>
      </div>
      <ButtonLink href="/agents" variant="outline" size="sm">
        Browse the directory
      </ButtonLink>
    </div>
  );
}
