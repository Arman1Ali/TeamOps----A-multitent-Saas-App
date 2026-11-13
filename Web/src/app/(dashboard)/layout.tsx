/**
 * The frame all four signed-in screens share.
 *
 * This module belongs to the APP shell (src/app), in the (dashboard) route
 * group - the parentheses mean it adds nothing to the address, so "/" ,
 * "/projects", "/tasks" and "/team" all sit under it.
 *
 * Its whole job is to put a page inside WorkspaceLayout, which owns the
 * sidebar, the header, the toast and the signed-out redirect. Doing that here
 * rather than at the top of every page is what Next's layout tree is for: the
 * frame does not re-render when you move between screens, so the sidebar does
 * not flicker and the data already loaded stays put.
 */

import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
