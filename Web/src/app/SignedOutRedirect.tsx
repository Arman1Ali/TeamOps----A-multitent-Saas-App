/**
 * What a signed-out person should be looking at: the login screen.
 *
 * This module belongs to the APP shell (src/app).
 *
 * A guard in Next's App Router cannot call `redirect()` from a client
 * component's render for this purpose - the session is read from localStorage
 * after the page has already rendered, so the answer is an effect that changes
 * the address once it knows.
 *
 * This is the one place that decision is written down. WorkspaceLayout renders
 * it while signed out, and a screen returns it early so its own fetches never
 * start against a session that has ended.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SignedOutRedirect() {
  const router = useRouter();

  useEffect(() => {
    // replace rather than push: the dashboard should not stay in Back, or a
    // signed-out person gets to a page that immediately sends them away again.
    router.replace("/login");
  }, [router]);

  return null;
}
