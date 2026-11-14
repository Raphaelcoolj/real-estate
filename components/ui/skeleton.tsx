import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-stone-300 border-t-charcoal-900",
        className
      )}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-ivory-100/50 px-6 py-16 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-stone-400">{icon}</div>}
      <h3 className="font-serif text-2xl text-charcoal-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
