/**
 * The address "/team".
 *
 * This module belongs to the APP shell (src/app), in the (dashboard) route
 * group. See (dashboard)/page.tsx for why the route file stays a server
 * component and the screen does not.
 */

import type { Metadata } from "next";
import { TeamPage } from "@/features/team/TeamPage";

export const metadata: Metadata = {
  title: "Team",
};

export default function Page() {
  return <TeamPage />;
}
