/**
 * The root of the App Router tree: html, body, the fonts, the providers.
 *
 * This module belongs to the APP shell (src/app).
 *
 * Everything below it is inside the providers, which is why this file has no
 * markup of its own beyond the two tags the browser insists on. The metadata
 * here is what a tab and a link preview show; the icons live in public/.
 *
 * `providers.tsx` is a separate client component rather than "use client" on
 * this file, so that Next can still render the html document on the server and
 * only the context tree crosses into the browser.
 */

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "TeamOps · Keep your team moving",
    template: "%s · TeamOps",
  },
  description:
    "Projects, tasks and teammates in one workspace, backed by a real API rather than sample data.",
  // The old app put this in index.html; the App Router's metadata export is the
  // equivalent, and public/ is served at the site root.
  icons: { icon: "/favicon.svg" },
};

/**
 * How the page behaves on a phone or tablet - which matters, because this is
 * the "mobile" half of the repository.
 *
 * `width: device-width` is what the responsive breakpoints in the layout
 * (sm:, xl:) depend on: without it a phone reports ~980px of pretend desktop
 * and the two-column grid is chosen on a 5-inch screen.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
