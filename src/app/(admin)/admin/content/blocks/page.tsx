"use client";

import Link from "next/link";

import { useAsync } from "@/components/admin/useAsync";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { listBlocks } from "@/lib/api/admin";

export default function BlocksPage() {
  const { data, error, loading } = useAsync(listBlocks);
  const blocks = data ?? [];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content" className="hover:text-primary">
          Website Content
        </Link>
        <span aria-hidden> / </span>
        <span>Page Text</span>
      </nav>

      <PageHeader
        title="Page Text"
        description="Named sections of copy used across the public site. Sections cannot be added or removed here — page templates reference them by name."
      />

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}
      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!loading && blocks.length === 0 && (
        <div className="mt-6">
          <EmptyState>No content blocks found.</EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {blocks.map((block) => (
          <li key={block.id}>
            <Link
              href={`/admin/content/blocks/${block.key}`}
              className="flex items-start justify-between gap-4 sa-card sa-interactive sa-card rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{block.title ?? block.key}</p>
                  <Badge tone={block.is_published ? "success" : "neutral"}>
                    {block.is_published ? "Published" : "Hidden"}
                  </Badge>
                  {(block.items?.length ?? 0) > 0 && (
                    <Badge>{block.items!.length} bullets</Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{block.body}</p>
                <p className="mt-1 font-mono text-xs text-muted">{block.key}</p>
              </div>
              <span aria-hidden className="text-muted">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
