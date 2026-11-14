"use client";

/* ---------------------------------------------------------------------------
 * Toasts — lightweight in-app feedback for client-side action results.
 * ------------------------------------------------------------------------ */

import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted] = useState(() => typeof document !== "undefined");
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++counter.current;
      setToasts((list) => [...list, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lift reveal",
                t.tone === "success" && "bg-charcoal-900 text-ivory-50",
                t.tone === "error" && "bg-rust-600 text-ivory-50",
                t.tone === "info" && "bg-white text-charcoal-900 border border-ivory-200"
              )}
            >
              <span className="mt-0.5">
                {t.tone === "success" ? "✓" : t.tone === "error" ? "!" : "i"}
              </span>
              <span className="leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-1 opacity-60 transition-opacity hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
