/**
 * Every call to the backend goes through this one function.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * Nothing else in the app should contain a `fetch`. Four things are handled
 * here once, rather than in twenty components:
 *
 *   1. the base path, so a change of port or origin is one edit;
 *   2. the Authorization header, read from wherever the session lives;
 *   3. turning a failed response into an ApiError whose message a person can
 *      actually read - FastAPI's two error shapes are different, and one of
 *      them is an array;
 *   4. one silent retry when the access token has expired, which is the whole
 *      reason the refresh endpoint exists.
 *
 * The functions in auth.ts / projects.ts / tasks.ts / users.ts are thin typed
 * wrappers over `request`, one per endpoint. That is the layer the screens
 * call, so no screen ever builds a URL by hand.
 */

import {
  announceSignedOut,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/auth/session";
import type { ApiTokens } from "@/types/api";

/**
 * "/api/v1" by default, which next.config.ts forwards to the backend.
 *
 * A relative base means the browser sees one origin and no CORS rules are
 * involved. Set NEXT_PUBLIC_API_BASE_URL to a full address to skip the rewrite.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

/** The JSON every write endpoint answers with when there is nothing to return. */
export type ApiMessage = { message: string };

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  /** A plain object; it is sent as JSON, which is what the API expects. */
  body?: unknown;
  /** Query parameters. Values of null and undefined are left out. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** False for login, register and refresh, which cannot present a token. */
  withAuth?: boolean;
};

/**
 * A failed call, carrying a message worth showing.
 *
 * `status` is there for the rare case that a screen must react differently to
 * one code than another (a 403 on a task means "somebody else holds it").
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);

    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Explain a failure in one sentence.
 *
 * FastAPI answers a deliberate HTTPException with {"detail": "text"}, but a
 * validation failure (422) with {"detail": [{"loc": [...], "msg": "..."}]}.
 * Reading only the first shape is how apps end up showing "[object Object]".
 */
function describeFailure(status: number, payload: unknown): string {
  const detail =
    typeof payload === "object" && payload !== null && "detail" in payload
      ? (payload as { detail: unknown }).detail
      : undefined;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    // 422 from Pydantic: one line per field the form got wrong.
    const problems = detail
      .map((entry) => {
        if (typeof entry !== "object" || entry === null) return "";

        const { loc, msg } = entry as { loc?: unknown[]; msg?: string };
        const field = Array.isArray(loc) ? String(loc.at(-1) ?? "") : "";

        return field ? `${field}: ${msg ?? "check this"}` : (msg ?? "check this");
      })
      .filter(Boolean);

    if (problems.length) return `The form needs fixing - ${problems.join(", ")}`;
  }

  // No usable message: fall back to what the code itself means.
  if (status === 401) return "Your session is not valid. Please sign in again";
  if (status === 403) return "That is not yours to change";
  if (status === 404) return "It is not there any more";
  if (status === 409) return "That clashes with something already saved";
  if (status >= 500) return "The server could not handle that";

  return `The request failed (${status})`;
}

/**
 * Refreshing is shared between concurrent calls.
 *
 * A screen that loads six things with an expired token would otherwise fire
 * six refresh requests, and - because the backend rotates and cancels - only
 * the first could succeed. One promise, awaited by everybody, is enough.
 */
let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!pendingRefresh) {
    pendingRefresh = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return null;

        const tokens = (await response.json()) as ApiTokens;
        saveTokens(tokens);

        return tokens.access_token;
      })
      .catch(() => null) // the network being down is the same answer as a refusal
      .finally(() => {
        pendingRefresh = null;
      });
  }

  return pendingRefresh;
}

/** One round trip, with the header set and the answer checked. */
async function send<T>(path: string, options: RequestOptions, accessToken: string | null): Promise<T> {
  const search = new URLSearchParams();

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });

  const query = search.toString();
  const response = await fetch(`${API_BASE}${path}${query ? `?${query}` : ""}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  // Some answers are empty even with a status code (a 201 with no body yet).
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // HTML from a proxy, or a plain-text error. Keep it out of the message:
      // a page of markup in a red banner tells nobody anything.
      payload = null;
    }
  }

  if (!response.ok) throw new ApiError(response.status, describeFailure(response.status, payload));

  return (payload ?? undefined) as T;
}

/**
 * Call the API, and get out of the way when it works.
 *
 * On a 401 it refreshes once and repeats the original request. The user never
 * sees that happen. If the refresh itself fails there is nothing left to do
 * quietly: the tokens are dropped, everyone listening is told the session
 * ended, and the layout shows the login screen again.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const wantsAuth = options.withAuth !== false;
  const firstToken = wantsAuth ? getAccessToken() : null;

  try {
    return await send<T>(path, options, firstToken);
  } catch (error) {
    const refused = error instanceof ApiError && error.status === 401;

    if (!refused || !wantsAuth || !getRefreshToken()) {
      if (refused) {
        clearTokens();
        announceSignedOut();
      }

      throw error;
    }

    const freshToken = await refreshAccessToken();

    if (!freshToken) {
      clearTokens();
      announceSignedOut();

      throw new ApiError(401, "Your session has ended. Please sign in again");
    }

    // The retry is the second 401's chance to be real rather than confusing.
    return send<T>(path, options, freshToken);
  }
}
