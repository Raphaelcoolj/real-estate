import { cn } from "@/lib/utils";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2 text-xs text-stone-500", className)}>
      <Link href="/" className="transition-colors hover:text-charcoal-900">
        Home
      </Link>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            <svg viewBox="0 0 12 12" className="size-2.5 stroke-stone-300" fill="none" strokeWidth="1.5">
              <path d="m4 2 4 4-4 4" />
            </svg>
            {last || !item.href ? (
              <span aria-current={last ? "page" : undefined} className="max-w-56 truncate text-charcoal-800">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-charcoal-900">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
