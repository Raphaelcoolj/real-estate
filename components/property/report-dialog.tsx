"use client";

import { createReportAction } from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { FieldError, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REPORT_REASONS } from "@/constants";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function ReportDialog({
  targetType,
  targetId,
  authed,
  label = "Report listing",
}: {
  targetType: "property" | "user" | "agency";
  targetId: string;
  authed: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]!.value);
  const [details, setDetails] = useState("");
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
    const result = await createReportAction({ targetType, targetId, reason, details });
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast(result.error, "error");
      return;
    }
    setOpen(false);
    setDetails("");
    toast("Thank you — our moderation team will review this", "success");
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="text-xs text-stone-400 underline-offset-4 transition-colors hover:text-rust-600 hover:underline"
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader
          title="Report a concern"
          description="Tell us what looks wrong and we'll investigate."
        />
        <DialogBody className="space-y-5">
          <div>
            <Label htmlFor="report-reason">Reason</Label>
            <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <FieldError error={errors.reason} />
          </div>
          <div>
            <Label htmlFor="report-details" hint="Optional">
              Additional details
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Share anything that helps us verify this report."
            />
            <FieldError error={errors.details} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={submitting}>
            Submit report
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
