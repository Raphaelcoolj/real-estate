import { cn } from "@/lib/utils";

/** Editorial section header with eyebrow, serif headline and optional link. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        {eyebrow && (
          <p className="eyebrow mb-4 flex items-center gap-3 text-brass-600">
            {align === "left" && <span aria-hidden className="h-px w-8 bg-brass-500/60" />}
            {eyebrow}
          </p>
        )}
        <h2 className="text-title font-serif text-charcoal-900 text-balance">{title}</h2>
        {description && (
          <p className="mt-4 text-[0.975rem] leading-relaxed text-stone-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
