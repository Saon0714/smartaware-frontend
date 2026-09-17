"use client";

import Link from "next/link";

import { SITE_PAGES, type ContentEntry } from "@/components/admin/contentMap";
import { Badge, PageHeader } from "@/components/ui/Controls";

/**
 * Content management hub, arranged the way the website is.
 *
 * Everything the public site renders is editable from here, which is the
 * point: the spec treats "no code changes to update content" as an
 * architectural constraint rather than a convenience. What it does not settle
 * is how to find any of it. Listing the collections — core values, key
 * strengths, milestones — asks the reader to already know which page each one
 * lands on. Listing them under the page they appear on does not.
 *
 * Several appear on two pages. They are shared rows rather than copies, so the
 * card says where else it shows and that one edit covers both; the alternative
 * is an editor changing a phone number twice, or worse, once.
 */
export default function ContentHubPage() {
  return (
    <div>
      <PageHeader
        title="Website Content"
        description="Edit anything the public site shows, section by section, in the order it appears. Changes go live without a deploy."
      />

      <nav aria-label="Jump to a page" className="mt-6 flex flex-wrap gap-2">
        {SITE_PAGES.map((page) => (
          <a
            key={page.id}
            href={`#${page.id}`}
            className="sa-press rounded-full border border-border bg-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
          >
            {page.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-12">
        {SITE_PAGES.map((page) => (
          <section key={page.id} id={page.id} className="scroll-mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{page.title}</h2>
              {page.href && (
                <a
                  href={page.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sa-link sa-arrow text-sm font-medium text-primary"
                >
                  View the page <span className="sa-arrow-mark" aria-hidden>↗</span>
                </a>
              )}
            </div>
            <span aria-hidden className="sa-accent-bar mt-2" />
            <p className="mt-3 max-w-3xl text-sm text-muted">{page.description}</p>

            <ol className="mt-5 grid gap-4 sm:grid-cols-2">
              {page.entries.map((entry) => (
                <li key={`${page.id}-${entry.href}`} className="flex">
                  <EntryCard entry={entry} />
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-border pt-6 text-sm text-muted">
        Prefer a flat list?{" "}
        <Link href="/admin/content/blocks" className="sa-link text-primary">
          Every section of page text in one place
        </Link>
        .
      </p>
    </div>
  );
}

function EntryCard({ entry }: { entry: ContentEntry }) {
  return (
    <Link
      href={entry.href}
      className="sa-card sa-interactive flex w-full flex-col rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)] transition-colors hover:border-primary"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{entry.title}</h3>
        {entry.elsewhere && <Badge>Managed separately</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">{entry.description}</p>

      {entry.alsoOn && (
        // Said plainly, because the failure this prevents is someone editing
        // one of two places and assuming the other needs doing as well.
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
          Also on {listToProse(entry.alsoOn)} — one entry,{" "}
          {entry.alsoOn.length > 1 ? "all of them" : "both places"}.
        </p>
      )}
    </Link>
  );
}

function listToProse(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
