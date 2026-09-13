import Link from "next/link";

import { Logo } from "@/components/brand/Logo";

/**
 * Public site footer.
 *
 * Contact details, region list and legal pages are all database-driven and
 * arrive via the API in Chunk 3. Nothing is invented here: the contact block
 * states that details are pending rather than showing a placeholder address
 * that could be mistaken for real.
 */

const REGIONS = [
  { slug: "uk", label: "United Kingdom" },
  { slug: "india", label: "India" },
  { slug: "uae", label: "United Arab Emirates" },
  { slug: "oman", label: "Oman" },
] as const;

const LEGAL = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="full" height={64} />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Professional tax, accounting and compliance advisory services for
            individuals and businesses in the United Kingdom, India, the UAE and
            Oman.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium">Services by region</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {REGIONS.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`/services/${region.slug}`}
                  className="text-muted transition-colors hover:text-primary"
                >
                  {region.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
          <p>&copy; {new Date().getFullYear()} SmartAWARE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
