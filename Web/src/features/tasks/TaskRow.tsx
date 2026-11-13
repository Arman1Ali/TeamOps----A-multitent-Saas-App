/**
 * One task, as a row of the board.
 *
 * This module belongs to the TASKS feature (src/features/tasks).
 *
 * The row is presentational, with one exception: the checkbox. Whether it can
 * be pressed is not a style question - the backend lets an admin, the
 * workspace owner, or the assigned teammate change a task, and nobody else -
 * so the page works that out and passes it in as `canToggle`. A row that
 * offered a tick the server would refuse is a promise the app cannot keep.
 *
 * Everything else is already decided by the time it arrives: `dueDate` is
 * words, `isOverdue` is a flag, `completed` is the status being "Done"
 * (mappers.ts has the whole story).
 */

import { Check, CheckCheck, Clock3 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Task, TaskPriority } from "@/types/ui";

const priorityClasses: Record<TaskPriority, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700",
};

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
  /** Whichever of the three the API would accept for this task. */
  canToggle: boolean;
  /** Nobody holds it, and this person may be the one who does. */
  isUnclaimed: boolean;
};

export function TaskRow({ task, onToggle, canToggle, isUnclaimed }: TaskRowProps) {
  // Pressing a tick on an unclaimed task means "this is mine, and it is
  // finished" - two calls in one, which is what onToggle's caller does.
  // Someone who may not change the task at all gets a disabled box and a
  // reason in its label, not a silent no.
  const blocked = !canToggle;

  return (
    <div
      className={`group grid min-h-[61px] grid-cols-[19px_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 last:border-b-0 sm:grid-cols-[20px_minmax(180px,1.8fr)_minmax(120px,1fr)_100px_minmax(126px,1fr)_32px] sm:gap-3 ${
        task.completed ? "text-slate-400" : ""
      }`}
    >
      <button
        type="button"
        className={`grid size-[18px] place-items-center rounded-[5px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
          task.completed
            ? "border-brand bg-brand text-white"
            : blocked
              ? "border-slate-200 bg-slate-50 text-slate-300"
              : "border-slate-300 bg-white text-white hover:border-indigo-400"
        }`}
        aria-label={
          task.completed
            ? `Mark ${task.title} not done`
            : blocked
              ? `${task.title} - only the assignee, an admin or the owner can change this`
              : isUnclaimed
                ? `Claim and complete ${task.title}`
                : `Complete ${task.title}`
        }
        aria-pressed={task.completed}
        disabled={blocked}
        onClick={onToggle}
      >
        {task.completed ? <Check size={14} /> : isUnclaimed ? <CheckCheck size={12} /> : null}
      </button>

      <div className="col-start-2 grid min-w-0 gap-0.5 sm:flex sm:items-center sm:gap-2">
        <strong className={`truncate text-[10px] font-semibold ${task.completed ? "line-through" : ""}`}>
          {task.title}
        </strong>
        <span className="truncate text-[9px] text-slate-500 sm:hidden">{task.project}</span>
      </div>

      <span className="hidden truncate text-[9px] text-slate-500 sm:block">{task.project}</span>
      <span
        className={`col-start-3 row-start-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-semibold sm:col-auto sm:row-auto ${priorityClasses[task.priority]}`}
      >
        <span className="size-[5px] rounded-full bg-current" />
        {task.priority}
      </span>
      {/* An open task past its date says so in colour, not only in words:
          a list of six "3 d late" rows is hard to scan, and isOverdue comes
          from mappers.ts rather than being worked out again here. */}
      <span
        className={`col-start-2 row-start-2 -mt-2 flex items-center gap-1.5 whitespace-nowrap text-[8px] sm:col-auto sm:row-auto sm:mt-0 sm:text-[9px] ${
          task.isOverdue ? "font-semibold text-amber-600" : "text-slate-500"
        }`}
      >
        <Clock3 size={14} />
        {task.dueDate}
      </span>
      {/* An empty avatar is not a mystery: "" means nobody has taken it. */}
      {task.assignee ? (
        <Avatar initials={task.assignee} className="hidden size-[27px] rounded-[9px] border-0 sm:inline-grid" />
      ) : (
        <span className="hidden text-center text-[8px] text-slate-300 sm:block">—</span>
      )}
    </div>
  );
}
