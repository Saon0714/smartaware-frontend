import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { listLegalPages } from "@/lib/api/content";
import { listRegions } from "@/lib/api/services";

/**
 * Public site footer.
 *
 * Both the region list and the legal links are fetched rather than hardcoded,
 * so opening a market or publishing a policy is data entry. A footer link to an
 * unwritten privacy policy would be worse than no link.
 */

export async function SiteFooter() {
  // The footer renders on every page, including when the API is unreachable.
  // Losing these links is acceptable; taking the whole site down is not.
  const [legalPages, regions] = await Promise.all([
    listLegalPages().catch(() => []),
    listRegions().catch(() => []),
  ]);

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="full" height={64} />
          <p className="mt-4 max-w-sm text-sm text-muted">
            Professional tax, accounting and compliance advisory services for
            individuals and businesses in the United Kingdom, India, the UAE and
            Oman.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium">Services by region</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {regions.map((region) => (
              <li key={region.id}>
                <Link
                  href={`/services/${region.slug}`}
                  className="text-muted transition-colors hover:text-primary"
                >
                  {region.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium">Company</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-muted transition-colors hover:text-primary">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-muted transition-colors hover:text-primary">
                Contact Us
              </Link>
            </li>
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/${page.slug}`}
                  className="text-muted transition-colors hover:text-primary"
                >
                  {page.title}
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
