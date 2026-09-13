"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LogoLink } from "@/components/brand/Logo";

/**
 * Public site header.
 *
 * The navigation items and region list are hardcoded here only until the
 * content endpoints land in Chunk 3 — regions are rows in the database
 * precisely so this list stops being code.
 */

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <LogoLink variant="wordmark" height={38} priority />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface ${
                isActive(item.href) ? "font-medium text-primary" : "text-text"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login/client"
            className="hidden rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:inline-block"
          >
            Client Login
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-md border border-border p-2 md:hidden"
          >
            <span aria-hidden className="block h-0.5 w-5 bg-text" />
            <span aria-hidden className="mt-1 block h-0.5 w-5 bg-text" />
            <span aria-hidden className="mt-1 block h-0.5 w-5 bg-text" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-border bg-bg md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-sm hover:bg-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login/client"
                onClick={() => setMobileOpen(false)}
                className="mt-1 block rounded-md bg-primary px-2 py-2.5 text-center text-sm font-medium text-white"
              >
                Client Login
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
