import { cn } from "@/lib/utils";

/** Compact page banner used by listing, agents and content pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "border-b border-ivory-200 bg-ivory-100/60",
        className
      )}
    >
      <div
        className={cn(
          "container-page py-12 md:py-16",
          align === "center" && "text-center"
        )}
      >
        {eyebrow && (
          <p className={cn("eyebrow mb-3 text-brass-600", align === "center" && "justify-center")}>
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-headline text-charcoal-900 text-balance">{title}</h1>
        {description && (
          <p
            className={cn(
              "mt-4 max-w-2xl text-[0.975rem] leading-relaxed text-stone-500",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
