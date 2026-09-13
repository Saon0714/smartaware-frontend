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
