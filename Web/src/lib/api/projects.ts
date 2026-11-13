/**
 * The project endpoints.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * One deliberate simplification: every list call asks for 100 rows, which is
 * the maximum the backend allows. A workspace with more than 100 projects is a
 * different piece of work - paging controls - and pretending to have solved it
 * with a `page` parameter nobody passes would only hide the limit.
 */

import { request } from "./http";
import type {
  ApiListParams,
  ApiProject,
  ApiProjectCreate,
  ApiProjectUpdate,
} from "@/types/api";

/** How many rows one request asks for. 100 is the backend's ceiling. */
const LIST_LIMIT = 100;

/**
 * GET /projects - the caller's own workspace only.
 *
 * There is no company_id parameter, and that is the security model talking:
 * the workspace is taken from the token, so asking for somebody else's
 * projects is not a thing this endpoint can be tricked into.
 */
export function listProjects(
  params: Omit<ApiListParams, "limit"> = {},
): Promise<ApiProject[]> {
  return request<ApiProject[]>("/projects", { query: { limit: LIST_LIMIT, ...params } });
}

/** POST /projects - files a new project in the signed-in workspace. */
export function createProject(input: ApiProjectCreate): Promise<ApiProject> {
  return request<ApiProject>("/projects", { method: "POST", body: input });
}

/**
 * PUT /projects/{id} - change what you send, leave the rest alone.
 *
 * The backend treats a missing field as "unchanged", so a card dragging the
 * progress from 40 to 55 sends { progress: 55 } and nothing else.
 *
 * `sendFields` is for one case that is easy to get wrong: a deadline. The
 * edit form shows an empty date box whether the project has no deadline or
 * the person has not touched it, and those two mean different things to the
 * API - leaving due_date out keeps it, sending null clears it. So the form
 * says which fields it actually wants changed, and this function sends those
 * and only those.
 */
export function updateProject(
  id: number,
  patch: ApiProjectUpdate,
  sendFields?: Array<keyof ApiProjectUpdate>,
): Promise<ApiProject> {
  const body = sendFields
    ? Object.fromEntries(sendFields.map((field) => [field, patch[field]]))
    : patch;

  return request<ApiProject>(`/projects/${id}`, { method: "PUT", body });
}

/** DELETE /projects/{id} - removes the project and every task inside it. */
export function deleteProject(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/projects/${id}`, { method: "DELETE" });
}
