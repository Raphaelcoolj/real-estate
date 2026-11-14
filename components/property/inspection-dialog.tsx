"use client";

import { requestInspectionAction } from "@/actions/inspection.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { INSPECTION_SLOTS } from "@/constants";
import { formatDate } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function InspectionDialog({
  propertyId,
  authed,
  trigger,
}: {
  propertyId: string;
  authed: boolean;
  trigger?: React.ReactNode;
}) {
  const minDate = useMemo(() => todayISO(), []);
  const [open, setOpen] = useState(false);
  const [preferredDate, setPreferredDate] = useState(addDays(minDate, 2));
  const [alternativeDate, setAlternativeDate] = useState(addDays(minDate, 4));
  const [slot, setSlot] = useState<string>(INSPECTION_SLOTS[2]!);
  const [message, setMessage] = useState("");
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
    const result = await requestInspectionAction({
      propertyId,
      preferredDate,
      alternativeDate: alternativeDate || "",
      slot,
      message,
    });
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast(result.error, "error");
      return;
    }
    setOpen(false);
    toast("Viewing request sent — the agent will confirm shortly", "success");
    router.refresh();
  };

  return (
    <>
      <span onClick={start} className="contents">
        {trigger ?? (
          <Button variant="outline" size="lg" className="w-full">
            Book a viewing
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Book a private viewing"
          description="Choose your preferred date and time. The agent will confirm availability."
        />
        <DialogBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="preferred-date">Preferred date</Label>
              <Input
                id="preferred-date"
                type="date"
                min={minDate}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                aria-invalid={Boolean(errors.preferredDate)}
              />
              <FieldError error={errors.preferredDate} />
            </div>
            <div>
              <Label htmlFor="alternative-date" hint="Optional">
                Alternative date
              </Label>
              <Input
                id="alternative-date"
                type="date"
                min={preferredDate || minDate}
                value={alternativeDate}
                onChange={(e) => setAlternativeDate(e.target.value)}
                aria-invalid={Boolean(errors.alternativeDate)}
              />
              <FieldError error={errors.alternativeDate} />
            </div>
          </div>
          <div>
            <Label htmlFor="inspection-slot">Time slot</Label>
            <Select
              id="inspection-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              aria-invalid={Boolean(errors.slot)}
            >
              {INSPECTION_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <FieldError error={errors.slot} />
          </div>
          <div>
            <Label htmlFor="inspection-message" hint="Optional">
              Notes for the agent
            </Label>
            <Textarea
              id="inspection-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything we should know before the viewing?"
              className="min-h-24"
            />
          </div>
          <p className="rounded-lg bg-ivory-100 px-4 py-3 text-xs leading-relaxed text-stone-500">
            Requesting {formatDate(preferredDate, { weekday: "long", day: "numeric", month: "long" })} at{" "}
            {slot}.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Request viewing
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
