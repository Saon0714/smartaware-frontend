import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/content/Prose";
import { getServiceHub } from "@/lib/api/services";

export const revalidate = 300;

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
 * than to a global page — the first published region (the UK, our primary
 * market) when a service is offered there, otherwise the first market that
 * does offer it, so no card ever points at a 404.
 */
export default async function ServicesPage() {
  const hub = await getServiceHub();
  const regionBySlug = new Map(hub.regions.map((region) => [region.slug, region]));

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight">Our Services</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Tax, accounting and compliance support for individuals and
            businesses. Services vary by market — choose a country to see what
            we offer there.
          </p>

          <nav aria-label="Markets" className="mt-8 flex flex-wrap gap-3">
            {hub.regions.map((region) => (
              <Link
                key={region.id}
                href={`/services/${region.slug}`}
                className="rounded-md border border-border bg-bg px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {region.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <Section title="All services">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hub.categories.map((category) => {
            const target = category.region_slugs?.[0];
            const markets = (category.region_slugs ?? [])
              .map((slug) => regionBySlug.get(slug)?.name)
              .filter(Boolean);

            const card = (
              <>
                <h2 className="font-medium">{category.name}</h2>
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
                    className="flex h-full flex-col rounded-lg border border-border p-5 transition-colors hover:border-primary"
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
