"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { UploadField } from "@/components/documents/UploadField";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader, Select } from "@/components/ui/Controls";
import { FormBanner, Label } from "@/components/ui/Field";
import { listClients } from "@/lib/api/admin";
import {
  archiveDocument, downloadDocument, formatBytes, listDocuments, uploadForClient,
} from "@/lib/api/documents";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Staff document management.
 *
 * Uploading here shares a document with one client and emails them, so the
 * recipient is chosen explicitly rather than inferred from a filter — picking
 * the wrong client would send someone else's tax document to them.
 */
export default function DocumentsAdminPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const [clientFilter, setClientFilter] = useState("");
  const documents = useAsync(
    () => listDocuments(clientFilter || undefined),
    clientFilter,
  );
  const clients = useAsync(() => listClients(), "clients");

  const [uploadTarget, setUploadTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const rows = documents.data ?? [];

  async function run(action: () => Promise<unknown>, message?: string) {
    setBusy(true);
    documents.setError(null);
    setNotice(null);
    try {
      await action();
      await documents.reload();
      if (message) setNotice(message);
    } catch (err) {
      documents.setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  const targetName = clients.data?.find((c) => c.id === uploadTarget);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Documents clients have sent in, and documents shared with them."
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
        <h2 className="font-medium">Share a document with a client</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="target">
              Client<span className="text-danger"> *</span>
            </Label>
            <Select
              id="target"
              value={uploadTarget}
              onChange={(e) => setUploadTarget(e.target.value)}
            >
              <option value="">Choose a client…</option>
              {(clients.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name ?? c.user_email} ({c.client_ref})
                </option>
              ))}
            </Select>
            {uploadTarget && (
              <p className="mt-2 text-xs text-muted">
                Only{" "}
                <strong className="text-text">
                  {targetName?.company_name ?? targetName?.user_email}
                </strong>{" "}
                will be able to see this, and they will be emailed.
              </p>
            )}
          </div>

          {uploadTarget && (
            <div>
              <UploadField
                showDocType={false}
                label="File to share"
                busy={busy}
                onUpload={async (file) => {
                  await run(
                    () => uploadForClient(uploadTarget, file, "general"),
                    `“${file.name}” shared. The client has been notified.`,
                  );
                }}
              />
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <Label htmlFor="filter">Filter by client</Label>
        <div className="mt-1 max-w-sm">
          <Select
            id="filter"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="">All clients</option>
            {(clients.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name ?? c.user_email}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {documents.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!documents.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>No documents yet.</EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {rows.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{document.file_name}</p>
                <Badge
                  tone={
                    document.direction === "client_to_smartaware" ? "warning" : "neutral"
                  }
                >
                  {document.direction === "client_to_smartaware"
                    ? "From client"
                    : "Shared with client"}
                </Badge>
                {document.doc_type === "invoice" && <Badge>Payment receipt</Badge>}
                {document.version > 1 && <Badge>v{document.version}</Badge>}
                {document.is_superseded && <Badge tone="warning">Superseded</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted">
                {document.client_company_name ?? document.client_ref} ·{" "}
                {new Date(document.created_at).toLocaleString("en-GB")} ·{" "}
                {formatBytes(document.size_bytes)}
                {document.uploaded_by_name ? ` · ${document.uploaded_by_name}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                loading={downloading === document.id}
                onClick={async () => {
                  setDownloading(document.id);
                  try {
                    await downloadDocument("admin", document.id, document.file_name);
                  } catch (err) {
                    documents.setError(describeError(err));
                  } finally {
                    setDownloading(null);
                  }
                }}
              >
                Download
              </Button>
              {isAdmin && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Archive “${document.file_name}”? It is hidden from the client but kept as a record.`,
                      )
                    ) {
                      void run(() => archiveDocument(document.id));
                    }
                  }}
                >
                  Archive
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
