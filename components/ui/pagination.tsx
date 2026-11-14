import { cn, paginationRange } from "@/lib/utils";
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath = "/properties",
  searchParams = {},
  className,
}: {
  page: number;
  totalPages: number;
  basePath?: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const items = paginationRange(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      <PageLink href={hrefFor(Math.max(1, page - 1))} disabled={page <= 1} label="Previous">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </PageLink>
      {items.map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-stone-400">
            …
          </span>
        ) : (
          <PageLink
            key={item}
            href={hrefFor(item)}
            active={item === page}
            label={`Page ${item}`}
          >
            {item}
          </PageLink>
        )
      )}
      <PageLink href={hrefFor(Math.min(totalPages, page + 1))} disabled={page >= totalPages} label="Next">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m6 3 5 5-5 5" />
        </svg>
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  label,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const className = cn(
    "flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm transition-all duration-200",
    active
      ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
      : "border-stone-200 bg-white text-stone-600 hover:border-charcoal-900 hover:text-charcoal-900",
    disabled && "pointer-events-none opacity-40"
  );
  if (disabled) {
    return (
      <span className={className} aria-label={label} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} aria-label={label} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
