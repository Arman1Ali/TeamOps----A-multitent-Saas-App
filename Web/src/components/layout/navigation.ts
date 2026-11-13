/**
 * The four places the app can go, listed once.
 *
 * This module belongs to the LAYOUT layer (src/components/layout).
 *
 * The sidebar and the bottom bar on a phone are two drawings of the same
 * thing, so the list, the labels and the hrefs live here and cannot drift
 * apart. `view` is kept next to the href because the breadcrumb in the header
 * needs the word, not the path.
 */

import {
  FolderKanban,
  Home,
  ListTodo,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AppView } from "@/types/ui";

export type NavItem = {
  view: AppView;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAVIGATION: NavItem[] = [
  { view: "Overview", label: "Overview", href: "/", icon: Home },
  { view: "Projects", label: "Projects", href: "/projects", icon: FolderKanban },
  { view: "Tasks", label: "Tasks", href: "/tasks", icon: ListTodo },
  { view: "Team", label: "Team", href: "/team", icon: Users },
];

/**
 * Which nav entry the browser is looking at.
 *
 * Next gives an exact pathname, so "/" would never match "/projects". The
 * overview is the only route at the root, so everything that is not one of
 * the other three falls back to it.
 */
export function activeHrefFor(pathname: string): string {
  const match = NAVIGATION.filter((item) => item.href !== "/").find((item) =>
    pathname.startsWith(item.href),
  );

  return match?.href ?? "/";
}
