import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const inputBase =
  "w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-charcoal-900 placeholder:text-stone-400 " +
  "transition-colors duration-200 focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500/40 " +
  "disabled:bg-ivory-100 disabled:text-stone-500 aria-[invalid=true]:border-rust-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBase, "h-12", className)} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-32 resize-y leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(inputBase, "h-12 appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2 fill-none stroke-stone-500 stroke-[1.5]"
        >
          <path d="M1 1.5 6 6.5 11 1.5" />
        </svg>
      </div>
    );
  }
);

export function Label({
  className,
  children,
  htmlFor,
  hint,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className={cn("label-caps text-stone-600", className)}
      >
        {children}
      </label>
      {hint && <span className="text-xs text-stone-400">{hint}</span>}
    </div>
  );
}

export function FieldError({ error }: { error?: string[] | string }) {
  if (!error) return null;
  const message = Array.isArray(error) ? error[0] : error;
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-rust-600">
      {message}
    </p>
  );
}
