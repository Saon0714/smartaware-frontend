/**
 * Documents.
 *
 * Uploads go through the API rather than straight to S3: file type, size and
 * ownership are all checked server-side, and routing the bytes through means
 * there is never a stored object without a matching record.
 */

import { apiFetch, getAccessToken, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type ClientDocument = Json<
  ApiPaths["/api/v1/portal/documents"]["get"]["responses"][200]
>[number];

export type StaffDocument = Json<
  ApiPaths["/api/v1/admin/documents"]["get"]["responses"][200]
>[number];

export type DocumentCounts = Json<
  ApiPaths["/api/v1/portal/documents/counts"]["get"]["responses"][200]
>;

export type DownloadInfo = Json<
  ApiPaths["/api/v1/portal/documents/{document_id}/download"]["get"]["responses"][200]
>;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Multipart upload.
 *
 * Not routed through `apiFetch`, which JSON-encodes its body — the browser must
 * set its own multipart boundary, so Content-Type is left unset deliberately.
 */
async function uploadFile(path: string, form: FormData): Promise<unknown> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    method: "POST",
    headers,
    body: form,
    credentials: "include",
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : "Upload failed.";
    throw new Error(detail);
  }
  return payload;
}

// --- Client portal ------------------------------------------------------------------

export const listMyDocuments = () =>
  apiFetch<ClientDocument[]>("/portal/documents");

export const getMyDocumentCounts = () =>
  apiFetch<DocumentCounts>("/portal/documents/counts");

export const uploadMyDocument = (file: File, docType: "general" | "invoice") => {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_type", docType);
  return uploadFile("/portal/documents", form) as Promise<ClientDocument>;
};

// --- Staff -----------------------------------------------------------------------

export const listDocuments = (clientId?: string) =>
  apiFetch<StaffDocument[]>(
    `/admin/documents${clientId ? `?client_id=${clientId}` : ""}`,
  );

export const uploadForClient = (
  clientId: string,
  file: File,
  docType: "general" | "invoice",
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("client_id", clientId);
  form.append("doc_type", docType);
  return uploadFile("/admin/documents", form) as Promise<StaffDocument>;
};

export const archiveDocument = (id: string) =>
  apiFetch<StaffDocument>(`/admin/documents/${id}`, { method: "DELETE" });

// --- Download -----------------------------------------------------------------------

/**
 * Fetch the file and hand it to the browser.
 *
 * The backend either returns a short-lived signed URL (S3) or nothing, in which
 * case it streams the bytes. Both paths need the access token, so the download
 * cannot be a plain anchor href — a link would arrive unauthenticated.
 */
export async function downloadDocument(
  scope: "portal" | "admin",
  id: string,
  fileName: string,
): Promise<void> {
  const info = await apiFetch<DownloadInfo>(`/${scope}/documents/${id}/download`);

  if (info.url) {
    window.open(info.url, "_blank", "noopener,noreferrer");
    return;
  }

  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(
    `${BASE_URL}/api/v1/${scope}/documents/${id}/content`,
    { headers, credentials: "include" },
  );
  if (!response.ok) throw new Error("The file could not be downloaded.");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = info.file_name || fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Released on the next tick; revoking immediately can cancel the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
