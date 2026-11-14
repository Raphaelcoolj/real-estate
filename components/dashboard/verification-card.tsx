"use client";

import { requestVerificationAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function VerificationCard({
  status,
  profileComplete,
}: {
  status: string;
  profileComplete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const request = () => {
    startTransition(async () => {
      const result = await requestVerificationAction();
      if (!result.ok) toast(result.error, "error");
      else {
        toast("Verification requested — our team will review shortly", "success");
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-ivory-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-charcoal-900">Verification</h2>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-stone-500">
            Verified agents display a badge across the marketplace. Verification requires a complete
            profile, identity check and licence where applicable.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status !== "verified" && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ivory-200 pt-5">
          <Button
            size="sm"
            variant={status === "pending" ? "outline" : "primary"}
            onClick={request}
            loading={pending}
            disabled={status === "pending" || !profileComplete}
          >
            {status === "pending" ? "Under review" : status === "rejected" ? "Request re-review" : "Request verification"}
          </Button>
          {!profileComplete && (
            <p className="text-xs text-stone-400">Complete your professional details to apply.</p>
          )}
        </div>
      )}
    </div>
  );
}
