"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { UploadField } from "@/components/documents/UploadField";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import {
  downloadDocument, formatBytes, listMyDocuments, uploadMyDocument,
  type ClientDocument,
} from "@/lib/api/documents";

/**
 * The client's documents — spec Sections 5.3.E and 5.3.F.
 *
 * Both directions on one page, separated by who sent what, because that is the
 * distinction a client actually cares about: what they have provided, and what
 * SmartAWARE has given them.
 */
export default function MyDocumentsPage() {
  const documents = useAsync(listMyDocuments, "documents");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const all = documents.data ?? [];
  const sent = all.filter((d) => d.direction === "client_to_smartaware");
  const received = all.filter((d) => d.direction === "smartaware_to_client");

  async function handleUpload(file: File, docType: "general" | "invoice") {
    setBusy(true);
    setNotice(null);
    documents.setError(null);
    try {
      await uploadMyDocument(file, docType);
      await documents.reload();
      setNotice(`“${file.name}” uploaded. The SmartAWARE team has been notified.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Share documents with SmartAWARE and download what they have sent you."
      />

      {documents.error && (
        <div className="mt-4">
          <FormBanner tone="error">{documents.error}</FormBanner>
        </div>
      )}
      {notice && (
        <div className="mt-4">
          <FormBanner tone="info">{notice}</FormBanner>
        </div>
      )}

      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium">Upload a document</h2>
        <p className="mt-1 text-sm text-muted">
          Business, tax, accounting or supporting documents.
        </p>
        <div className="mt-4 max-w-md">
          <UploadField onUpload={handleUpload} busy={busy} />
        </div>
      </section>

      <DocumentList
        title="Sent to SmartAWARE"
        emptyText="You have not uploaded anything yet."
        documents={sent}
        loading={documents.loading}
        onError={(m) => documents.setError(m)}
      />

      <DocumentList
        title="Shared with you"
        emptyText="SmartAWARE has not shared any documents with you yet."
        documents={received}
        loading={documents.loading}
        onError={(m) => documents.setError(m)}
      />
    </div>
  );
}

function DocumentList({
  title,
  emptyText,
  documents,
  loading,
  onError,
}: {
  title: string;
  emptyText: string;
  documents: ClientDocument[];
  loading: boolean;
  onError: (message: string) => void;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

      {loading && <p className="mt-3 text-sm text-muted">Loading…</p>}
      {!loading && documents.length === 0 && (
        <div className="mt-3">
          <EmptyState>{emptyText}</EmptyState>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{document.file_name}</p>
                {document.doc_type === "invoice" && <Badge>Payment receipt</Badge>}
                {document.version > 1 && <Badge>Version {document.version}</Badge>}
                {document.is_superseded && (
                  <Badge tone="warning">Replaced by a newer version</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted">
                {new Date(document.created_at).toLocaleString("en-GB")} ·{" "}
                {formatBytes(document.size_bytes)}
                {document.uploaded_by_name ? ` · ${document.uploaded_by_name}` : ""}
              </p>
            </div>

            <Button
              variant="secondary"
              loading={downloading === document.id}
              onClick={async () => {
                setDownloading(document.id);
                try {
                  await downloadDocument("portal", document.id, document.file_name);
                } catch (err) {
                  onError(describeError(err));
                } finally {
                  setDownloading(null);
                }
              }}
            >
              Download
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
