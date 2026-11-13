/**
 * The address "/tasks".
 *
 * This module belongs to the APP shell (src/app), in the (dashboard) route
 * group. See (dashboard)/page.tsx for why the route file stays a server
 * component and the screen does not.
 *
 * The one thing this file adds is the Suspense boundary, and it is not
 * decoration. TasksPage reads `?project=` and `?assignee=` through
 * useSearchParams(), and during a static build that hook has no address to
 * consult - the browser is the only place that knows it. Next's answer is to
 * render the rest of the tree and leave the filtering part to a client fallback
 * rather than failing the build with "couldn't be rendered statically".
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/States";
import { TasksPage } from "@/features/tasks/TasksPage";

export const metadata: Metadata = {
  title: "Tasks",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <TasksPage />
    </Suspense>
  );
}
