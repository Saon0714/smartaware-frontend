"use client";

import Link from "next/link";

import { useAsync } from "@/components/admin/useAsync";
import { Badge, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { listLegal } from "@/lib/api/admin";

export default function LegalListPage() {
  const { data, error, loading } = useAsync(listLegal);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content" className="hover:text-primary">
          Website Content
        </Link>
        <span aria-hidden> / </span>
        <span>Legal Pages</span>
      </nav>

      <PageHeader
        title="Legal Pages"
        description="These describe SmartAWARE's actual practices and should be reviewed by your advisers before publishing."
      />

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}
      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <ul className="mt-6 space-y-2">
        {(data ?? []).map((page) => (
          <li key={page.id}>
            <Link
              href={`/admin/content/legal/${page.slug}`}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{page.title}</p>
                  <Badge tone={page.is_published ? "success" : "warning"}>
                    {page.is_published ? "Published" : "Not published"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{page.body}</p>
              </div>
              <span aria-hidden className="text-muted">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
