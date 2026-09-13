/**
 * Admin API wrappers.
 *
 * Thin by design: the interesting logic is server-side. These run from client
 * components, which is why they go through `apiFetch` — it attaches the
 * in-memory access token and sends the refresh cookie.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

// --- Content blocks -----------------------------------------------------------

export type ContentBlock = Json<
  ApiPaths["/api/v1/admin/content/blocks"]["get"]["responses"][200]
>[number];

export type ContentListItem = Json<
  ApiPaths["/api/v1/admin/content/list-items"]["get"]["responses"][200]
>[number];

export const listBlocks = () => apiFetch<ContentBlock[]>("/admin/content/blocks");

export const getBlock = (key: string) =>
  apiFetch<ContentBlock>(`/admin/content/blocks/${encodeURIComponent(key)}`);

export const updateBlock = (key: string, body: Record<string, unknown>) =>
  apiFetch<ContentBlock>(`/admin/content/blocks/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body,
  });

export const listBlockItems = (blockKey: string) =>
  apiFetch<ContentListItem[]>(
    `/admin/content/list-items?block_key=${encodeURIComponent(blockKey)}`,
  );

export const createBlockItem = (body: Record<string, unknown>) =>
  apiFetch<ContentListItem>("/admin/content/list-items", { method: "POST", body });

export const updateBlockItem = (id: string, body: Record<string, unknown>) =>
  apiFetch<ContentListItem>(`/admin/content/list-items/${id}`, { method: "PATCH", body });

export const deleteBlockItem = (id: string) =>
  apiFetch<void>(`/admin/content/list-items/${id}`, { method: "DELETE" });

// --- Generic ordered collections ----------------------------------------------

export interface CollectionRow {
  id: string;
  sort_order: number;
  is_published?: boolean;
  [key: string]: unknown;
}

export const listCollection = (path: string) =>
  apiFetch<CollectionRow[]>(`/admin/content/${path}`);

export const createCollectionRow = (path: string, body: Record<string, unknown>) =>
  apiFetch<CollectionRow>(`/admin/content/${path}`, { method: "POST", body });

export const updateCollectionRow = (
  path: string,
  id: string,
  body: Record<string, unknown>,
) => apiFetch<CollectionRow>(`/admin/content/${path}/${id}`, { method: "PATCH", body });

export const deleteCollectionRow = (path: string, id: string) =>
  apiFetch<void>(`/admin/content/${path}/${id}`, { method: "DELETE" });

export const reorderCollection = (path: string, ids: string[]) =>
  apiFetch<CollectionRow[]>(`/admin/content/${path}/reorder`, {
    method: "POST",
    body: { ids },
  });

// --- Legal pages ---------------------------------------------------------------

export type LegalPage = Json<
  ApiPaths["/api/v1/admin/content/legal"]["get"]["responses"][200]
>[number];

export const listLegal = () => apiFetch<LegalPage[]>("/admin/content/legal");

export const getLegal = (slug: string) =>
  apiFetch<LegalPage>(`/admin/content/legal/${encodeURIComponent(slug)}`);

export const updateLegal = (slug: string, body: Record<string, unknown>) =>
  apiFetch<LegalPage>(`/admin/content/legal/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body,
  });

// --- Services -------------------------------------------------------------------

export type AdminService = Json<
  ApiPaths["/api/v1/admin/services"]["get"]["responses"][200]
>[number];

export type ServiceDetailBullet = Json<
  ApiPaths["/api/v1/admin/services/{category_id}/details"]["get"]["responses"][200]
>[number];

export type ServiceSubcategory = Json<
  ApiPaths["/api/v1/admin/services/{category_id}/subcategories"]["get"]["responses"][200]
>[number];

export type AvailabilityGrid = Json<
  ApiPaths["/api/v1/admin/services/{category_id}/availability"]["get"]["responses"][200]
>;

export type AdminRegion = Json<
  ApiPaths["/api/v1/admin/regions"]["get"]["responses"][200]
>[number];

export const listServices = (includeArchived = false) =>
  apiFetch<AdminService[]>(
    `/admin/services${includeArchived ? "?include_archived=true" : ""}`,
  );

export const getService = (id: string) => apiFetch<AdminService>(`/admin/services/${id}`);

export const createService = (body: Record<string, unknown>) =>
  apiFetch<AdminService>("/admin/services", { method: "POST", body });

export const updateService = (id: string, body: Record<string, unknown>) =>
  apiFetch<AdminService>(`/admin/services/${id}`, { method: "PATCH", body });

/** Archives by default. `hard` is refused while any task references it. */
export const archiveService = (id: string, hard = false) =>
  apiFetch<AdminService>(`/admin/services/${id}${hard ? "?hard=true" : ""}`, {
    method: "DELETE",
  });

export const restoreService = (id: string) =>
  apiFetch<AdminService>(`/admin/services/${id}/restore`, { method: "POST" });

export const reorderServices = (ids: string[]) =>
  apiFetch<AdminService[]>("/admin/services/reorder", { method: "POST", body: { ids } });

export const listServiceDetails = (id: string) =>
  apiFetch<ServiceDetailBullet[]>(`/admin/services/${id}/details`);

export const createServiceDetail = (id: string, body: Record<string, unknown>) =>
  apiFetch<ServiceDetailBullet>(`/admin/services/${id}/details`, { method: "POST", body });

export const deleteServiceDetail = (detailId: string) =>
  apiFetch<void>(`/admin/services/details/${detailId}`, { method: "DELETE" });

export const listSubcategories = (id: string) =>
  apiFetch<ServiceSubcategory[]>(`/admin/services/${id}/subcategories`);

export const createSubcategory = (id: string, body: Record<string, unknown>) =>
  apiFetch<ServiceSubcategory>(`/admin/services/${id}/subcategories`, {
    method: "POST",
    body,
  });

export const updateSubcategory = (subId: string, body: Record<string, unknown>) =>
  apiFetch<ServiceSubcategory>(`/admin/services/subcategories/${subId}`, {
    method: "PATCH",
    body,
  });

export const archiveSubcategory = (subId: string) =>
  apiFetch<ServiceSubcategory>(`/admin/services/subcategories/${subId}`, {
    method: "DELETE",
  });

export const getAvailability = (id: string) =>
  apiFetch<AvailabilityGrid>(`/admin/services/${id}/availability`);

export const setAvailability = (
  id: string,
  regionId: string,
  body: Record<string, unknown>,
) =>
  apiFetch<unknown>(`/admin/services/${id}/availability/${regionId}`, {
    method: "PUT",
    body,
  });

export const listAdminRegions = () => apiFetch<AdminRegion[]>("/admin/regions");

export const createRegion = (body: Record<string, unknown>) =>
  apiFetch<AdminRegion>("/admin/regions", { method: "POST", body });

export const updateRegion = (id: string, body: Record<string, unknown>) =>
  apiFetch<AdminRegion>(`/admin/regions/${id}`, { method: "PATCH", body });

export const deleteRegion = (id: string) =>
  apiFetch<void>(`/admin/regions/${id}`, { method: "DELETE" });

// --- Enquiries -------------------------------------------------------------------

export type Enquiry = Json<
  ApiPaths["/api/v1/admin/enquiries"]["get"]["responses"][200]
>[number];

export type FormFieldRow = Json<
  ApiPaths["/api/v1/admin/forms/{form_key}"]["get"]["responses"][200]
>["fields"][number];

export const listEnquiries = (handled?: boolean) =>
  apiFetch<Enquiry[]>(
    `/admin/enquiries${handled === undefined ? "" : `?handled=${handled}`}`,
  );

export const updateEnquiry = (id: string, body: Record<string, unknown>) =>
  apiFetch<Enquiry>(`/admin/enquiries/${id}`, { method: "PATCH", body });

export const getAdminForm = (formKey: string) =>
  apiFetch<{ key: string; name: string; description: string | null; fields: FormFieldRow[] }>(
    `/admin/forms/${encodeURIComponent(formKey)}`,
  );

export const createFormField = (formKey: string, body: Record<string, unknown>) =>
  apiFetch<FormFieldRow>(`/admin/forms/${encodeURIComponent(formKey)}/fields`, {
    method: "POST",
    body,
  });

export const updateFormField = (fieldId: string, body: Record<string, unknown>) =>
  apiFetch<FormFieldRow>(`/admin/forms/fields/${fieldId}`, { method: "PATCH", body });

export const deactivateFormField = (fieldId: string) =>
  apiFetch<FormFieldRow>(`/admin/forms/fields/${fieldId}`, { method: "DELETE" });

// --- FAQ and chat transcripts ------------------------------------------------------

export type FaqEntry = Json<
  ApiPaths["/api/v1/admin/faq"]["get"]["responses"][200]
>[number];

export type FaqIndexStatus = Json<
  ApiPaths["/api/v1/admin/faq-index/status"]["get"]["responses"][200]
>;

export type ChatSessionSummary = Json<
  ApiPaths["/api/v1/admin/chat-sessions"]["get"]["responses"][200]
>[number];

export type ChatSessionDetail = Json<
  ApiPaths["/api/v1/admin/chat-sessions/{session_id}"]["get"]["responses"][200]
>;

export const listFaq = (includeDeleted = false) =>
  apiFetch<FaqEntry[]>(`/admin/faq${includeDeleted ? "?include_deleted=true" : ""}`);

export const createFaq = (body: Record<string, unknown>) =>
  apiFetch<FaqEntry>("/admin/faq", { method: "POST", body });

export const updateFaq = (id: string, body: Record<string, unknown>) =>
  apiFetch<FaqEntry>(`/admin/faq/${id}`, { method: "PATCH", body });

export const deleteFaq = (id: string) =>
  apiFetch<FaqEntry>(`/admin/faq/${id}`, { method: "DELETE" });

export const restoreFaq = (id: string) =>
  apiFetch<FaqEntry>(`/admin/faq/${id}/restore`, { method: "POST" });

export const getFaqIndexStatus = () =>
  apiFetch<FaqIndexStatus>("/admin/faq-index/status");

export const listChatSessions = (escalatedOnly = false) =>
  apiFetch<ChatSessionSummary[]>(
    `/admin/chat-sessions${escalatedOnly ? "?escalated_only=true" : ""}`,
  );

export const getChatSession = (id: string) =>
  apiFetch<ChatSessionDetail>(`/admin/chat-sessions/${id}`);

// --- Clients, staff and invitations -------------------------------------------------

export type ClientSummary = Json<
  ApiPaths["/api/v1/admin/clients"]["get"]["responses"][200]
>[number];

export type ClientDetail = Json<
  ApiPaths["/api/v1/admin/clients/{client_id}"]["get"]["responses"][200]
>;

export type StaffSummary = Json<
  ApiPaths["/api/v1/admin/staff"]["get"]["responses"][200]
>[number];

export type AuditEntry = Json<
  ApiPaths["/api/v1/admin/clients/{client_id}/audit"]["get"]["responses"][200]
>[number];

export type ClientStatus = ClientSummary["status"];
// `services` has a default server-side, so it generates as optional.
export type ClientService = NonNullable<ClientSummary["services"]>[number];

export type ClientFilterOptions = Json<
  ApiPaths["/api/v1/admin/client-filters"]["get"]["responses"][200]
>;

export interface ClientFilters {
  status?: ClientStatus | "";
  managerId?: string;
  unassigned?: boolean;
  serviceId?: string;
  country?: string;
  search?: string;
}

export function listClients(filters: ClientFilters = {}): Promise<ClientSummary[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.unassigned) params.set("unassigned", "true");
  else if (filters.managerId) params.set("manager_id", filters.managerId);
  if (filters.serviceId) params.set("service_id", filters.serviceId);
  if (filters.country) params.set("country", filters.country);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return apiFetch<ClientSummary[]>(`/admin/clients${query ? `?${query}` : ""}`);
}

/** The countries and services worth filtering by — scoped like the list itself. */
export const listClientFilterOptions = () =>
  apiFetch<ClientFilterOptions>("/admin/client-filters");

/** Replaces the whole set. An empty array clears them. */
export const setClientServices = (id: string, serviceIds: string[]) =>
  apiFetch<ClientDetail>(`/admin/clients/${id}`, {
    method: "PATCH",
    body: { service_ids: serviceIds },
  });

export const getClient = (id: string) =>
  apiFetch<ClientDetail>(`/admin/clients/${id}`);

export const updateClient = (id: string, body: Record<string, unknown>) =>
  apiFetch<ClientDetail>(`/admin/clients/${id}`, { method: "PATCH", body });

export const setClientStatus = (id: string, status: string, note: string) =>
  apiFetch<ClientDetail>(`/admin/clients/${id}/status`, {
    method: "POST",
    body: { status, note },
  });

export const assignManager = (id: string, managerId: string | null, note?: string) =>
  apiFetch<ClientDetail>(`/admin/clients/${id}/manager`, {
    method: "POST",
    body: { manager_id: managerId, note: note ?? null },
  });

export const listClientAudit = (id: string) =>
  apiFetch<AuditEntry[]>(`/admin/clients/${id}/audit`);

export const listStaff = (managersOnly = true) =>
  apiFetch<StaffSummary[]>(`/admin/staff?managers_only=${managersOnly}`);

/**
 * Tag a manager to exactly this set of clients.
 *
 * Replaces rather than adds — a client left out is taken off them. The server
 * writes only the differences, so re-saving an unchanged set records nothing.
 */
export const setManagerClients = (
  managerId: string,
  clientIds: string[],
  note?: string,
) =>
  apiFetch<ClientSummary[]>(`/admin/staff/${managerId}/clients`, {
    method: "PUT",
    body: { client_ids: clientIds, note: note?.trim() || null },
  });

// --- Invitations -------------------------------------------------------------------

export type Invite = Json<
  ApiPaths["/api/v1/admin/invites"]["get"]["responses"][200]
>[number];

export type InviteCreated = Json<
  ApiPaths["/api/v1/admin/invites"]["post"]["responses"][201]
>;

export const listInvites = () => apiFetch<Invite[]>("/admin/invites");

export const createInvite = (body: Record<string, unknown>) =>
  apiFetch<InviteCreated>("/admin/invites", { method: "POST", body });

export const revokeInvite = (id: string) =>
  apiFetch<Invite>(`/admin/invites/${id}/revoke`, { method: "POST" });

export const resendInvite = (id: string) =>
  apiFetch<InviteCreated>(`/admin/invites/${id}/resend`, { method: "POST" });

// --- Settings ---------------------------------------------------------------------

export type SettingGroup = Json<
  ApiPaths["/api/v1/admin/settings"]["get"]["responses"][200]
>[number];

export type Setting = SettingGroup["settings"][number];

export const listSettings = () => apiFetch<SettingGroup[]>("/admin/settings");

export const updateSetting = (key: string, value: unknown) =>
  apiFetch<Setting>(`/admin/settings/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: { value },
  });
