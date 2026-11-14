"use client";

import { createEnquiryAction } from "@/actions/enquiry.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function EnquiryDialog({
  propertyId,
  propertyTitle,
  authed,
  agentName,
  trigger,
}: {
  propertyId: string;
  propertyTitle: string;
  authed: boolean;
  agentName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `I'm interested in ${propertyTitle}. Could you share more details and arrange a viewing?`
  );
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const start = () => {
    if (!authed) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    const result = await createEnquiryAction({ propertyId, message, phone });
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast(result.error, "error");
      return;
    }
    setOpen(false);
    toast(`Enquiry sent to ${agentName}`, "success");
    router.refresh();
  };

  return (
    <>
      <span onClick={start} className="contents">
        {trigger ?? (
          <Button variant="accent" size="lg" className="w-full">
            Contact agent
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Send an enquiry"
          description={`Message ${agentName} about this property.`}
        />
        <DialogBody className="space-y-5">
          <div>
            <Label htmlFor="enquiry-message">Your message</Label>
            <Textarea
              id="enquiry-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={3000}
              aria-invalid={Boolean(errors.message)}
            />
            <FieldError error={errors.message} />
          </div>
          <div>
            <Label htmlFor="enquiry-phone" hint="Optional">
              Phone number
            </Label>
            <Input
              id="enquiry-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 20 7946 0000"
              aria-invalid={Boolean(errors.phone)}
            />
            <FieldError error={errors.phone} />
          </div>
          <p className="text-xs leading-relaxed text-stone-400">
            Your name and email are shared with the agent so they can respond. By sending this
            enquiry you agree to our terms of use.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={message.trim().length < 10}>
            Send enquiry
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
