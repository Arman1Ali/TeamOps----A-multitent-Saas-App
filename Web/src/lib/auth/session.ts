/**
 * Where the two tokens live while the browser holds them.
 *
 * This module belongs to the AUTH layer (src/lib/auth).
 *
 * The backend hands back an access token (short-lived, sent with every call)
 * and a refresh token (long-lived, used only to get a new pair). Both are kept
 * in localStorage, which is the simplest thing that works for a development
 * app: nothing has to be threaded through the server, and a page reload keeps
 * you signed in.
 *
 * What that costs, stated plainly: anything a cross-site script could run
 * could read these keys. The usual hardening - an http-only cookie the script
 * cannot see - is a backend change too, and was left out of this phase on
 * purpose. Do not put real credentials in this app until that is done.
 *
 * Every function here tolerates running on the server, where there is no
 * window: Next renders components before any browser is involved, and a module
 * that threw on import would break the build rather than a page.
 */

const ACCESS_KEY = "teamops.access_token";
const REFRESH_KEY = "teamops.refresh_token";

/** Is there a browser to store anything in? */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    // Private browsing in some browsers throws on access rather than on write.
    // Being signed out for the session is the correct answer to that.
    return null;
  }
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_KEY) ?? null;
}

export function getRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_KEY) ?? null;
}

/**
 * Store a fresh pair.
 *
 * The refresh endpoint rotates tokens: the pair it returns replaces the old
 * one immediately, because the previous refresh token has already been
 * cancelled server-side. Keeping the old one would sign the user out at the
 * next attempt.
 */
export function saveTokens(tokens: { access_token: string; refresh_token: string }) {
  const store = storage();
  if (!store) return;

  store.setItem(ACCESS_KEY, tokens.access_token);
  store.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  const store = storage();
  if (!store) return;

  store.removeItem(ACCESS_KEY);
  store.removeItem(REFRESH_KEY);
}

/** Signed in, as far as the browser knows. The token may still have expired. */
export function hasTokens(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

/**
 * Fired when a call could not be rescued by a refresh.
 *
 * http.ts raises it, and useAuth listens: the provider then clears its user
 * and the layout sends the browser to /login. An event keeps the fetch layer
 * from having to know anything about React.
 */
export const SIGNED_OUT_EVENT = "teamops:signed-out";

export function announceSignedOut() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
}
