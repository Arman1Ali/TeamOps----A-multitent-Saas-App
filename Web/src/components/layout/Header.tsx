/**
 * The bar across the top: where you are, the search box, and the bell.
 *
 * This module belongs to the LAYOUT layer (src/components/layout).
 *
 * The search box writes to useUi() and nothing else. Four screens read that
 * one value, which is why the header does not need to know which screen is
 * open, and why a screen does not have to accept a search prop from anybody.
 */

"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAVIGATION, activeHrefFor } from "./navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth();
  const { tasks, projects } = useWorkspace();
  const { search, setSearch, notify } = useUi();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  const activeView =
    NAVIGATION.find((item) => item.href === activeHrefFor(pathname))?.view ?? "Overview";

  // ⌘K (or Ctrl+K) puts the cursor in the search box. Bound here rather than
  // in a global layout, because this is the file that owns the input.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // isDueToday is a real flag on the row (mappers.ts -> toTask). Comparing the
  // display label against the word "Today" would break the moment somebody
  // rewords the label.
  const openTasks = tasks.filter((task) => !task.completed).length;
  const dueToday = tasks.filter((task) => task.isDueToday && !task.completed).length;

  return (
    <header className="sticky top-0 z-20 flex h-[58px] items-center gap-2 border-b border-slate-200 bg-white/95 px-2.5 backdrop-blur-md sm:px-4 md:h-[67px] md:justify-between md:px-[25px] xl:px-[38px]">
      <IconButton
        variant="quiet"
        className="size-8 md:hidden"
        aria-label="Open navigation menu"
        onClick={onOpenMenu}
      >
        <Menu size={21} />
      </IconButton>

      {/* The breadcrumb is the screen name, read from the address. */}
      <div className="mr-auto flex items-center gap-2 text-[10px] text-slate-400 md:mr-0 md:gap-[11px] md:text-[11px]">
        <span>{user?.company?.name?.trim() || "Workspace"}</span>
        <span className="text-slate-300">/</span>
        <strong className="font-semibold text-slate-700">{activeView}</strong>
      </div>

      <div className="flex items-center gap-1.5 md:gap-[18px]">
        <label className="flex size-[34px] items-center justify-center gap-2 rounded-lg text-slate-400 focus-within:absolute focus-within:right-[85px] focus-within:left-[52px] focus-within:z-10 focus-within:w-auto focus-within:justify-start focus-within:border focus-within:border-indigo-200 focus-within:bg-white focus-within:px-2 md:h-[34px] md:w-[220px] md:justify-start md:rounded-[9px] md:border md:border-slate-200 md:bg-slate-50 md:px-2">
          <Search size={16} />
          <input
            ref={searchRef}
            id="workspace-search"
            type="search"
            placeholder="Search anything..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search projects and tasks"
            className="w-0 min-w-0 flex-1 bg-transparent text-[10px] text-slate-900 outline-none placeholder:text-slate-400 focus:w-full md:w-full"
          />
          <kbd className="hidden rounded border border-slate-200 bg-white px-1 text-[9px] text-slate-400 md:inline">
            ⌘ K
          </kbd>
        </label>

        {/* The bell says what is actually outstanding. A badge of "3" that
            never changes is worse than no bell at all. */}
        <IconButton
          variant="quiet"
          className="relative size-[31px]"
          aria-label="What needs attention"
          onClick={() =>
            notify(
              openTasks === 0
                ? `Nothing open. ${projects.length} project${projects.length === 1 ? "" : "s"} in this workspace.`
                : `${openTasks} task${openTasks === 1 ? "" : "s"} still open${dueToday > 0 ? `, ${dueToday} due today` : ""}.`,
            )
          }
        >
          <Bell size={19} strokeWidth={1.8} />
          {dueToday > 0 && (
            <span className="absolute top-[7px] right-[7px] size-1.5 rounded-full border border-white bg-indigo-500" />
          )}
        </IconButton>

        <Avatar
          initials={user?.initials ?? "?"}
          className="border-0 bg-violet-100 text-violet-800"
        />
      </div>
    </header>
  );
}
