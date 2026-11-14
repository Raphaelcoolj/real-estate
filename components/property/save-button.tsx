"use client";

import { toggleFavouriteAction } from "@/actions/engagement.actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SaveButton({
  propertyId,
  initialSaved,
  authed,
  variant = "icon",
  className,
}: {
  propertyId: string;
  initialSaved?: boolean;
  authed: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onClick = () => {
    if (!authed) {
      router.push(`/sign-in?next=${encodeURIComponent(`/properties`)}`);
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleFavouriteAction(propertyId);
      if (!result.ok) {
        setSaved(!next);
        toast(result.error, "error");
        return;
      }
      setSaved(result.data.favourite);
      toast(result.data.favourite ? "Saved to your collection" : "Removed from saved", "success");
      router.refresh();
    });
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-all",
          saved
            ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
            : "border-stone-300 text-charcoal-900 hover:border-charcoal-900",
          className
        )}
      >
        <Heart filled={saved} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save property"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-white/90 text-charcoal-900 shadow-soft backdrop-blur transition-all duration-300 hover:scale-105 hover:bg-white",
        className
      )}
    >
      <Heart filled={saved} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 18"
      className={cn("size-[1.05rem] transition-colors", filled ? "text-rust-500" : "text-current")}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M10 16.5C10 16.5 1.5 11.5 1.5 6.4 1.5 3.8 3.4 2 5.8 2c1.7 0 3.2.9 4.2 2.3C11 2.9 12.5 2 14.2 2c2.4 0 4.3 1.8 4.3 4.4 0 5.1-8.5 10.1-8.5 10.1Z" />
    </svg>
  );
}
