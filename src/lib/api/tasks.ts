/**
 * Tasks.
 *
 * Two surfaces with different shapes: staff see assignment and audit fields,
 * clients see a narrower record. They are separate types because they are
 * separate endpoints — the backend does not serve the staff view to a client.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type Task = Json<
  ApiPaths["/api/v1/admin/tasks"]["get"]["responses"][200]
>[number];

export type ClientTask = Json<
  ApiPaths["/api/v1/portal/tasks"]["get"]["responses"][200]
>[number];

export type TaskCounts = Json<
  ApiPaths["/api/v1/admin/tasks/counts"]["get"]["responses"][200]
>;

export type TaskStatus = Task["status"];

export interface TaskFilters {
  clientId?: string;
  status?: TaskStatus | "";
  assignedTo?: string;
  overdue?: boolean;
  includeArchived?: boolean;
  search?: string;
}

function toQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.clientId) params.set("client_id", filters.clientId);
  if (filters.status) params.set("status", filters.status);
  if (filters.assignedTo) params.set("assigned_to", filters.assignedTo);
  if (filters.overdue) params.set("overdue", "true");
  if (filters.includeArchived) params.set("include_archived", "true");
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const query = params.toString();
  return query ? `?${query}` : "";
}

// --- Staff ---------------------------------------------------------------------

export const listTasks = (filters: TaskFilters = {}) =>
  apiFetch<Task[]>(`/admin/tasks${toQuery(filters)}`);

export const getTaskCounts = (clientId?: string) =>
  apiFetch<TaskCounts>(
    `/admin/tasks/counts${clientId ? `?client_id=${clientId}` : ""}`,
  );

export const createTask = (body: Record<string, unknown>) =>
  apiFetch<Task>("/admin/tasks", { method: "POST", body });

export const updateTask = (id: string, body: Record<string, unknown>) =>
  apiFetch<Task>(`/admin/tasks/${id}`, { method: "PATCH", body });

export const completeTask = (id: string, note: string) =>
  apiFetch<Task>(`/admin/tasks/${id}/complete`, { method: "POST", body: { note } });

export const reopenTask = (id: string) =>
  apiFetch<Task>(`/admin/tasks/${id}/reopen`, { method: "POST" });

/** Archives. Admin only — the API refuses a manager. */
export const archiveTask = (id: string) =>
  apiFetch<Task>(`/admin/tasks/${id}`, { method: "DELETE" });

export const restoreTask = (id: string) =>
  apiFetch<Task>(`/admin/tasks/${id}/restore`, { method: "POST" });

// --- Client portal ----------------------------------------------------------------

export const listMyTasks = (status?: string) =>
  apiFetch<ClientTask[]>(`/portal/tasks${status ? `?status=${status}` : ""}`);

export const getMyTaskCounts = () => apiFetch<TaskCounts>("/portal/tasks/counts");
