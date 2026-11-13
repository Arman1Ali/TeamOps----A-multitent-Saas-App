/**
 * The task endpoints.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * GET /tasks is one endpoint serving every view the app has, because its
 * filters combine: no parameters is the whole board, ?status=To%20do is one
 * column, ?assigned_to=7 is my tasks, ?project_id=3 is one project's work.
 */

import { request } from "./http";
import type { ApiListParams, ApiTask, ApiTaskCreate, ApiTaskUpdate } from "@/types/api";

/** 100 rows, the backend's maximum. See projects.ts for why there is no paging. */
const LIST_LIMIT = 100;

/** GET /tasks. */
export function listTasks(params: Omit<ApiListParams, "limit"> = {}): Promise<ApiTask[]> {
  return request<ApiTask[]>("/tasks", { query: { limit: LIST_LIMIT, ...params } });
}

/** POST /tasks - adds work to one of the caller's projects. */
export function createTask(input: ApiTaskCreate): Promise<ApiTask> {
  return request<ApiTask>("/tasks", { method: "POST", body: input });
}

/**
 * PUT /tasks/{id} - the call the checkbox makes.
 *
 * Ticking a task off sends { status: "Done" } and nothing else. Leaving a
 * task un-ticked sends its previous status back, which is why the row keeps
 * the status it had rather than inventing "To do": a task that was "In
 * progress" goes back to "In progress".
 *
 * Who is allowed to do that is decided by the backend, not here: an admin, the
 * workspace owner, or the person the task is assigned to. Everybody else gets
 * a 403, and ApiError carries the sentence that explains it.
 */
export function updateTask(id: number, patch: ApiTaskUpdate): Promise<ApiTask> {
  return request<ApiTask>(`/tasks/${id}`, { method: "PUT", body: patch });
}

/** Reassign, or claim: { assigned_to: myId }, and { assigned_to: null } to let go. */
export function assignTask(id: number, userId: number | null): Promise<ApiTask> {
  return updateTask(id, { assigned_to: userId });
}

/** DELETE /tasks/{id}. */
export function deleteTask(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/tasks/${id}`, { method: "DELETE" });
}
