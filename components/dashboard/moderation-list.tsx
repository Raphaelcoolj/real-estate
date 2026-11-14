"use client";

import { moderateListingAction } from "@/actions/property.actions";
import { StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatPrice, relativeTime } from "@/lib/utils";
import type { PropertySummary } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ModerationList({ items }: { items: PropertySummary[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <ModerationCard key={item.id} item={item} />
      ))}
    </ul>
  );
}

function ModerationCard({ item }: { item: PropertySummary }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const act = async (action: string, note?: string) => {
    setPending(action);
    const result = await moderateListingAction({ propertyId: item.id, action, reason: note ?? "" });
    setPending(null);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(
      action === "approve"
        ? "Listing approved and live"
        : action === "reject"
          ? "Listing returned to agent"
          : "Listing updated",
      "success"
    );
    setRejectOpen(false);
    setReason("");
    router.refresh();
  };

  const isLive = item.status === "approved";

  return (
    <li className="overflow-hidden rounded-xl border border-ivory-200 bg-white">
      <div className="flex flex-col gap-5 p-5 lg:flex-row">
        <Link
          href={`/properties/${item.slug}`}
          className="relative h-44 w-full shrink-0 overflow-hidden rounded-lg bg-ivory-200 lg:h-32 lg:w-48"
        >
          <Image src={item.coverImage} alt="" fill sizes="(min-width: 1024px) 192px, 100vw" className="object-cover" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/properties/${item.slug}`} className="block truncate font-serif text-lg text-charcoal-900 hover:underline">
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-stone-400">
                {item.addressLine}, {item.city}, {item.country}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {item.featured && (
                <span className="text-[0.625rem] font-semibold tracking-[0.14em] text-brass-700 uppercase">Featured</span>
              )}
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-500">
            <span className="font-medium text-charcoal-900">
              {formatPrice(item.price, item.currency, { compact: true })}
              {item.pricePeriod === "per_month" ? "/mo" : ""}
            </span>
            <span className="capitalize">{item.propertyType.replace(/_/g, " ")}</span>
            <span>{item.bedrooms} bed · {item.bathrooms} bath</span>
            <span>By {item.agent.name}</span>
            <span>Submitted {relativeTime(item.createdAt)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!isLive && item.status !== "sold" && item.status !== "rented" && (
              <Button size="sm" onClick={() => act("approve")} loading={pending === "approve"}>
                Approve
              </Button>
            )}
            {item.status === "pending" && (
              <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>
                Request changes
              </Button>
            )}
            {isLive && (
              <Button size="sm" variant="outline" onClick={() => act(item.featured ? "unfeature" : "feature")} loading={pending === (item.featured ? "unfeature" : "feature")}>
                {item.featured ? "Unfeature" : "Feature"}
              </Button>
            )}
            {item.status !== "archived" ? (
              <Button size="sm" variant="ghost" onClick={() => act("archive")} loading={pending === "archive"}>
                Archive
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => act("restore")} loading={pending === "restore"}>
                Restore
              </Button>
            )}
            <ButtonLink href={`/properties/${item.slug}`} size="sm" variant="ghost" className="ml-auto">
              Preview
            </ButtonLink>
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogHeader
          title="Request changes"
          description="The agent will see your note and can resubmit. Be specific about what needs fixing."
        />
        <DialogBody>
          <Label htmlFor={`reason-${item.id}`}>Reason</Label>
          <Input
            id={`reason-${item.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Photography is too low resolution; please add a floor plan."
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => act("reject", reason)} loading={pending === "reject"} disabled={reason.trim().length < 5}>
            Return to agent
          </Button>
        </DialogFooter>
      </Dialog>
    </li>
  );
}
