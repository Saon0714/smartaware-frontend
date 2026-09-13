import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Prose } from "@/components/content/Prose";
import { ApiError } from "@/lib/api/client";
import { getLegalPage, listLegalPages } from "@/lib/api/content";

export const revalidate = 300;

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

export async function generateStaticParams() {
  try {
    const pages = await listLegalPages();
    return pages.map((page) => ({ legalSlug: page.slug }));
  } catch {
    // The backend may be unavailable at build time; these pages are rendered
    // on demand instead.
    return [];
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
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
      {(page.version || page.effective_from) && (
        <p className="mt-2 text-sm text-muted">
          {page.version ? `Version ${page.version}` : null}
          {page.version && page.effective_from ? " · " : null}
          {page.effective_from
            ? `Effective ${new Date(page.effective_from).toLocaleDateString("en-GB")}`
            : null}
        </p>
      )}
      <Prose body={page.body} className="mt-8" />
    </article>
  );
}
