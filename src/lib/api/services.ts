/**
 * Typed wrappers for the public service catalogue.
 *
 * Called from Server Components so the service pages are server-rendered —
 * these are the SEO-valuable pages ("VAT services UK"), and they must reach a
 * crawler fully populated.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type Region = Json<
  ApiPaths["/api/v1/public/regions"]["get"]["responses"][200]
>[number];

export type ServiceHub = Json<
  ApiPaths["/api/v1/public/services"]["get"]["responses"][200]
>;
export type HubCategory = ServiceHub["categories"][number];

export type RegionServices = Json<
  ApiPaths["/api/v1/public/regions/{region_slug}/services"]["get"]["responses"][200]
>;
export type RegionalService = RegionServices["services"][number];

export type ServiceDetail = Json<
  ApiPaths["/api/v1/public/regions/{region_slug}/services/{service_slug}"]["get"]["responses"][200]
>;

export function listRegions(): Promise<Region[]> {
  return apiFetch<Region[]>("/public/regions");
}

export function getServiceHub(): Promise<ServiceHub> {
  return apiFetch<ServiceHub>("/public/services");
}

export function getRegionServices(regionSlug: string): Promise<RegionServices> {
  return apiFetch<RegionServices>(
    `/public/regions/${encodeURIComponent(regionSlug)}/services`,
  );
}

export function getServiceDetail(
  regionSlug: string,
  serviceSlug: string,
): Promise<ServiceDetail> {
  return apiFetch<ServiceDetail>(
    `/public/regions/${encodeURIComponent(regionSlug)}/services/${encodeURIComponent(serviceSlug)}`,
  );
}
