import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Section } from "@/components/content/Prose";
import { ApiError } from "@/lib/api/client";
import { getRegionServices } from "@/lib/api/services";

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

async function load(regionSlug: string) {
  try {
    return await getRegionServices(regionSlug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  const data = await load(region);
  if (!data) return {};
  return {
    title: data.region.meta_title ?? data.region.display_name,
    description:
      data.region.meta_description ??
      `SmartAWARE tax, accounting and compliance services in ${data.region.name}.`,
  };
}

/**
 * Country page.
 *
 * Lists only the services confirmed for this market, with that market's own
 * naming applied — the backend resolves overrides, so nothing here needs to
 * know one existed.
 */
export default async function RegionServicesPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionSlug } = await params;
  const data = await load(regionSlug);
  if (!data) notFound();

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/services" className="hover:text-primary">
              Services
            </Link>
            <span aria-hidden> / </span>
            <span>{data.region.name}</span>
          </nav>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {data.region.display_name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Services we offer to clients in {data.region.name}.
          </p>
        </div>
      </section>

      <Section>
        {data.services.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/services/${data.region.slug}/${service.slug}`}
                  className="flex h-full flex-col rounded-lg border border-border p-5 transition-colors hover:border-primary"
                >
                  <h2 className="font-medium">{service.name}</h2>
                  {service.short_description && (
                    <p className="mt-2 text-sm text-muted">{service.short_description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
            Services for this market are being confirmed. Please{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              contact us
            </Link>{" "}
            to discuss your requirements.
          </p>
        )}
      </Section>
    </>
  );
}
