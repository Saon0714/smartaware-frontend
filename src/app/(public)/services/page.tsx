import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
import { getServiceHub } from "@/lib/api/services";
import { resolveRegion } from "@/lib/region/server";

/**
 * Rendered per request rather than prerendered at build time.
 *
 * These pages are assembled entirely from the API, so static generation would
 * make every build — including CI builds, preview deploys and rollbacks —
 * depend on a reachable backend, and fail outright when it is not. It would
 * also mean a content edit waited for the revalidation window before appearing.
 *
 * Server rendering still delivers complete HTML to crawlers, which is what the
 * SEO requirement actually needs. If traffic later justifies caching, a CDN
 * cache header or a move back to ISR is a small, isolated change.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Tax, accounting and compliance services from SmartAWARE across the United Kingdom, India, the UAE and Oman.",
};

/**
 * Services hub.
 *
 * Service pages are region-scoped, because the same category can be named and
 * offered differently per market. Cards therefore link into a market rather
 * than to a global page: the one chosen in the header when the service is
 * offered there, otherwise the first market that does offer it, so no card
 * ever points at a 404.
 */
export default async function ServicesPage() {
  const [hub, { active }] = await Promise.all([getServiceHub(), resolveRegion()]);
  const regionBySlug = new Map(hub.regions.map((region) => [region.slug, region]));

  return (
    <>
      <PageHero>
          <h1 className="sa-rise text-4xl font-semibold tracking-tight sm:text-5xl">
            Our Services
          </h1>
          <p className="sa-rise mt-4 max-w-2xl text-lg text-muted" style={{ animationDelay: "80ms" }}>
            Tax, accounting and compliance support for individuals and
            businesses. Services vary by market — choose a country to see what
            we offer there.
          </p>

          <nav
            aria-label="Markets"
            className="sa-rise mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: "160ms" }}
          >
            {hub.regions.map((region) => (
              <Link
                key={region.id}
                href={`/services/${region.slug}`}
                aria-current={region.slug === active?.slug ? "true" : undefined}
                className={`sa-press rounded-md border px-4 py-2.5 text-sm font-medium ${
                  region.slug === active?.slug
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-bg hover:border-primary hover:text-primary"
                }`}
              >
                {region.name}
              </Link>
            ))}
          </nav>
      </PageHero>

      <Section title="All services">
        <ul className="sa-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hub.categories.map((category) => {
            const available = category.region_slugs ?? [];
            const target =
              active && available.includes(active.slug) ? active.slug : available[0];
            const markets = available
              .map((slug) => regionBySlug.get(slug)?.name)
              .filter(Boolean);

            const card = (
              <>
                <h2 className="font-medium transition-colors duration-200 group-hover:text-primary">{category.name}</h2>
                {category.short_description && (
                  <p className="mt-2 text-sm text-muted">{category.short_description}</p>
                )}
                {markets.length > 0 && (
                  <p className="mt-3 text-xs text-muted">
                    Available in {markets.join(", ")}
                  </p>
                )}
              </>
            );

            return (
              <li key={category.id} id={category.slug} className="scroll-mt-24">
                {target ? (
                  <Link
                    href={`/services/${target}/${category.slug}`}
                    className="group flex h-full flex-col sa-card sa-interactive rounded-xl border border-border bg-bg p-5 transition-colors hover:border-primary"
                  >
                    {card}
                  </Link>
                ) : (
                  // Published but not yet switched on for any market. Shown for
                  // completeness, but not linked anywhere it would 404.
                  <div className="flex h-full flex-col rounded-lg border border-dashed border-border p-5">
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
