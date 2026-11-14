import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-charcoal-900 text-ivory-50 hover:bg-charcoal-800 active:bg-charcoal-950 shadow-soft",
  accent: "bg-brass-500 text-charcoal-950 hover:bg-brass-400 active:bg-brass-600 shadow-soft",
  outline:
    "border border-stone-300 bg-transparent text-charcoal-900 hover:border-charcoal-900 hover:bg-ivory-100",
  ghost: "bg-transparent text-charcoal-800 hover:bg-ivory-200/70",
  danger: "bg-rust-600 text-ivory-50 hover:bg-rust-500",
  link: "bg-transparent text-charcoal-900 underline-offset-4 hover:underline px-0",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.9375rem]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.03em] transition-all duration-300 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant = "primary", size = "md", href, children, ...props },
  ref
) {
  return (
    <Link ref={ref} href={href} className={buttonStyles({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
});
