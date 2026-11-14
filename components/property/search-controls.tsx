"use client";

import type { FilterState } from "@/components/property/filter-panel";
import { MobileFilters } from "@/components/property/mobile-filters";
import { SearchToolbar } from "@/components/property/search-toolbar";
import { useState } from "react";

export function SearchControls({
  total,
  current,
  filterCount,
}: {
  total: number;
  current: FilterState;
  filterCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SearchToolbar total={total} onOpenFilters={() => setOpen(true)} filterCount={filterCount} />
      <MobileFilters current={current} open={open} onOpenChange={setOpen} />
    </>
  );
}
