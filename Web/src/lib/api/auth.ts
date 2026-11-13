/**
 * The four auth endpoints, one function each.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * A rule worth keeping: nothing in here decides what to do with a token. It
 * hands the pair back and session.ts stores it. Mixing the two is how a
 * request function ends up redirecting the page behind somebody's cursor.
 */

import { request } from "./http";
import { clearTokens, getRefreshToken, saveTokens } from "@/lib/auth/session";
import type { ApiTokens, ApiUser } from "@/types/api";

/** POST /auth/login - email and password in, token pair out. */
export async function signIn(email: string, password: string): Promise<ApiTokens> {
  const tokens = await request<ApiTokens>("/auth/login", {
    method: "POST",
    body: { email, password },
    withAuth: false,
  });

  saveTokens(tokens);

  return tokens;
}

/**
 * POST /auth/register - starts a workspace and its owner in one call.
 *
 * There is no POST /companies on purpose: you cannot already be signed in to a
 * workspace you do not have yet. The answer is the same token pair login gives,
 * so the screen that called it behaves identically either way.
 */
export async function signUp(input: {
  company_name: string;
  name: string;
  email: string;
  password: string;
}): Promise<ApiTokens> {
  const tokens = await request<ApiTokens>("/auth/register", {
    method: "POST",
    body: input,
    withAuth: false,
  });

  saveTokens(tokens);

  return tokens;
}

/**
 * GET /auth/me - who is signed in, and which workspace they belong to.
 *
 * Called once when the app starts. It answers three questions at once: is this
 * token still alive, what is the person's role (which buttons they should see),
 * and what is the workspace's name (what the sidebar should say).
 */
export function fetchCurrentUser(): Promise<ApiUser> {
  return request<ApiUser>("/auth/me");
}

/**
 * POST /auth/logout - cancel the refresh token, then forget it.
 *
 * The access token is not revoked, because the server keeps no list of them: it
 * expires by itself (thirty minutes by default). That is why signing out must
 * also clear the browser's copy, and why a stolen access token has a short
 * shelf life.
 */
export async function signOut(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    await request("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
      withAuth: false,
    }).catch(() => {
      // Whether the server cancels it or it was already gone, the browser's
      // answer is the same: stop holding it.
    });
  }

  clearTokens();
}
