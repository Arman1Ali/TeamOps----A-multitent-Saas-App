/**
 * The Tasks screen: the whole board, or one project's slice of it.
 *
 * This module belongs to the TASKS feature (src/features/tasks).
 *
 * The address decides the project and the chips decide the status, and that
 * split is deliberate:
 *
 *   * `?project=7` arrives from a project card's menu, so it has to be in the
 *     URL for the link to mean anything, and for a reload or a shared address
 *     to show the same list;
 *   * the status chips are a way of looking at what is already on screen. The
 *     provider holds every task of the workspace, so filtering them locally
 *     is one less request for the same rows.
 *
 * The three figures above the list are counted from the filtered set, so they
 * describe what you are looking at rather than something else in the
 * database.
 */

"use client";

import { CheckCheck, ClipboardList, Clock3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignedOutRedirect } from "@/app/SignedOutRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { ApiTaskStatus } from "@/types/api";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskList } from "./TaskList";

/** The chips. "All" is not a status; the rest are the API's own words. */
const TABS: Array<{ label: string; value: ApiTaskStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "To do", value: "To do" },
  { label: "In progress", value: "In progress" },
  { label: "Done", value: "Done" },
];

export function TasksPage() {
  const { status, user } = useAuth();
  const { tasks, apiProjects, apiUsers, isLoading, error, reload, toggleTask, claimAndToggle } =
    useWorkspace();
  const { search } = useUi();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<ApiTaskStatus | "All">("All");
  const [creating, setCreating] = useState(false);

  // Both arrive as text in the address and are turned into a number here,
  // because an unknown id should show an empty list rather than quietly
  // showing everything - the whole board when one person's work was asked for
  // is the sort of lie that makes a filter untrustworthy.
  const projectId = Number(searchParams.get("project") ?? "");
  const scoped = Number.isFinite(projectId) && projectId > 0;
  const project = scoped ? apiProjects.find((row) => row.id === projectId) : undefined;

  const assigneeId = Number(searchParams.get("assignee") ?? "");
  const onlyOnePerson = Number.isFinite(assigneeId) && assigneeId > 0;
  const teammate = onlyOnePerson ? apiUsers.find((row) => row.id === assigneeId) : undefined;

  // The words the heading and the clear-link share, so they cannot disagree
  // about which filter is on.
  const scopedToSomething = scoped || onlyOnePerson;

  const shown = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!scoped || task.projectId === projectId) &&
          (!onlyOnePerson || task.assigneeId === assigneeId) &&
          (tab === "All" || task.status === tab) &&
          (!shown ||
            task.title.toLowerCase().includes(shown) ||
            task.project.toLowerCase().includes(shown)),
      ),
    [tasks, scoped, projectId, onlyOnePerson, assigneeId, tab, shown],
  );

  if (status === "signed-out") return <SignedOutRedirect />;
  if (isLoading) return <LoadingState rows={5} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const open = visible.filter((task) => !task.completed);
  const summaries = [
    {
      label: "Still open",
      value: open.length,
      icon: ClipboardList,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Due today",
      value: open.filter((task) => task.isDueToday).length,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Finished",
      value: visible.length - open.length,
      icon: CheckCheck,
      tone: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <>
      <SectionHeading
        eyebrow={
          project
            ? project.name
            : teammate?.name ?? (user?.company?.name?.toUpperCase() ?? "YOUR WORKSPACE")
        }
        title={
          project
            ? `${project.name} · tasks`
            : teammate
              ? `${teammate.name}'s tasks`
              : "Tasks"
        }
        description={
          apiProjects.length === 0
            ? "Tasks belong to a project, and there is none yet."
            : scopedToSomething
              ? "One filter is on. Back to Tasks shows the whole board again."
              : "Everything the workspace holds, soonest deadline first."
        }
        action={apiProjects.length === 0 ? undefined : "Add a task"}
        onAction={apiProjects.length === 0 ? undefined : () => setCreating(true)}
      />

      <div className="my-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {summaries.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </span>
            <span className="grid gap-0.5">
              <strong className="font-display text-base">{value}</strong>
              <small className="text-[9px] text-slate-500">{label}</small>
            </span>
          </div>
        ))}
      </div>

      <div
        className="mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] bg-slate-100 p-1"
        role="group"
        aria-label="Filter tasks by status"
      >
        {TABS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            className={`min-h-[30px] whitespace-nowrap rounded-md px-3 text-[9px] font-semibold transition-colors ${
              tab === value ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
        {scopedToSomething && (
          // The only way back out of a URL filter that is not the browser's
          // Back button, and it is a link so the address is visible first. The
          // address it points at has both query keys dropped, because both
          // filters land on the same unfiltered board.
          <Link
            href="/tasks"
            className="inline-flex min-h-[30px] items-center rounded-md px-3 text-[9px] font-semibold text-slate-500 no-underline hover:text-brand"
          >
            Clear {scoped ? "project" : "teammate"} filter
          </Link>
        )}
      </div>

      <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white p-3 shadow-card sm:px-[17px]">
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="m-0 text-xs font-bold">
              {/* The heading names the filter that is actually on, so a list of
                  finished tasks under a title saying "All tasks" is not one of
                  the small lies this app went out of its way to stop telling. */}
              {project
                ? project.name
                : teammate
                  ? teammate.name
                  : tab === "All"
                    ? "All tasks"
                    : `${tab} tasks`}
            </h3>
            <p className="m-0 mt-1 text-[9px] text-slate-500">
              {open.length === 0 && visible.length > 0
                ? "Nothing open in this view."
                : `${open.length} of ${visible.length} still to do.`}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-600">
            {visible.length} task{visible.length === 1 ? "" : "s"}
          </span>
        </div>

        <TaskList
          tasks={visible}
          role={user?.role}
          onToggle={toggleTask}
          onClaimAndToggle={claimAndToggle}
          onCreateTask={() => setCreating(true)}
          canCreateTask={apiProjects.length > 0}
          emptyMessage={
            apiProjects.length === 0
              ? "Make a project first - a task always belongs to one."
              : shown
                ? `Nothing matches “${search}”.`
                : scoped
                  ? "This project has no tasks yet."
                  : onlyOnePerson
                    ? "This person has nothing assigned."
                    : "The board is empty."
          }
        />
      </section>

      {creating && <CreateTaskDialog defaultProjectId={project?.id} onClose={() => setCreating(false)} />}
    </>
  );
}
