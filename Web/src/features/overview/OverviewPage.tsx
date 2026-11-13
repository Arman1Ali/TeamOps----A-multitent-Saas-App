import { useMemo } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, FolderKanban, Users } from "lucide-react";
import type { Project, Task } from "../../types/workspace";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { TaskList } from "../tasks/TaskList";
import { ProjectCard } from "../projects/ProjectCard";
import { FocusCard } from "./FocusCard";
import { StatCard } from "./StatCard";

type OverviewPageProps = {
  projects: Project[];
  tasks: Task[];
  onViewProjects: () => void;
  onViewTasks: () => void;
  onCreateProject: () => void;
  onToggleTask: (taskId: string) => void;
};

export function OverviewPage({
  projects,
  tasks,
  onViewProjects,
  onViewTasks,
  onCreateProject,
  onToggleTask,
}: OverviewPageProps) {
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "Completed").length,
    [projects],
  );
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase();

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4 sm:items-center">
        <div>
          <span className="text-[9px] font-bold tracking-[1.15px] text-slate-400">{today}</span>
          <h1 className="mb-1 mt-1.5 font-display text-lg font-bold tracking-tight sm:text-[23px]">
            Good morning, Alex <span className="text-amber-400">✦</span>
          </h1>
          <p className="m-0 text-[9px] text-slate-500 sm:text-[11px]">
            Here&apos;s what&apos;s happening with your team today.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-2.5 text-[0px] font-bold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-px hover:bg-brand-dark sm:px-3.5 sm:text-[11px]"
          aria-label="New project"
          onClick={onCreateProject}
        >
          <span className="text-base">+</span><span className="hidden sm:inline">New project</span>
        </button>
      </div>

      <section className="grid grid-cols-2 gap-2.5 xl:grid-cols-4" aria-label="Workspace summary">
        <StatCard
          icon={<CheckCircle2 size={19} />}
          tone="indigo"
          label="Tasks completed"
          value={12 + completedTasks}
          note={<><ArrowUpRight size={13} /> 18% this week</>}
        />
        <StatCard
          icon={<Clock3 size={19} />}
          tone="amber"
          label="Due today"
          value={4}
          note={<><span className="size-1.5 rounded-full bg-amber-500" /> 2 high priority</>}
        />
        <StatCard
          icon={<FolderKanban size={19} />}
          tone="emerald"
          label="Active projects"
          value={activeProjects}
          note={<><ArrowUpRight size={13} /> 2 near completion</>}
        />
        <StatCard
          icon={<Users size={19} />}
          tone="sky"
          label="Team online"
          value={8}
          note={<><span className="size-1.5 rounded-full bg-emerald-500" /> All looking good</>}
        />
      </section>

      <FocusCard onViewTasks={onViewTasks} />

      <section className="mt-7">
        <SectionHeading
          title="Active projects"
          description="The latest progress from your team."
          action="View all"
          onAction={onViewProjects}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.filter((project) => project.status !== "Completed").slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionHeading
          title="Recent tasks"
          description="A few things on your team's plate."
          action="View all tasks"
          onAction={onViewTasks}
        />
        <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white px-3 shadow-card sm:px-[17px]">
          <TaskList tasks={tasks} onToggle={onToggleTask} />
        </section>
      </section>
    </>
  );
}
