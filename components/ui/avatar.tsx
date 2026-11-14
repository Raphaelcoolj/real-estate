import { cn, initials } from "@/lib/utils";
import Image from "next/image";

export function Avatar({
  name,
  src,
  size = 40,
  className,
  verified,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  verified?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full bg-gradient-to-br from-ivory-200 to-stone-200 font-medium text-charcoal-800"
          style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
        >
          {initials(name)}
        </span>
      )}
      {verified && (
        <span
          title="Verified"
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-white bg-forest-500 text-white"
          style={{ width: Math.max(14, size * 0.36), height: Math.max(14, size * 0.36) }}
        >
          <svg viewBox="0 0 12 12" className="size-2" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.8" />
          </svg>
        </span>
      )}
    </span>
  );
}
