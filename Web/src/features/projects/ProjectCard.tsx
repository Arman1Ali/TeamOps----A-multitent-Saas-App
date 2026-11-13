/**
 * One project, as a card.
 *
 * This module belongs to the PROJECTS feature (src/features/projects).
 *
 * It draws a Project from src/types/ui.ts - already words and colours, worked
 * out in mappers.ts - so there is no date formatting and no status translation
 * in here. What it does own is the small pile of decisions that only a card
 * can make:
 *
 *   * which of the four accents to show, from project.tone;
 *   * which actions to offer, from the signed-in person's role - the API
 *     refuses a member who tries to change or delete a project, so offering
 *     them the button would only be setting up a red box;
 *   * how many tasks are inside it, passed in by the page that already has
 *     the whole task list rather than fetched here per card.
 *
 * The card is not a link. Its actions are buttons, and one of them goes to the
 * Tasks screen filtered to this project.
 */

import { BriefcaseBusiness, CalendarDays, ClipboardList, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { AvatarStack } from "@/components/ui/Avatar";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Project, ProjectStatus, ProjectTone } from "@/types/ui";

const toneClasses: Record<ProjectTone, string> = {
  lavender: "bg-indigo-50 text-indigo-600",
  mint: "bg-emerald-50 text-emerald-600",
  peach: "bg-amber-50 text-amber-600",
  blue: "bg-sky-100 text-sky-600",
};

/**
 * Every status the API can send, in the words of its Literal.
 *
 * "Blocked" was missing from the Vite version, so a project in that state
 * would have looked up `statusClasses["Blocked"]` and been handed undefined -
 * a card with no badge at all.
 */
const statusClasses: Record<ProjectStatus, string> = {
  "On track": "bg-emerald-50 text-emerald-700",
  "At risk": "bg-amber-50 text-amber-700",
  Blocked: "bg-red-50 text-red-700",
  Done: "bg-indigo-50 text-indigo-700",
};

type ProjectCardProps = {
  project: Project;
  /** How many tasks this project holds - the page counts them once. */
  taskCount: number;
  /** Owner or admin only, which is exactly what PUT and DELETE /projects ask. */
  canManage: boolean;
  /**
   * The two changes, and the card shows the two menu lines only when the
   * caller passes them. The overview has no room for a delete confirmation,
   * so it draws the same card with navigation and nothing else, and the
   * Projects screen is where a project is edited or removed.
   */
  onEdit?: () => void;
  onDelete?: () => void;
  onAddTask: () => void;
};

export function ProjectCard({ project, taskCount, canManage, onEdit, onDelete, onAddTask }: ProjectCardProps) {
  return (
    <article className="min-w-0 rounded-[13px] border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className={`grid size-[37px] place-items-center rounded-[11px] ${toneClasses[project.tone]}`}>
          <BriefcaseBusiness size={19} strokeWidth={1.8} />
        </div>
        <Menu label={`More options for ${project.name}`} icon={<Ellipsis size={19} />}>
          {/* Each of these is a different kind of action: one navigates, one
              opens a form, one asks the server to erase something. They are
              apart in the menu because they are apart in consequence. */}
          <MenuItem
            icon={<ClipboardList size={14} />}
            label="See its tasks"
            href={`/tasks?project=${project.id}`}
          />
          <MenuItem icon={<Plus size={14} />} label="Add a task" onClick={onAddTask} />
          {onEdit && (
            <MenuItem
              icon={<Pencil size={14} />}
              label="Edit project"
              onClick={onEdit}
              disabled={!canManage}
            />
          )}
          {onDelete && (
            <MenuItem
              icon={<Trash2 size={14} />}
              label="Delete project"
              tone="danger"
              onClick={onDelete}
              disabled={!canManage}
            />
          )}
        </Menu>
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
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-semibold ${statusClasses[project.status]}`}
        >
          <span className="size-[5px] rounded-full bg-current" />
          {project.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[9px] text-slate-500">
        <CalendarDays size={14} />
        <span>Due {project.dueDate}</span>
        {/* How much work is in here, and the server's rule in one line: a
            member who wonders why there is no edit button is told rather than
            left to guess, and a number is shown where a number belongs. */}
        <span className="ml-auto text-slate-400">
          {taskCount === 0 ? "No tasks yet" : `${taskCount} task${taskCount === 1 ? "" : "s"}`}
          {canManage ? "" : " · owner manages"}
        </span>
      </div>
    </article>
  );
}
