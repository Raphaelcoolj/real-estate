"use client";

/* ---------------------------------------------------------------------------
 * Dropdown menu — click-outside + escape dismissal, keyboard friendly.
 * ------------------------------------------------------------------------ */

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Dropdown({
  trigger,
  children,
  align = "end",
  width = "w-56",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  width?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 overflow-hidden rounded-xl border border-ivory-200 bg-white py-1.5 shadow-lift reveal",
            align === "end" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  href,
  danger,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  active?: boolean;
}) {
  const className = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
    danger ? "text-rust-600 hover:bg-rust-500/5" : "text-charcoal-800 hover:bg-ivory-100",
    active && "bg-ivory-100 font-medium"
  );
  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
