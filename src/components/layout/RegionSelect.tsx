"use client";

import { useEffect, useRef, useState } from "react";

import { useRegion } from "@/lib/region/RegionProvider";

/**
 * Market selector, beside the sign-in button.
 *
 * A real menu rather than a native <select>, so the brand mark and the active
 * tick can be shown — but it keeps the keyboard behaviour people expect from
 * one: Escape closes, focus returns to the trigger, and the open state is
 * announced.
 *
 * The choice is a display preference. It decides which country's services are
 * linked and what the enquiry form is pre-filled with; it never gates access to
 * anything.
 */
export function RegionSelect({ compact = false }: { compact?: boolean }) {
  const { regions, active, select } = useRegion();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (regions.length === 0) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: "var(--sa-gradient-brand)" }}
        />
        <span className={compact ? "" : "hidden sm:inline"}>
          {active?.name ?? "Choose a country"}
        </span>
        <span className="sr-only">
          Selected country: {active?.name ?? "none"}. Change country.
        </span>
        <span
          aria-hidden
          className="text-xs text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose a country"
          className="sa-panel-in absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-lg border border-border bg-bg shadow-[var(--sa-shadow-lg)]"
        >
          <p className="border-b border-border px-3 py-2 text-xs text-muted">
            Services vary by country
          </p>
          <ul className="py-1">
            {regions.map((region) => {
              const selected = region.slug === active?.slug;
              return (
                <li key={region.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      select(region.slug);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface ${
                      selected ? "font-medium text-primary" : ""
                    }`}
                  >
                    {region.name}
                    {selected && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
