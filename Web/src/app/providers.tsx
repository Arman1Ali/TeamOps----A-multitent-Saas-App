/**
 * The three providers, in the one order they have to be in.
 *
 * This module belongs to the APP shell (src/app).
 *
 * The order is not a style choice - it is what each hook reads:
 *
 *   AuthProvider      reads the token from localStorage and asks the API who
 *                     that is. Nothing above it can know a person exists.
 *   WorkspaceProvider waits for `status` before it fetches, so the first
 *                     request always carries a token for a known user, and
 *                     signs-out clears the previous workspace's rows.
 *   UiProvider        holds the search box and the toast, which the frame and
 *                     every screen read. It is last because it depends on
 *                     neither of the others.
 *
 * If WorkspaceProvider were outside AuthProvider it would fetch with no token,
 * get a 401, and take the browser to /login before the user's own session had
 * even been checked.
 */

"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { UiProvider } from "@/hooks/useUi";
import { WorkspaceProvider } from "@/hooks/useWorkspace";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <UiProvider>{children}</UiProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
