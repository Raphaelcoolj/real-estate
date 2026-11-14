import { cn } from "@/lib/utils";

export function BarList({
  items,
  total,
  emptyLabel = "No data yet",
  className,
}: {
  items: { label: string; value: number }[];
  total?: number;
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) {
    return <p className="py-6 text-sm text-stone-400">{emptyLabel}</p>;
  }
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate capitalize text-stone-600">{item.label.replace(/_/g, " ")}</span>
            <span className="font-medium text-charcoal-900">
              {item.value}
              {total ? <span className="ml-1 font-normal text-stone-400">/ {total}</span> : null}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ivory-200">
            <div
              className="h-full rounded-full bg-brass-500 transition-all duration-700"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({
  values,
  labels,
  className,
}: {
  values: number[];
  labels?: string[];
  className?: string;
}) {
  const width = 640;
  const height = 160;
  const padding = 8;
  if (!values.length) {
    return <p className="py-10 text-center text-sm text-stone-400">No activity recorded yet.</p>;
  }
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = padding + i * step;
    const y = height - padding - (v / max) * (height - padding * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8935a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#b8935a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#spark-fill)" />
        <polyline points={line} fill="none" stroke="#9a7845" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#1a1815" />
        ))}
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between text-[0.625rem] text-stone-400">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
