/**
 * Invoices, and paying them through Wise.
 *
 * Payment is a redirect, so there is no callback and no webhook to listen for:
 * the portal hands over a URL and then waits for a person to say the money
 * arrived. Everything here reflects that — `payInvoice` returns somewhere to
 * send the browser, and nothing it returns claims an invoice is settled.
 */

import { apiFetch, getAccessToken, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type ClientInvoice = Json<
  ApiPaths["/api/v1/portal/invoices"]["get"]["responses"][200]
>[number];

export type StaffInvoice = Json<
  ApiPaths["/api/v1/admin/invoices"]["get"]["responses"][200]
>[number];

export type InvoiceCounts = Json<
  ApiPaths["/api/v1/portal/invoices/counts"]["get"]["responses"][200]
>;

export type PayLink = Json<
  ApiPaths["/api/v1/portal/invoices/{invoice_id}/pay"]["post"]["responses"][200]
>;

/** How an invoice reads on screen, which is not quite its payment status. */
export type InvoiceState = ClientInvoice["state"];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Multipart, so Content-Type is left for the browser to set with its boundary. */
async function uploadFile(path: string, file: File): Promise<unknown> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const form = new FormData();
  form.append("file", file);

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

export const listMyInvoices = () => apiFetch<ClientInvoice[]>("/portal/invoices");

export const getMyInvoiceCounts = () => apiFetch<InvoiceCounts>("/portal/invoices/counts");

export const payInvoice = (id: string) =>
  apiFetch<PayLink>(`/portal/invoices/${id}/pay`, { method: "POST" });

export const uploadReceipt = (id: string, file: File) =>
  uploadFile(`/portal/invoices/${id}/receipt`, file) as Promise<ClientInvoice>;

// --- Staff -----------------------------------------------------------------------

export const listInvoices = (params: { clientId?: string; status?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.clientId) query.set("client_id", params.clientId);
  if (params.status) query.set("status", params.status);
  const suffix = query.toString();
  return apiFetch<StaffInvoice[]>(`/admin/invoices${suffix ? `?${suffix}` : ""}`);
};

export const createInvoice = (body: {
  client_id: string;
  service_description: string;
  amount: string;
  currency: string;
  invoice_reference?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
  notes?: string | null;
}) => apiFetch<StaffInvoice>("/admin/invoices", { method: "POST", body });

export const updateInvoice = (id: string, body: Record<string, unknown>) =>
  apiFetch<StaffInvoice>(`/admin/invoices/${id}`, { method: "PATCH", body });

export const attachInvoiceDocument = (id: string, file: File) =>
  uploadFile(`/admin/invoices/${id}/document`, file) as Promise<StaffInvoice>;

export const markInvoicePaid = (
  id: string,
  body: { external_payment_ref?: string | null; note?: string | null },
) => apiFetch<StaffInvoice>(`/admin/invoices/${id}/mark-paid`, { method: "POST", body });

export const cancelInvoice = (id: string) =>
  apiFetch<StaffInvoice>(`/admin/invoices/${id}/cancel`, { method: "POST" });

// --- Shared presentation -------------------------------------------------------------

/** What each state is called, and how it should read. */
export const STATE_LABELS: Record<InvoiceState, string> = {
  unpaid: "Unpaid",
  overdue: "Overdue",
  awaiting_confirmation: "Awaiting confirmation",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const STATE_TONES: Record<InvoiceState, "neutral" | "success" | "warning" | "danger"> = {
  unpaid: "neutral",
  overdue: "danger",
  // Not a warning: the client has done their part and the wait is ours.
  awaiting_confirmation: "warning",
  paid: "success",
  cancelled: "neutral",
};

export function formatMoney(amount: string | number, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
  } catch {
    // An unknown code should still show the figure rather than nothing.
    return `${value.toFixed(2)} ${currency}`;
  }
}
