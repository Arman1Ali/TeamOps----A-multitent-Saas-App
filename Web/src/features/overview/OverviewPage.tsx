/**
 * The first screen: what needs attention today, and the shape of the
 * workspace around it.
 *
 * This module belongs to the OVERVIEW feature (src/features/overview).
 *
 * It reads everything from useWorkspace() and draws none of the counting
 * itself in the child components - the four figures, the three cards and the
 * five rows are all worked out here, from the same arrays, so that two halves
 * of the page cannot disagree about how many tasks are open.
 *
 * The three states come first, before any layout: a screen that renders half a
 * board of statistics while the data is still arriving shows numbers that are
 * wrong rather than numbers that are missing.
 */

"use client";

import { CalendarClock, CheckCircle2, FolderKanban, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignedOutRedirect } from "@/app/SignedOutRedirect";
import { CreateProjectDialog } from "@/features/projects/CreateProjectDialog";
import { ProjectCard } from "@/features/projects/ProjectCard";
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog";
import { TaskList } from "@/features/tasks/TaskList";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { mayManageWorkspace } from "@/lib/auth/permissions";
import { FocusCard } from "./FocusCard";
import { StatCard } from "./StatCard";

/** The hour the greeting changes, and nothing else. */
function dayPart(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

export function OverviewPage() {
  const { status, user } = useAuth();
  const { projects, tasks, members, apiProjects, isLoading, error, reload, toggleTask, claimAndToggle, refreshProjects } =
    useWorkspace();
  const { search } = useUi();
  // Navigation from a heading's action, where there is no address to write in
  // a Link. Everything that can be a link in this file is one.
  const router = useRouter();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const figures = useMemo(() => {
    const open = tasks.filter((task) => !task.completed);

    return {
      total: tasks.length,
      completed: tasks.length - open.length,
      dueToday: open.filter((task) => task.isDueToday).length,
      overdue: open.filter((task) => task.isOverdue).length,
      activeProjects: projects.filter((project) => project.status !== "Done").length,
    };
  }, [tasks, projects]);

  const shown = search.trim().toLowerCase();
  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          !shown ||
          project.name.toLowerCase().includes(shown) ||
          project.description.toLowerCase().includes(shown),
      ),
    [projects, shown],
  );
  const visibleTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !shown || task.title.toLowerCase().includes(shown) || task.project.toLowerCase().includes(shown),
        )
        .slice(0, 5),
    [tasks, shown],
  );

  if (status === "signed-out") return <SignedOutRedirect />;
  if (isLoading) return <LoadingState rows={5} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const canManage = mayManageWorkspace(user?.role);

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <span className="text-[9px] font-bold tracking-[1.15px] text-slate-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).toUpperCase()}
          </span>
          <h1 className="mb-1 mt-1.5 font-display text-lg font-bold tracking-tight sm:text-[23px]">
            {dayPart()}, {user?.name.split(" ")[0]} <span className="text-amber-400">✦</span>
          </h1>
          <p className="m-0 text-[9px] text-slate-500 sm:text-[11px]">
            {user?.company?.name ?? "Your workspace"} · {members.length}{" "}
            {members.length === 1 ? "person" : "people"}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-2.5 text-[0px] font-bold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-px hover:bg-brand-dark sm:px-3.5 sm:text-[11px]"
          aria-label="New project"
          onClick={() => setProjectDialogOpen(true)}
        >
          <span className="text-base">+</span>
          <span className="hidden sm:inline">New project</span>
        </button>
      </div>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4" aria-label="Workspace summary">
        <StatCard
          icon={<CheckCircle2 size={19} />}
          tone="indigo"
          label="Tasks completed"
          value={figures.completed}
          note={figures.total > 0 ? `of ${figures.total} on the board` : undefined}
        />
        <StatCard
          icon={<CalendarClock size={19} />}
          tone="amber"
          label="Due today"
          value={figures.dueToday}
          note={figures.overdue > 0 ? `${figures.overdue} already past their date` : undefined}
        />
        <StatCard
          icon={<FolderKanban size={19} />}
          tone="emerald"
          label="Active projects"
          value={figures.activeProjects}
          note={
            projects.length === figures.activeProjects
              ? undefined
              : `${projects.length - figures.activeProjects} finished`
          }
        />
        <StatCard
          icon={<Users size={19} />}
          tone="sky"
          label="People here"
          value={members.length}
          note={
            shown ? `${visibleProjects.length} of ${projects.length} projects shown` : undefined
          }
        />
      </section>

      <FocusCard
        totalTasks={figures.total}
        completedTasks={figures.completed}
        dueTodayTasks={figures.dueToday}
        overdueTasks={figures.overdue}
        onViewTasks={() => router.push("/tasks")}
        onCreateTask={() => setTaskDialogOpen(true)}
      />

      <section className="mt-7">
        <SectionHeading
          title="Active projects"
          description={
            projects.length === 0
              ? "Nothing filed yet - the button above starts the first."
              : "The latest progress from your team."
          }
          action="View all"
          onAction={() => router.push("/projects")}
        />

        {visibleProjects.length === 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <EmptyState
              message={shown ? `No project matches “${search}”.` : "No projects yet."}
              action={shown ? undefined : "New project"}
              onAction={shown ? undefined : () => setProjectDialogOpen(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={tasks.filter((task) => task.projectId === project.id).length}
                canManage={canManage}
                // No edit or delete here: the overview points at the Projects
                // screen for those, rather than putting a second copy of the
                // confirmation logic on a smaller screen.
                onAddTask={() => setTaskDialogOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-7">
        <SectionHeading
          title="Nearest deadlines"
          description="Five tasks, soonest date first."
          action="View all tasks"
          onAction={() => router.push("/tasks")}
        />
        <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white px-3 shadow-card sm:px-[17px]">
          <TaskList
            tasks={visibleTasks}
            role={user?.role}
            onToggle={toggleTask}
            onClaimAndToggle={claimAndToggle}
            onCreateTask={() => setTaskDialogOpen(true)}
            canCreateTask={apiProjects.length > 0}
            emptyMessage={shown ? `No task matches “${search}”.` : "Nothing on the board yet."}
          />
        </section>
      </section>

      {/* Both dialogs live here rather than in the cards, because the overview
          raises them and the row of cards has no business owning a form. */}
      {projectDialogOpen && <CreateProjectDialog onClose={() => setProjectDialogOpen(false)} />}
      {taskDialogOpen && (
        <CreateTaskDialog
          onClose={() => {
            setTaskDialogOpen(false);
            // The provider appends the new row itself; this picks up anything
            // the server changed alongside it, so the cards are honest.
            void refreshProjects();
          }}
        />
      )}
    </>
  );
}
