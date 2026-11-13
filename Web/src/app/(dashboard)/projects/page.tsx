/**
 * The address "/projects".
 *
 * This module belongs to the APP shell (src/app), in the (dashboard) route
 * group. See (dashboard)/page.tsx for why the route file stays a server
 * component and the screen does not.
 */

import type { Metadata } from "next";
import { ProjectsPage } from "@/features/projects/ProjectsPage";

export const metadata: Metadata = {
  title: "Projects",
};

export default function Page() {
  return <ProjectsPage />;
}
