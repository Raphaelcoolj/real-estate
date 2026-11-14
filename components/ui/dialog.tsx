"use client";

/* ---------------------------------------------------------------------------
 * Modal dialog — portal, escape/backdrop close, focus trap, scroll lock.
 * ------------------------------------------------------------------------ */

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolled;
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === document.body)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], input, textarea, select, button"
      );
      target?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      window.clearTimeout(focusTimer);
      previousFocus.current?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId, descriptionId }}>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-charcoal-950/55 backdrop-blur-[2px] fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
              "relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-overlay sm:max-w-lg sm:rounded-2xl",
              "reveal",
              className
            )}
          >
            {children}
          </div>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
}

export function DialogHeader({
  title,
  description,
  onClose,
}: {
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  const { titleId, descriptionId, setOpen } = useDialog();
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ivory-200 px-6 py-5">
      <div>
        <h2 id={titleId} className="font-serif text-2xl leading-tight text-charcoal-900">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-1 text-sm text-stone-500">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose ?? (() => setOpen(false))}
        aria-label="Close dialog"
        className="-mr-2 -mt-1 rounded-full p-2 text-stone-400 transition-colors hover:bg-ivory-100 hover:text-charcoal-900"
      >
        <svg viewBox="0 0 16 16" className="size-4 stroke-current" fill="none" strokeWidth="1.5">
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>
    </div>
  );
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-ivory-200 px-6 py-4 sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogTrigger({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
