"use client";

import { updateEnquiryAction } from "@/actions/enquiry.actions";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatPrice, relativeTime } from "@/lib/utils";
import type { EnquiryDTO } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnquiryList({ items, role }: { items: EnquiryDTO[]; role: string }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <EnquiryCard key={item.id} enquiry={item} role={role} />
      ))}
    </ul>
  );
}

function EnquiryCard({ enquiry, role }: { enquiry: EnquiryDTO; role: string }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState(enquiry.reply ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const isAgentView = role !== "customer";
  const counterpart = isAgentView ? enquiry.customer : enquiry.agent;

  const act = async (status: string, text?: string) => {
    setPending(status);
    const result = await updateEnquiryAction({ enquiryId: enquiry.id, status, reply: text ?? "" });
    setPending(null);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(status === "replied" ? "Reply sent" : "Enquiry updated", "success");
    setReplyOpen(false);
    router.refresh();
  };

  return (
    <li className="overflow-hidden rounded-xl border border-ivory-200 bg-white">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        {enquiry.property && (
          <Link
            href={`/properties/${enquiry.property.slug}`}
            className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-ivory-200 sm:h-24 sm:w-32"
          >
            <Image src={enquiry.property.coverImage} alt="" fill sizes="128px" className="object-cover" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {enquiry.property ? (
                <Link href={`/properties/${enquiry.property.slug}`} className="block truncate text-sm font-medium text-charcoal-900 hover:underline">
                  {enquiry.property.title}
                </Link>
              ) : (
                <p className="text-sm text-stone-400">Property removed</p>
              )}
              <p className="mt-0.5 text-xs text-stone-400">
                {enquiry.property ? `${formatPrice(enquiry.property.price, enquiry.property.currency, { compact: true })} · ` : ""}
                {relativeTime(enquiry.createdAt)}
              </p>
            </div>
            <StatusBadge status={enquiry.status} />
          </div>

          {counterpart && (
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar name={counterpart.name} src={(counterpart as { avatarUrl?: string | null }).avatarUrl} size={26} />
              <span className="text-xs text-stone-500">
                {isAgentView ? "From" : "To"} <span className="font-medium text-charcoal-800">{counterpart.name}</span>
                {enquiry.phone && isAgentView ? ` · ${enquiry.phone}` : ""}
              </span>
            </div>
          )}

          <p className="mt-3 rounded-lg bg-ivory-100 px-4 py-3 text-[0.8125rem] leading-relaxed text-stone-600">
            {enquiry.message}
          </p>

          {enquiry.reply && (
            <div className="mt-3 rounded-lg border-l-2 border-brass-500 bg-brass-300/10 px-4 py-3">
              <p className="mb-1 text-[0.625rem] font-semibold tracking-[0.14em] text-brass-700 uppercase">
                Agent reply · {enquiry.repliedAt ? relativeTime(enquiry.repliedAt) : ""}
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-stone-600">{enquiry.reply}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isAgentView && enquiry.status !== "closed" && (
              <>
                <Button size="sm" variant="primary" onClick={() => setReplyOpen(true)}>
                  {enquiry.reply ? "Edit reply" : "Reply"}
                </Button>
                {enquiry.status === "new" && (
                  <Button size="sm" variant="ghost" onClick={() => act("read")} loading={pending === "read"}>
                    Mark read
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => act("closed")} loading={pending === "closed"}>
                  Close
                </Button>
              </>
            )}
            {!isAgentView && enquiry.status !== "closed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => act("closed")}
                loading={pending === "closed"}
              >
                Close conversation
              </Button>
            )}
            {enquiry.property && (
              <Link
                href={`/properties/${enquiry.property.slug}`}
                className="ml-auto text-xs font-medium text-charcoal-900 underline-offset-4 hover:underline"
              >
                View property
              </Link>
            )}
          </div>
        </div>
      </div>

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogHeader
          title="Reply to enquiry"
          description={counterpart ? `Your reply goes to ${counterpart.name}.` : undefined}
        />
        <DialogBody>
          <Label htmlFor="reply-text">Message</Label>
          <Textarea
            id="reply-text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="min-h-40"
            placeholder="Share availability, pricing guidance or invite them to a viewing."
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setReplyOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => act("replied", reply)} loading={pending === "replied"} disabled={reply.trim().length < 2}>
            Send reply
          </Button>
        </DialogFooter>
      </Dialog>
    </li>
  );
}
