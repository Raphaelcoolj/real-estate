"use client";

/* ---------------------------------------------------------------------------
 * Sheet — side/bottom drawer used for mobile navigation and filters.
 * ------------------------------------------------------------------------ */

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Side = "left" | "right" | "bottom";

const sideClasses: Record<Side, string> = {
  left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] -translate-x-full",
  right: "inset-y-0 right-0 h-full w-[min(24rem,92vw)] translate-x-full",
  bottom: "inset-x-0 bottom-0 max-h-[88dvh] w-full translate-y-full rounded-t-2xl",
};

const openClasses: Record<Side, string> = {
  left: "translate-x-0",
  right: "translate-x-0",
  bottom: "translate-y-0",
};

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: Side;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [mounted] = useState(() => typeof document !== "undefined");

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a, input, select, textarea")?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(timer);
      previousFocus.current?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")}
      aria-hidden={!open}
    >
      <div
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-charcoal-950/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute flex flex-col bg-white shadow-overlay transition-transform duration-400 ease-out",
          sideClasses[side],
          open && openClasses[side],
          className
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center justify-between border-b border-ivory-200 px-5 py-4">
          <h2 className="font-serif text-xl text-charcoal-900">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-ivory-100 hover:text-charcoal-900"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-ivory-200 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
