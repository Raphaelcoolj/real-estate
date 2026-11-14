import { cn } from "@/lib/utils";

export function DashboardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-2 text-brass-600">{eyebrow}</p>}
        <h1 className="font-serif text-title text-charcoal-900">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "dark";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        tone === "dark"
          ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
          : tone === "accent"
            ? "border-brass-400/40 bg-brass-300/15"
            : "border-ivory-200 bg-white"
      )}
    >
      <p
        className={cn(
          "text-[0.625rem] font-semibold tracking-[0.16em] uppercase",
          tone === "dark" ? "text-ivory-300/60" : "text-stone-400"
        )}
      >
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none">{value}</p>
      {hint && (
        <p className={cn("mt-2 text-[0.6875rem]", tone === "dark" ? "text-ivory-300/50" : "text-stone-400")}>
          {hint}
        </p>
      )}
    </div>
  );
}
