"use client";

import { updateInspectionAction } from "@/actions/inspection.actions";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { INSPECTION_SLOTS } from "@/constants";
import { formatDate } from "@/lib/utils";
import type { InspectionDTO } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InspectionList({ items, role }: { items: InspectionDTO[]; role: string }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <InspectionCard key={item.id} inspection={item} role={role} />
      ))}
    </ul>
  );
}

function InspectionCard({ inspection, role }: { inspection: InspectionDTO; role: string }) {
  const isAgentView = role !== "customer";
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [note, setNote] = useState("");
  const [proposedDate, setProposedDate] = useState(
    new Date(inspection.preferredDate).toISOString().slice(0, 10)
  );
  const [proposedSlot, setProposedSlot] = useState<string>(inspection.slot || INSPECTION_SLOTS[0]!);
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const act = async (action: string, extra?: { note?: string; proposedDate?: string; proposedSlot?: string }) => {
    setPending(action);
    const result = await updateInspectionAction({
      inspectionId: inspection.id,
      action,
      note: extra?.note ?? "",
      proposedDate: extra?.proposedDate ?? "",
      proposedSlot: extra?.proposedSlot,
    });
    setPending(null);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Appointment updated", "success");
    setRescheduleOpen(false);
    setDeclineOpen(false);
    setNote("");
    router.refresh();
  };

  const closed = ["completed", "cancelled", "declined"].includes(inspection.status);

  return (
    <li className="overflow-hidden rounded-xl border border-ivory-200 bg-white">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        {inspection.property && (
          <Link
            href={`/properties/${inspection.property.slug}`}
            className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-ivory-200 sm:h-24 sm:w-32"
          >
            <Image src={inspection.property.coverImage} alt="" fill sizes="128px" className="object-cover" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {inspection.property ? (
                <Link
                  href={`/properties/${inspection.property.slug}`}
                  className="block truncate text-sm font-medium text-charcoal-900 hover:underline"
                >
                  {inspection.property.title}
                </Link>
              ) : (
                <p className="text-sm text-stone-400">Property removed</p>
              )}
              <p className="mt-0.5 text-xs text-stone-400">
                {inspection.property?.city ?? ""} · requested {formatDate(inspection.createdAt)}
              </p>
            </div>
            <StatusBadge status={inspection.status} />
          </div>

          <div className="mt-3 grid gap-2 rounded-lg bg-ivory-100 px-4 py-3 text-xs text-stone-600 sm:grid-cols-2">
            <p>
              <span className="text-stone-400">Preferred</span>{" "}
              {formatDate(inspection.preferredDate, { weekday: "short", day: "numeric", month: "short" })} · {inspection.slot}
            </p>
            {inspection.alternativeDate && (
              <p>
                <span className="text-stone-400">Alternative</span>{" "}
                {formatDate(inspection.alternativeDate, { weekday: "short", day: "numeric", month: "short" })}
              </p>
            )}
            <p>
              <span className="text-stone-400">{isAgentView ? "Client" : "Agent"}</span>{" "}
              {(isAgentView ? inspection.customer?.name : inspection.agent?.name) ?? "—"}
            </p>
            {inspection.scheduledAt && (
              <p>
                <span className="text-stone-400">Confirmed for</span> {formatDate(inspection.scheduledAt)}
              </p>
            )}
          </div>

          {inspection.message && (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-stone-500">{inspection.message}</p>
          )}
          {inspection.responseNote && (
            <p className="mt-3 border-l-2 border-brass-500 pl-3 text-[0.8125rem] leading-relaxed text-stone-600">
              {inspection.responseNote}
            </p>
          )}

          {!closed && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isAgentView ? (
                <>
                  {inspection.status === "requested" && (
                    <Button size="sm" onClick={() => act("confirm")} loading={pending === "confirm"}>
                      Confirm
                    </Button>
                  )}
                  {(inspection.status === "requested" || inspection.status === "rescheduled") && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)}>
                        Propose another time
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeclineOpen(true)}>
                        Decline
                      </Button>
                    </>
                  )}
                  {inspection.status === "confirmed" && (
                    <>
                      <Button size="sm" onClick={() => act("complete")} loading={pending === "complete"}>
                        Mark completed
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => act("cancel")} loading={pending === "cancel"}>
                        Cancel
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {inspection.status === "rescheduled" && (
                    <Button size="sm" onClick={() => act("accept_reschedule")} loading={pending === "accept_reschedule"}>
                      Accept new time
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => act("cancel")} loading={pending === "cancel"}>
                    Cancel viewing
                  </Button>
                </>
              )}
              {inspection.property && (
                <Link
                  href={`/properties/${inspection.property.slug}`}
                  className="ml-auto text-xs font-medium text-charcoal-900 underline-offset-4 hover:underline"
                >
                  View property
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogHeader title="Propose a new time" description="The client will be asked to accept the change." />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="new-date">Date</Label>
            <Input id="new-date" type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-slot">Time slot</Label>
            <Select id="new-slot" value={proposedSlot} onChange={(e) => setProposedSlot(e.target.value)}>
              {INSPECTION_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="note" hint="Optional">
              Note to client
            </Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => act("reschedule", { note, proposedDate, proposedSlot })}
            loading={pending === "reschedule"}
          >
            Send proposal
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogHeader title="Decline viewing" description="Let the client know why, with an optional note." />
        <DialogBody>
          <Label htmlFor="decline-note" hint="Optional">
            Reason
          </Label>
          <Textarea id="decline-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24" />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeclineOpen(false)}>
            Keep request
          </Button>
          <Button variant="danger" onClick={() => act("decline", { note })} loading={pending === "decline"}>
            Decline
          </Button>
        </DialogFooter>
      </Dialog>
    </li>
  );
}
