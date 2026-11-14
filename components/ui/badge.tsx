import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "brass" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-ivory-200 text-stone-600 border-ivory-300",
  success: "bg-forest-500/10 text-forest-600 border-forest-500/20",
  warning: "bg-brass-300/25 text-brass-700 border-brass-400/40",
  danger: "bg-rust-500/10 text-rust-600 border-rust-500/20",
  brass: "bg-brass-500 text-charcoal-950 border-brass-500",
  dark: "bg-charcoal-900 text-ivory-50 border-charcoal-900",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone: Tone =
    status === "approved" || status === "confirmed" || status === "verified" || status === "active"
      ? "success"
      : status === "pending" || status === "requested" || status === "rescheduled" || status === "new" || status === "reviewing"
        ? "warning"
        : status === "rejected" || status === "declined" || status === "suspended" || status === "dismissed"
          ? "danger"
          : "neutral";
  return (
    <Badge tone={tone} dot>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
