import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Prose } from "@/components/content/Prose";
import { ApiError } from "@/lib/api/client";
import { getServiceDetail } from "@/lib/api/services";

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
  const detail = await load(regionSlug, serviceSlug);
  if (!detail) notFound();

  // These carry defaults in the schema, so they generate as optional.
  // Normalising once here keeps the markup below free of guards.
  const bullets = detail.details ?? [];
  const subcategories = detail.subcategories ?? [];
  const otherRegions = detail.other_regions ?? [];

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/services" className="hover:text-primary">
              Services
            </Link>
            <span aria-hidden> / </span>
            <Link href={`/services/${regionSlug}`} className="hover:text-primary">
              {regionSlug.toUpperCase()}
            </Link>
            <span aria-hidden> / </span>
            <span>{detail.name}</span>
          </nav>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{detail.name}</h1>
          {detail.short_description && (
            <p className="mt-4 max-w-2xl text-lg text-muted">{detail.short_description}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Prose body={detail.long_description} />

        {bullets.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">What this includes</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {bullets.map((item, index) => (
                <li key={index} className="flex gap-3 text-muted">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {subcategories.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">Specific services</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {subcategories.map((name, index) => (
                <li
                  key={index}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted"
                >
                  {name}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 rounded-lg border border-border bg-surface p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {detail.cta_label ?? "Discuss your requirements"}
          </h2>
          <p className="mt-2 text-muted">
            Tell us what you need and a member of the team will get back to you.
          </p>
          <Link
            href={detail.cta_url ?? "/contact"}
            className="mt-5 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Make an enquiry
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
                    className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
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
