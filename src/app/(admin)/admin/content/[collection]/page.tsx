"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";

import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { COLLECTIONS } from "@/components/admin/collections";

export default function CollectionPage() {
  const params = useParams<{ collection: string }>();
  const spec = COLLECTIONS[params.collection];
  if (!spec) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content" className="hover:text-primary">
          Website Content
        </Link>
        <span aria-hidden> / </span>
        <span>{spec.title}</span>
      </nav>
      <CollectionEditor spec={spec} />
    </div>
  );
}
