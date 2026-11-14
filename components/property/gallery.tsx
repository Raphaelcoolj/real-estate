"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Gallery({
  images,
  title,
  className,
}: {
  images: string[];
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const safeImages = images.length ? images : ["/images/placeholder-property.svg"];

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, next, prev]);

  return (
    <>
      <div className={cn("grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl", className)}>
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative col-span-4 row-span-2 aspect-[16/10] overflow-hidden sm:col-span-2 sm:aspect-auto"
          aria-label="Open photo gallery"
        >
          <Image
            src={safeImages[0]!}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.03]"
          />
        </button>
        {safeImages.slice(1, 5).map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => openAt(i + 1)}
            className="group relative hidden overflow-hidden sm:block"
            aria-label={`Open photo ${i + 2}`}
          >
            <Image
              src={src}
              alt={`${title} — photo ${i + 2}`}
              fill
              sizes="20vw"
              className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
            />
          </button>
        ))}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-4 right-4 z-10 hidden items-center gap-2 rounded-full bg-white/92 px-4 py-2.5 text-xs font-semibold tracking-wide text-charcoal-900 shadow-soft backdrop-blur transition-colors hover:bg-white sm:flex"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
            <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
            <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
          </svg>
          View all {safeImages.length} photos
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex flex-col bg-charcoal-950/97 fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} gallery`}
          >
            <div className="flex items-center justify-between px-5 py-4 text-ivory-100">
              <span className="text-xs tracking-[0.16em] uppercase">
                {index + 1} / {safeImages.length}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close gallery"
                className="rounded-full p-2 text-ivory-200 transition-colors hover:bg-white/10"
              >
                <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-ivory-100 transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <div className="relative h-full w-full max-w-6xl">
                <Image
                  src={safeImages[index]!}
                  alt={`${title} — photo ${index + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              <button
                type="button"
                onClick={next}
                aria-label="Next photo"
                className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-ivory-100 transition-colors hover:bg-white/20"
              >
                <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-6 scrollbar-none">
              {safeImages.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-sm transition-opacity",
                    i === index ? "ring-2 ring-brass-500" : "opacity-50 hover:opacity-90"
                  )}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
