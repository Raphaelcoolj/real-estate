"use client";

import { FilterPanel } from "@/components/property/filter-panel";
import { Sheet } from "@/components/ui/sheet";
import { useState } from "react";

export function MobileFilters({
  current,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  current: React.ComponentProps<typeof FilterPanel>["current"];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internal, setInternal] = useState(false);
  const open = controlledOpen ?? internal;
  const setOpen = onOpenChange ?? setInternal;

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen} side="left" title="Refine results">
        <FilterPanel current={current} onApplied={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
