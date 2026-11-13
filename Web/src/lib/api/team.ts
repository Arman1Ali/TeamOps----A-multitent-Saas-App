/**
 * The people and workspace endpoints.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * Note what is missing: there is no createWorkspace function, because there is
 * no POST /companies. Starting a workspace happens at POST /auth/register,
 * which creates the company and its owner in one go - see auth.ts -> signUp.
 */

import { request } from "./http";
import type {
  ApiCompanyDetail,
  ApiListParams,
  ApiUser,
  ApiUserCreate,
  ApiUserRole,
} from "@/types/api";

/** 100 rows, the backend's maximum. See projects.ts for why there is no paging. */
const LIST_LIMIT = 100;

/** GET /users - the signed-in workspace's people. */
export function listUsers(params: Omit<ApiListParams, "limit"> = {}): Promise<ApiUser[]> {
  return request<ApiUser[]>("/users", { query: { limit: LIST_LIMIT, ...params } });
}

/**
 * GET /companies/{id} - one workspace, with its people and projects attached.
 *
 * The Team screen does not need this today (listUsers and listProjects between
 * them have everything), but it is the shape the workspace switcher will use,
 * and it is the endpoint that shows the two halves joined.
 */
export function fetchCompany(companyId: number): Promise<ApiCompanyDetail> {
  return request<ApiCompanyDetail>(`/companies/${companyId}`);
}

/**
 * POST /users - invite a teammate into the caller's workspace.
 *
 * The workspace is decided by the token, never by the body, which is why
 * ApiUserCreate has no company_id. Only an owner or an admin may call it:
 * anybody else gets a 403 back as an ApiError.
 */
export function inviteUser(input: ApiUserCreate): Promise<ApiUser> {
  return request<ApiUser>("/users", { method: "POST", body: input });
}

/** PUT /users/{id} - rename, change role, or set a new password. */
export function updateUser(
  id: number,
  patch: Partial<Omit<ApiUserCreate, "role">> & { role?: ApiUserRole },
): Promise<ApiUser> {
  return request<ApiUser>(`/users/${id}`, { method: "PUT", body: patch });
}

/**
 * DELETE /users/{id} - take a teammate out of the workspace.
 *
 * Their tasks are not deleted with them; they go unassigned, which is what the
 * backend does so that nobody loses work because a person left.
 */
export function removeUser(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/users/${id}`, { method: "DELETE" });
}
