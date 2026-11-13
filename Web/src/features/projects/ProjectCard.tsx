import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Ellipsis } from "lucide-react";
import type { Project, ProjectTone } from "../../types/workspace";
import { AvatarStack } from "../../components/ui/Avatar";
import { IconButton } from "../../components/ui/IconButton";
import { ProgressBar } from "../../components/ui/ProgressBar";

const toneClasses: Record<ProjectTone, string> = {
  lavender: "bg-indigo-50 text-indigo-600",
  mint: "bg-emerald-50 text-emerald-600",
  peach: "bg-amber-50 text-amber-600",
  blue: "bg-sky-50 text-sky-600",
};

const statusClasses = {
  "On track": "bg-emerald-50 text-emerald-700",
  "At risk": "bg-amber-50 text-amber-700",
  Completed: "bg-indigo-50 text-indigo-700",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="min-w-0 rounded-[13px] border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className={`grid size-[37px] place-items-center rounded-[11px] ${toneClasses[project.tone]}`}>
          <BriefcaseBusiness size={19} strokeWidth={1.8} />
        </div>
        <IconButton
          variant="quiet"
          className="size-[30px]"
          aria-label={`More options for ${project.name}`}
        >
          <Ellipsis size={19} />
        </IconButton>
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="m-0 truncate text-xs font-bold text-slate-800">{project.name}</h3>
        <p className="m-0 mt-1 truncate text-[9px] text-slate-500">{project.description}</p>
      </div>

      <div className="my-3 flex justify-between text-[9px] text-slate-500">
        <span>Progress</span>
        <strong className="text-[10px] text-brand">{project.progress}%</strong>
      </div>
      <ProgressBar value={project.progress} label={project.name} />

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <AvatarStack people={project.team} />
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-semibold ${statusClasses[project.status]}`}>
          <span className="size-[5px] rounded-full bg-current" />
          {project.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[9px] text-slate-500">
        <CalendarDays size={14} />
        <span>Due {project.dueDate}</span>
        <ArrowUpRight size={14} className="ml-auto text-slate-400" />
      </div>
    </article>
  );
}
