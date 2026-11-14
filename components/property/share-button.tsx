"use client";

import { useToast } from "@/components/ui/toast";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy the link", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-medium text-charcoal-900 transition-colors hover:border-charcoal-900"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M8 1.5v9M4.5 5 8 1.5 11.5 5M2.5 9v5h11V9" />
      </svg>
      {copied ? "Copied" : "Share"}
    </button>
  );
}
