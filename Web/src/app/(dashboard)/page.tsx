/**
 * The address "/" - the overview.
 *
 * This module belongs to the APP shell (src/app), in the (dashboard) route
 * group.
 *
 * A route file in the App Router is a server component by default, and this one
 * stays one: everything on the screen lives in OverviewPage, which is a client
 * component because it reads contexts and reacts to clicks. Keeping the file
 * that owns the address free of "use client" is what lets Next render the
 * document shell on the server and ship only the interactive tree to the
 * browser.
 *
 * The page has no data of its own to fetch. useWorkspace() fetches it in the
 * browser, against the token in localStorage - a server fetch would have had
 * that token sent up in a cookie, which is a different auth design than the one
 * this API uses (it sends the token in an Authorization header).
 */

import type { Metadata } from "next";
import { OverviewPage } from "@/features/overview/OverviewPage";

export const metadata: Metadata = {
  title: "Overview",
};

export default function Page() {
  return <OverviewPage />;
}
