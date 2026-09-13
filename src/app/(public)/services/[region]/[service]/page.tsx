import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Prose } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
import { ApiError } from "@/lib/api/client";
import { getServiceDetail } from "@/lib/api/services";
import { enquiryHref } from "@/lib/enquiry/prefill";
import { RegionScope } from "@/lib/region/RegionProvider";
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

async function load(regionSlug: string, serviceSlug: string) {
  try {
    return await getServiceDetail(regionSlug, serviceSlug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string; service: string }>;
}): Promise<Metadata> {
  const { region, service } = await params;
  const detail = await load(region, service);
  if (!detail) return {};
  return {
    title: detail.meta_title ?? detail.name,
    description: detail.meta_description ?? detail.short_description ?? undefined,
  };
}

/**
 * Service detail, scoped to one market.
 *
 * These are the pages search traffic lands on, so they are server-rendered with
 * the market's own naming and wording already resolved. A service not offered
 * here 404s rather than showing a generic page, so a visitor is never told
 * about something SmartAWARE does not provide in their country.
 */
export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ region: string; service: string }>;
}) {
  const { region: regionSlug, service: serviceSlug } = await params;
  const [detail, { regions }] = await Promise.all([
    load(regionSlug, serviceSlug),
    resolveRegion(),
  ]);
  if (!detail) notFound();

  // These carry defaults in the schema, so they generate as optional.
  // Normalising once here keeps the markup below free of guards.
  const otherRegions = detail.other_regions ?? [];

  // The market being viewed, which is the one in the URL — not whatever the
  // header's country selector happens to be set to. Used for the breadcrumb
  // and to prefill Country on an enquiry; the names match the Country field's
  // options because both are the Region's name.
  const region = regions.find((candidate) => candidate.slug === regionSlug) ?? null;

  // The specific services under this category.
  //
  // Two admin-editable lists feed this: `subcategories`, which exists for
  // categories that are formally broken down, and `details`, the itemised
  // "what this includes" list that every seeded category actually uses. They
  // are the same thing to a visitor, so they are shown as one set, deduplicated
  // in case an editor enters an item in both. Trailing full stops are trimmed
  // because these read as headings here rather than as sentences in a list.
  const seen = new Set<string>();
  const subServices = [...(detail.subcategories ?? []), ...(detail.details ?? [])]
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <>
      {/* Tells the header's country selector where this service actually
          exists, so switching market never lands on a 404. */}
      <RegionScope slugs={[regionSlug, ...otherRegions.map((item) => item.slug)]} />

      <PageHero width="max-w-4xl">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/services" className="hover:text-primary">
              Services
            </Link>
            <span aria-hidden> / </span>
            <Link href={`/services/${regionSlug}`} className="hover:text-primary">
              {region?.name ?? regionSlug.toUpperCase()}
            </Link>
            <span aria-hidden> / </span>
            <span>{detail.name}</span>
          </nav>

          <h1 className="sa-rise mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {detail.name}
          </h1>
          {detail.short_description && (
            <p
              className="sa-rise mt-4 max-w-2xl text-lg text-muted"
              style={{ animationDelay: "80ms" }}
            >
              {detail.short_description}
            </p>
          )}
      </PageHero>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Prose body={detail.long_description} />

        {subServices.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold tracking-tight">What we provide</h2>
            <p className="mt-2 text-sm text-muted">
              Enquire about any of these and the form will already know what you
              were looking at — you can change it before sending.
            </p>
            <ul className="sa-stagger mt-6 grid gap-4 sm:grid-cols-2">
              {subServices.map((item) => (
                <li
                  key={item}
                  className="sa-card flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-bg p-5"
                >
                  <div className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "var(--sa-gradient-brand)" }}
                    />
                    <h3 className="font-medium leading-snug">{item}</h3>
                  </div>
                  <Link
                    href={enquiryHref({
                      service: detail.name,
                      subService: item,
                      country: region?.name,
                    })}
                    className="sa-press sa-arrow inline-flex w-fit items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                  >
                    Enquire
                    <span className="sa-arrow-mark" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 sa-card rounded-lg border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {detail.cta_label ?? "Discuss your requirements"}
          </h2>
          <p className="mt-2 text-muted">
            Tell us what you need and a member of the team will get back to you.
          </p>
          <Link
            href={
              detail.cta_url ??
              enquiryHref({ service: detail.name, country: region?.name })
            }
            className="sa-press sa-arrow mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white shadow-[var(--sa-shadow-brand)] hover:bg-primary-hover"
          >
            Make an enquiry
            <span className="sa-arrow-mark" aria-hidden>→</span>
          </Link>
        </section>

        {otherRegions.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-medium text-muted">
              Also available in
            </h2>
            <ul className="mt-3 flex flex-wrap gap-3">
              {otherRegions.map((region) => (
                <li key={region.id}>
                  <Link
                    href={`/services/${region.slug}/${detail.slug}`}
                    className="sa-press rounded-md border border-border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
                  >
                    {region.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
