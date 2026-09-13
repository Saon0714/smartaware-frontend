import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Prose } from "@/components/content/Prose";
import { PageHero } from "@/components/layout/PageHero";
import { ApiError } from "@/lib/api/client";
import { getLegalPage } from "@/lib/api/content";

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

/**
 * Legal pages — privacy policy, cookie policy, terms.
 *
 * A single catch-all route at the top level, so published pages live at clean
 * URLs like /privacy-policy. Only slugs the API reports as published resolve;
 * anything else 404s, which keeps unpublished drafts unreachable and stops this
 * route swallowing URLs that belong to real sections.
 */

async function loadPage(slug: string) {
  try {
    return await getLegalPage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legalSlug: string }>;
}): Promise<Metadata> {
  const { legalSlug } = await params;
  const page = await loadPage(legalSlug);
  return page ? { title: page.title } : {};
}

export default async function LegalPageRoute({
  params,
}: {
  params: Promise<{ legalSlug: string }>;
}) {
  const { legalSlug } = await params;
  const page = await loadPage(legalSlug);
  if (!page) notFound();

  return (
    <>
      <PageHero width="max-w-3xl">
        <h1 className="sa-rise text-3xl font-semibold tracking-tight sm:text-4xl">
          {page.title}
        </h1>
        {(page.version || page.effective_from) && (
          <p className="sa-rise mt-3 text-sm text-muted" style={{ animationDelay: "80ms" }}>
            {page.version ? `Version ${page.version}` : null}
            {page.version && page.effective_from ? " · " : null}
            {page.effective_from
              ? `Effective ${new Date(page.effective_from).toLocaleDateString("en-GB")}`
              : null}
          </p>
        )}
      </PageHero>

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Prose body={page.body} />
      </article>
    </>
  );
}
