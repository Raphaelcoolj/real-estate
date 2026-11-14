"use client";

import { addComparisonAction } from "@/actions/engagement.actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CompareButton({
  propertyId,
  authed,
  className,
}: {
  propertyId: string;
  authed: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!authed) {
      router.push(`/sign-in?next=${encodeURIComponent("/dashboard/comparisons")}`);
      return;
    }
    startTransition(async () => {
      const result = await addComparisonAction(propertyId);
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      if (result.data.added) {
        toast("Added to comparison", "success");
        router.refresh();
      } else {
        toast(result.data.message ?? "Already in comparison", "info");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium tracking-wide text-charcoal-800 transition-colors hover:text-brass-600 disabled:opacity-50",
        className
      )}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M2 12V6M6 12V3M10 12V8M14 12V2" />
      </svg>
      Compare
    </button>
  );
}
