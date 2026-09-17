import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { SocialIcon } from "@/components/brand/SocialIcon";
import { getContactPage, listLegalPages } from "@/lib/api/content";
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
  const [legalPages, regions, contact] = await Promise.all([
    listLegalPages().catch(() => []),
    listRegions().catch(() => []),
    getContactPage().catch(() => null),
  ]);

  // Everything the footer shows is published content, so an unpublished or
  // unsupplied detail simply does not appear rather than leaving a label with
  // nothing beside it. Departmental numbers belong on the Contact page, where
  // there is room to say which market each one is for.
  const details = (contact?.details ?? []).filter((d) => d.detail_type !== "department");
  const find = (type: string) => details.find((d) => d.detail_type === type);
  const address = find("address");
  const phone = find("phone");
  const email = find("email");
  const socials = contact?.social_links ?? [];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-border bg-surface">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "var(--sa-gradient-brand)", opacity: 0.5 }}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="full" height={64} />
          <p className="mt-4 max-w-sm text-sm text-muted">
            Professional tax, accounting and compliance advisory services for
            individuals and businesses in the United Kingdom, India, the UAE and
            Oman.
          </p>

          {/* Plain muted links, like every other column here. As bordered
              chips inheriting the body colour the marks rendered solid black,
              which made two social links the highest-contrast thing in a footer
              of grey text — more prominent than the address. */}
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {socials.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="sa-link inline-flex items-center gap-2 text-muted hover:text-primary"
                  >
                    <SocialIcon platform={link.platform} className="h-[18px] w-[18px]" />
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium">Contact</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted">
            {address && (
              <li className="whitespace-pre-line not-italic">{address.value}</li>
            )}
            {phone && (
              <li>
                <a
                  href={`tel:${phone.value.replace(/\s+/g, "")}`}
                  className="sa-link hover:text-primary"
                >
                  {phone.value}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email.value}`} className="sa-link hover:text-primary">
                  {email.value}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium">Services by region</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {regions.map((region) => (
              <li key={region.id}>
                <Link
                  href={`/services/${region.slug}`}
                  className="sa-link text-muted hover:text-primary"
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
              <Link href="/about" className="sa-link text-muted hover:text-primary">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="sa-link text-muted hover:text-primary">
                Contact Us
              </Link>
            </li>
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={`/${page.slug}`}
                  className="sa-link text-muted hover:text-primary"
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        {/* Extra space at the foot on small screens: the floating Smart AI
            launcher sits bottom-right and would otherwise cover this row. */}
        <div className="mx-auto max-w-6xl px-4 py-6 pb-20 text-xs text-muted sm:px-6 sm:pb-6">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>&copy; {new Date().getFullYear()} SmartAWARE. All rights reserved.</span>
            <span aria-hidden className="text-border">|</span>
            <span>
              Powered by{" "}
              <a
                href="https://adcompetence.com/"
                rel="noopener noreferrer"
                target="_blank"
                className="text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                AdCompetence
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
