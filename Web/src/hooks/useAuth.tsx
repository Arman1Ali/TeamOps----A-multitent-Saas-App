/**
 * Who is signed in, for the whole app.
 *
 * This module belongs to the HOOKS layer (src/hooks): thin wrappers over
 * src/lib/api that hold the state a screen would otherwise re-fetch itself.
 *
 * One AuthProvider sits at the top of the tree (src/app/layout.tsx), so:
 *   * the login screen can sign in without reloading the page;
 *   * every screen can ask for `user.role` to decide what to show;
 *   * when a token stops working, exactly one thing reacts to it.
 *
 * It knows nothing about routing. The dashboard layout watches `status` and
 * decides to show /login - keeping "what is true" apart from "where to go".
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentUser, signIn, signOut, signUp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { SIGNED_OUT_EVENT, clearTokens, hasTokens } from "@/lib/auth/session";
import type { ApiUser } from "@/types/api";

/** Three states, because "we do not know yet" is not the same as "signed out". */
export type AuthStatus = "checking" | "signed-out" | "signed-in";

type AuthValue = {
  status: AuthStatus;
  /** Null until a token has been exchanged for a person. */
  user: ApiUser | null;
  /** What went wrong while reading the session, in words. */
  error: string | null;
  /** The login form calls this. It throws ApiError so the form can show why. */
  login: (email: string, password: string) => Promise<void>;
  /** The "start a workspace" form calls this. Same rule: it throws. */
  register: (input: {
    company_name: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  /** Read the session again - used by the error state on the dashboard. */
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // "checking" on purpose: the first render happens before localStorage has
  // been read, and a flash of the login screen at every reload is worse than
  // a moment of nothing.
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!hasTokens()) {
      setUser(null);
      setStatus("signed-out");

      return;
    }

    try {
      // GET /auth/me is the only real test of a token: it checks the
      // signature, the expiry, and that the person still exists.
      setUser(await fetchCurrentUser());
      setError(null);
      setStatus("signed-in");
    } catch (cause) {
      // An expired token has already been refreshed and retried by http.ts,
      // so anything reaching here means the session is genuinely over.
      clearTokens();
      setUser(null);
      setStatus("signed-out");

      if (!(cause instanceof ApiError)) setError("Could not reach the server. Is the API running?");
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    // http.ts fires this when a call could not be rescued by a refresh.
    function handleSignedOut() {
      setUser(null);
      setStatus("signed-out");
    }

    window.addEventListener(SIGNED_OUT_EVENT, handleSignedOut);

    return () => window.removeEventListener(SIGNED_OUT_EVENT, handleSignedOut);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
    setUser(await fetchCurrentUser());
    setError(null);
    setStatus("signed-in");
  }, []);

  const register = useCallback(
    async (input: { company_name: string; name: string; email: string; password: string }) => {
      await signUp(input);
      setUser(await fetchCurrentUser());
      setError(null);
      setStatus("signed-in");
    },
    [],
  );

  const logout = useCallback(async () => {
    // Clearing locally first means the dashboard cannot make another call in
    // the moment between the request and its answer.
    setUser(null);
    setStatus("signed-out");
    await signOut();
  }, []);

  // One object, memoised, so a consumer re-renders only when something it
  // reads has actually changed.
  const value = useMemo<AuthValue>(
    () => ({ status, user, error, login, register, logout, reload: loadSession }),
    [status, user, error, login, register, logout, loadSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** The signed-in person. Throws if used outside AuthProvider - a bug, not a state. */
export function useAuth(): AuthValue {
  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");

  return context;
}
