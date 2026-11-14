"use client";

import { adminUserAction } from "@/actions/admin.actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { PublicAgent } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerificationList({ items }: { items: PublicAgent[] }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {items.map((agent) => (
        <VerificationCard key={agent.id} agent={agent} />
      ))}
    </ul>
  );
}

function VerificationCard({ agent }: { agent: PublicAgent }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const run = async (action: "verify" | "reject_verification", note?: string) => {
    setPending(action);
    const result = await adminUserAction({ userId: agent.id, action, reason: note ?? "" });
    setPending(null);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(action === "verify" ? "Agent verified" : "Verification rejected", "success");
    setRejectOpen(false);
    setReason("");
    router.refresh();
  };

  return (
    <li className="flex flex-col rounded-xl border border-ivory-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <Avatar name={agent.name} src={agent.avatarUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/agents/${agent.slug}`} className="truncate font-serif text-lg text-charcoal-900 hover:underline">
              {agent.name}
            </Link>
            <Badge tone={agent.verificationStatus === "pending" ? "warning" : "danger"}>
              {agent.verificationStatus}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-stone-400">
            {agent.agency?.name ? `${agent.agency.name} · ` : ""}Joined {formatDate(agent.createdAt)}
          </p>
          {agent.bio && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-500">{agent.bio}</p>}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-ivory-100 px-4 py-3 text-xs">
        <div className="col-span-2">
          <dt className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">Licence</dt>
          <dd className="mt-0.5 font-medium text-charcoal-800">{agent.licenseNumber || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">Experience</dt>
          <dd className="mt-0.5 text-charcoal-800">{agent.yearsExperience ? `${agent.yearsExperience} years` : "—"}</dd>
        </div>
        <div>
          <dt className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">Listings</dt>
          <dd className="mt-0.5 text-charcoal-800">{agent.listingCount ?? 0}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">Specialisations</dt>
          <dd className="mt-0.5 text-charcoal-800">
            {agent.specializations?.length ? agent.specializations.join(", ") : "—"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">Languages</dt>
          <dd className="mt-0.5 text-charcoal-800">{agent.languages?.length ? agent.languages.join(", ") : "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run("verify")} loading={pending === "verify"} disabled={Boolean(pending)}>
          Verify
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} disabled={Boolean(pending)}>
          Reject
        </Button>
        <Link
          href={`/agents/${agent.slug}`}
          className="ml-auto self-center text-xs font-medium text-charcoal-900 underline-offset-4 hover:underline"
        >
          View profile
        </Link>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogHeader title="Reject verification" description={`${agent.name} will be notified with your reason.`} />
        <DialogBody>
          <Label htmlFor={`reason-${agent.id}`}>Reason</Label>
          <Input
            id={`reason-${agent.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Licence number could not be validated with the registry."
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => run("reject_verification", reason)}
            loading={pending === "reject_verification"}
            disabled={reason.trim().length < 3}
          >
            Reject verification
          </Button>
        </DialogFooter>
      </Dialog>
    </li>
  );
}
