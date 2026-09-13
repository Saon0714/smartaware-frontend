import Link from "next/link";

import { Prose, Section } from "@/components/content/Prose";
import { getHomePage } from "@/lib/api/content";

/**
 * Homepage.
 *
 * A Server Component: content is fetched during rendering, so the HTML reaches
 * search engines fully populated. Nothing here is hardcoded — every string
 * comes from the database and is editable from the Admin Portal.
 */

// Content changes through the Admin Portal without a deploy, so the page is
// revalidated periodically rather than baked in at build time.
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

export default async function HomePage() {
  const page = await getHomePage();

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          {page.hero?.title && (
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {page.hero.title}
            </h1>
          )}
          {page.hero?.subtitle && (
            <p className="mt-5 max-w-2xl text-lg text-muted">{page.hero.subtitle}</p>
          )}
          <Prose body={page.hero?.body} className="mt-5 max-w-2xl" />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Make an enquiry
            </Link>
            <Link
              href="/services"
              className="rounded-md border border-border bg-bg px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
            >
              Our services
            </Link>
          </div>
        </div>
      </section>

      {page.services.length > 0 && (
        <Section title="How we help">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/services#${service.slug}`}
                  className="flex h-full flex-col rounded-lg border border-border p-5 transition-colors hover:border-primary"
                >
                  <h3 className="font-medium">{service.name}</h3>
                  {service.short_description && (
                    <p className="mt-2 text-sm text-muted">{service.short_description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            <Link href="/services" className="text-primary underline underline-offset-4">
              View all services
            </Link>
          </p>
        </Section>
      )}

      {page.achievements.length > 0 && (
        <Section tone="surface">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {page.achievements.map((item) => (
              <div key={item.id}>
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                  {item.value}
                  {item.unit ? <span className="text-xl">{item.unit}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {page.key_strengths.length > 0 && (
        <Section
          title="Why clients choose SmartAWARE"
          tone={page.achievements.length > 0 ? "default" : "surface"}
        >
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.key_strengths.map((strength) => (
              <li key={strength.id} className="rounded-lg border border-border p-5">
                <h3 className="font-medium">{strength.title}</h3>
                <p className="mt-2 text-sm text-muted">{strength.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.testimonials.length > 0 && (
        <Section title="What our clients say" tone="surface">
          <ul className="grid gap-6 md:grid-cols-2">
            {page.testimonials.map((quote) => (
              <li key={quote.id} className="rounded-lg border border-border bg-bg p-6">
                <blockquote className="text-muted">&ldquo;{quote.quote}&rdquo;</blockquote>
                <p className="mt-4 text-sm font-medium">
                  {quote.author_name}
                  {quote.author_company ? (
                    <span className="font-normal text-muted"> · {quote.author_company}</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
