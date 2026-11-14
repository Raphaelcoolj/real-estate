"use client";

import { cn } from "@/lib/utils";
import { useId, useState, type ReactNode } from "react";

export type TabItem = { value: string; label: string; count?: number; badge?: ReactNode };

export function Tabs({
  items,
  value,
  onChange,
  className,
  size = "md",
}: {
  items: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  size?: "md" | "sm";
}) {
  const [internal, setInternal] = useState(items[0]?.value ?? "");
  const active = value ?? internal;
  const id = useId();

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-full border border-ivory-300 bg-ivory-100 p-1 scrollbar-none",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => select(item.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full font-medium transition-all duration-300",
              size === "md" ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-xs",
              isActive
                ? "bg-white text-charcoal-900 shadow-soft"
                : "text-stone-500 hover:text-charcoal-900"
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold",
                  isActive ? "bg-brass-300/40 text-brass-700" : "bg-ivory-300 text-stone-500"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
      <span id={id} className="sr-only">
        tabs
      </span>
    </div>
  );
}
