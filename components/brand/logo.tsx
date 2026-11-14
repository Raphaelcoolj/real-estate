import { cn } from "@/lib/utils";
import Link from "next/link";

/** Wordmark: serif letterforms with a brass diamond glyph. */
export function Logo({
  className,
  inverted = false,
  href = "/",
}: {
  className?: string;
  inverted?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Arcadia — home"
      className={cn(
        "group inline-flex items-baseline gap-2.5 transition-opacity hover:opacity-80",
        className
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-[0.62em] translate-y-[-0.08em] self-center text-brass-500"
        fill="currentColor"
      >
        <path d="M12 1.6 22.4 12 12 22.4 1.6 12 12 1.6Zm0 3.7L5.3 12l6.7 6.7 6.7-6.7L12 5.3Z" />
      </svg>
      <span
        className={cn(
          "font-serif text-[1.45rem] leading-none tracking-[0.24em] uppercase",
          inverted ? "text-ivory-50" : "text-charcoal-900"
        )}
      >
        Arcadia
      </span>
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-10 text-brass-500", className)} fill="currentColor">
      <path d="M24 2 46 24 24 46 2 24 24 2Zm0 8.4L10.4 24 24 37.6 37.6 24 24 10.4Z" />
      <path d="M24 16.8 31.2 24 24 31.2 16.8 24 24 16.8Z" opacity=".55" />
    </svg>
  );
}
