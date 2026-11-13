/**
 * The column on the left: who you are, which workspace, and where to go.
 *
 * This module belongs to the LAYOUT layer (src/components/layout).
 *
 * It is the same component the Vite app had, with three real differences:
 *   * the links are router links, so the address bar says where you are and
 *     a reload lands on the same screen;
 *   * the name, initials, workspace and role come from the signed-in user
 *     rather than being typed into the file;
 *   * the number beside "Tasks" is the count of tasks still open, so it moves
 *     when a task is ticked off.
 */

"use client";

import {
  BriefcaseBusiness,
  ChevronDown,
  LogOut,
  Settings2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, activeHrefFor } from "./navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Avatar } from "@/components/ui/Avatar";

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth();
  const { tasks, members } = useWorkspace();
  const { notify } = useUi();
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname);

  const openTasks = tasks.filter((task) => !task.completed).length;
  const workspaceName = user?.company?.name?.trim() || "Your workspace";

  return (
    // `min-h-full` rather than `h-full`, with the parent aside scrolling: on a
    // short window this column is taller than the screen, and a fixed height
    // would make it stop growing at the viewport and cut the profile row off.
    // mt-auto below still pushes that row to the bottom whenever there is room.
    <div className="flex min-h-full flex-col px-4 pt-[26px] pb-[14px]">
      <Link
        className="mb-[27px] ml-[5px] inline-flex w-fit items-center gap-[10px] font-display text-xl font-extrabold tracking-tight text-slate-900 no-underline"
        href="/"
        onClick={onNavigate}
      >
        <span className="grid size-[34px] place-items-center rounded-[11px] bg-brand text-white">
          <BriefcaseBusiness size={19} strokeWidth={2.2} />
        </span>
        <span>
          Team<span className="text-brand">Ops</span>
        </span>
      </Link>

      {/* The workspace you are in. It is a button, not a switcher: the API
          decides the workspace from the token, so changing it means signing
          in somewhere else - and saying so is better than a dead dropdown. */}
      <button
        type="button"
        className="flex min-h-[57px] items-center gap-2.5 rounded-[13px] border border-slate-200 bg-white p-[9px] text-left"
        onClick={() =>
          notify(
            `You are in ${workspaceName}. To work in another one, sign in with that workspace's account.`,
          )
        }
      >
        <span className="grid size-[34px] place-items-center rounded-[10px] bg-slate-900 font-display text-sm font-bold text-white">
          {workspaceName.trim().charAt(0).toUpperCase() || "W"}
        </span>
        <span className="grid min-w-0 flex-1 gap-[3px]">
          <strong className="truncate text-xs">{workspaceName}</strong>
          <small className="text-[10px] text-slate-400">{members.length} people</small>
        </span>
        <ChevronDown size={15} className="flex-none text-slate-400" />
      </button>

      <span className="mt-[29px] mb-[10px] ml-[9px] text-[9px] font-bold tracking-[1.15px] text-slate-400">
        WORKSPACE
      </span>
      <nav className="grid gap-[5px]" aria-label="Main navigation">
        {NAVIGATION.map(({ view, label, href, icon: Icon }) => {
          const isActive = activeHref === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[42px] items-center gap-3 rounded-[10px] px-[11px] text-left text-xs no-underline transition-colors ${
                isActive
                  ? "bg-teamops-lavender font-bold text-brand"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {/* Only Tasks carries a number: it is the one list somebody
                  wants short. The count is live, so it drops as work ends. */}
              {view === "Tasks" && openTasks > 0 && (
                <span
                  className={`ml-auto grid h-5 min-w-[21px] place-items-center rounded-[7px] text-[10px] ${
                    isActive ? "bg-white text-brand" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {openTasks}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-[10px]">
        <div className="rounded-[13px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5">
          <span className="mb-3 grid size-[29px] place-items-center rounded-[9px] bg-white text-brand shadow-sm">
            <Sparkles size={16} />
          </span>
          <strong className="text-[11px]">Make teamwork flow</strong>
          <p className="my-1.5 text-[10px] leading-relaxed text-slate-500">
            {tasks.length === 0
              ? "Nothing on the board yet. Add a project to get started."
              : `${openTasks} of ${tasks.length} tasks still open.`}
          </p>
          <Link
            href="/projects"
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand no-underline"
          >
            Explore projects <ArrowRight size={13} />
          </Link>
        </div>

        <button
          type="button"
          className="flex min-h-[37px] items-center gap-3 rounded-[10px] px-[11px] text-left text-xs text-slate-500 hover:bg-slate-50"
          onClick={() => notify("Workspace settings are not built yet.")}
        >
          <Settings2 size={18} strokeWidth={1.8} /> Settings
        </button>

        <div className="flex items-center gap-2.5 border-t border-slate-200 px-1 pt-2.5">
          <Avatar
            initials={user?.initials ?? "?"}
            className="border-0 bg-violet-100 text-violet-800"
          />
          <span className="grid min-w-0 flex-1 gap-[3px]">
            <strong className="truncate text-xs">{user?.name ?? "Signed out"}</strong>
            <small className="truncate text-[10px] text-slate-400">
              {user ? `${user.email} · ${user.role}` : ""}
            </small>
          </span>
          <button
            type="button"
            className="grid size-[31px] flex-none place-items-center rounded-[9px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Sign out"
            // The only step is the call: useAuth clears the user, and the
            // dashboard layout notices and takes the browser to /login.
            onClick={() => {
              void logout();
              onNavigate();
            }}
          >
            <LogOut size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}
