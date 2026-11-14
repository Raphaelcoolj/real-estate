"use client";

import { reviewReportAction } from "@/actions/notification.actions";
import { StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REPORT_REASONS } from "@/constants";
import { relativeTime } from "@/lib/utils";
import type { ReportDTO } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
] as const;

const reasonLabel = (reason: string) =>
  REPORT_REASONS.find((option) => option.value === reason)?.label ?? reason.replace(/_/g, " ");

const targetHref = (report: ReportDTO) => {
  if (report.targetType === "property") return `/properties?q=${encodeURIComponent(report.targetLabel)}`;
  return null;
};

export function ReportList({ items }: { items: ReportDTO[] }) {
  return (
    <ul className="space-y-3">
      {items.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </ul>
  );
}

function ReportCard({ report }: { report: ReportDTO }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ReportDTO["status"]>(report.status);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const href = targetHref(report);

  const submit = async () => {
    setPending(true);
    const result = await reviewReportAction({ reportId: report.id, status, resolution });
    setPending(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Report updated", "success");
    setOpen(false);
    router.refresh();
  };

  return (
    <li className="rounded-xl border border-ivory-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-charcoal-900">{reasonLabel(report.reason)}</p>
            <StatusBadge status={report.status} />
            <span className="text-[0.625rem] tracking-[0.12em] text-stone-400 uppercase">{report.targetType}</span>
          </div>
          <p className="mt-1 truncate text-xs text-stone-500">
            {href ? (
              <a href={href} className="underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                {report.targetLabel}
              </a>
            ) : (
              report.targetLabel
            )}
          </p>
        </div>
        <span className="text-[0.6875rem] text-stone-400">{relativeTime(report.createdAt)}</span>
      </div>

      {report.details && (
        <p className="mt-3 rounded-lg bg-ivory-100 px-4 py-3 text-[0.8125rem] leading-relaxed text-stone-600">
          {report.details}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
        <span>Reported by {report.reporter?.name ?? "deleted member"}</span>
        {report.reporter?.email && <span>{report.reporter.email}</span>}
        {report.resolution && <span className="text-stone-600">Resolution: {report.resolution}</span>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Review
        </Button>
        {href && (
          <ButtonLink href={href} size="sm" variant="ghost" target="_blank" rel="noreferrer">
            Open target
          </ButtonLink>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="Review report" description="Update the case status and leave an optional resolution note." />
        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor={`status-${report.id}`}>Status</Label>
            <Select
              id={`status-${report.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as ReportDTO["status"])}
            >
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`resolution-${report.id}`} hint="Shared with the reporter when closed">
              Resolution note
            </Label>
            <Textarea
              id={`resolution-${report.id}`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="min-h-28"
              placeholder="Listing corrected after agent contact."
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </li>
  );
}
