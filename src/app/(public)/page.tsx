import Link from "next/link";

import { IconTile, StrengthMark } from "@/components/brand/Icon";
import { PageHero } from "@/components/layout/PageHero";
import { Prose, Section } from "@/components/content/Prose";
import { getHomePage } from "@/lib/api/content";
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

export default async function HomePage() {
  // The market is resolved first: the teasers are scoped to it server-side, so
  // every card links to a service that market actually offers rather than to a
  // 404. Two round trips rather than one, and worth it for links that work.
  const { active } = await resolveRegion();
  const page = await getHomePage(active?.slug);

  // Cards link into the visitor's chosen market rather than to an anchor on the
  // hub, so "how we help" leads somewhere that already reflects their country.
  const serviceHref = (slug: string) =>
    active ? `/services/${active.slug}/${slug}` : `/services#${slug}`;

  return (
    <>
      <PageHero size="large">
          {page.hero?.title && (
            <h1
              className="sa-rise max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              {page.hero.title}
            </h1>
          )}
          {page.hero?.subtitle && (
            <p
              className="sa-rise mt-6 max-w-2xl text-lg text-muted sm:text-xl"
              style={{ animationDelay: "140ms" }}
            >
              {page.hero.subtitle}
            </p>
          )}

          <div className="sa-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
            <Link
              href="/contact"
              className="sa-press sa-arrow inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow-[var(--sa-shadow-brand)] hover:bg-primary-hover"
            >
              Make an enquiry
              <span className="sa-arrow-mark" aria-hidden>→</span>
            </Link>
            <Link
              href="/services"
              className="sa-press inline-flex items-center rounded-md border border-border bg-bg px-6 py-3 text-sm font-medium hover:border-primary hover:text-primary"
            >
              Our services
            </Link>
          </div>
      </PageHero>

      {page.services.length > 0 && (
        <Section title="How we help">
          <ul className="sa-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.services.map((service) => (
              <li key={service.id}>
                <Link
                  href={serviceHref(service.slug)}
                  className="sa-card sa-interactive group flex h-full flex-col rounded-lg border border-border bg-bg p-6"
                >
                  <IconTile name={service.icon_key} className="group-hover:scale-105" />
                  <h3 className="mt-4 font-medium transition-colors duration-200 group-hover:text-primary">
                    {service.name}
                  </h3>
                  {service.short_description && (
                    <p className="mt-2 text-sm text-muted">{service.short_description}</p>
                  )}
                  <span className="sa-arrow mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Learn more
                    <span className="sa-arrow-mark" aria-hidden>→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link href="/services" className="sa-link sa-arrow text-sm font-medium text-primary">
              View all services <span className="sa-arrow-mark" aria-hidden>→</span>
            </Link>
          </p>
        </Section>
      )}

      {page.achievements.length > 0 && (
        <Section tone="surface">
          <dl className="sa-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {page.achievements.map((item) => (
              <div key={item.id}>
                <dt className="text-sm text-muted">{item.label}</dt>
                <dd className="sa-gradient-text mt-1 text-4xl font-semibold">
                  {item.value}
                  {item.unit ? <span className="text-2xl">{item.unit}</span> : null}
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
          <ul className="sa-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.key_strengths.map((strength, index) => (
              // Not a link and not focusable. The lift on hover is there to
              // make the card feel alive under the cursor, and deliberately
              // stops short of a pointer cursor or any other affordance that
              // would promise somewhere to click.
              <li
                key={strength.id}
                className="sa-card group rounded-xl border border-border bg-bg p-6"
              >
                <StrengthMark iconKey={strength.icon_key} index={index} />
                <span aria-hidden className="sa-accent-bar mt-4" />
                <h3 className="mt-4 font-medium">{strength.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {strength.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.testimonials.length > 0 && (
        <Section title="What our clients say" tone="surface">
          <ul className="sa-stagger grid gap-6 md:grid-cols-2">
            {page.testimonials.map((quote) => (
              <li key={quote.id} className="sa-card rounded-lg border border-border bg-bg p-7">
                <span aria-hidden className="text-4xl leading-none text-primary/25">&ldquo;</span>
                <blockquote className="-mt-4 text-muted">{quote.quote}</blockquote>
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

      <section className="relative overflow-hidden border-t border-border">
        <div aria-hidden className="sa-hero-wash opacity-60" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="sa-rise text-3xl font-semibold sm:text-4xl">
            Let&apos;s talk about your <span className="sa-gradient-text">requirements</span>
          </h2>
          <Prose body={page.hero?.body} className="sa-rise mx-auto mt-4 max-w-2xl" />
          <Link
            href="/contact"
            className="sa-press sa-arrow sa-rise mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow-[var(--sa-shadow-brand)] hover:bg-primary-hover"
          >
            Get in touch
            <span className="sa-arrow-mark" aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
