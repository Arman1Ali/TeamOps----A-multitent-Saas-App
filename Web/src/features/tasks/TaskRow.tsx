import { Check, Clock3 } from "lucide-react";
import type { Task, TaskPriority } from "../../types/workspace";
import { Avatar } from "../../components/ui/Avatar";

const priorityClasses: Record<TaskPriority, string> = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700",
};

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
};

export function TaskRow({ task, onToggle }: TaskRowProps) {
  return (
    <div className={`group grid min-h-[61px] grid-cols-[19px_minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 last:border-b-0 sm:grid-cols-[20px_minmax(180px,1.8fr)_minmax(120px,1fr)_100px_minmax(126px,1fr)_32px] sm:gap-3 ${task.completed ? "text-slate-400" : ""}`}>
      <button
        type="button"
        className={`grid size-[18px] place-items-center rounded-[5px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
          task.completed
            ? "border-brand bg-brand text-white"
            : "border-slate-300 bg-white text-white hover:border-indigo-400"
        }`}
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        aria-pressed={task.completed}
        onClick={onToggle}
      >
        {task.completed && <Check size={14} />}
      </button>

      <div className="col-start-2 grid min-w-0 gap-0.5 sm:flex sm:items-center sm:gap-2">
        <strong className={`truncate text-[10px] font-semibold ${task.completed ? "line-through" : ""}`}>
          {task.title}
        </strong>
        <span className="truncate text-[9px] text-slate-500 sm:hidden">{task.project}</span>
      </div>

      <span className="hidden truncate text-[9px] text-slate-500 sm:block">{task.project}</span>
      <span className={`col-start-3 row-start-1 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[8px] font-semibold sm:col-auto sm:row-auto ${priorityClasses[task.priority]}`}>
        <span className="size-[5px] rounded-full bg-current" />
        {task.priority}
      </span>
      <span className="col-start-2 row-start-2 -mt-2 flex items-center gap-1.5 whitespace-nowrap text-[8px] text-slate-500 sm:col-auto sm:row-auto sm:mt-0 sm:text-[9px]">
        <Clock3 size={14} />
        {task.dueDate}
      </span>
      <Avatar initials={task.assignee} className="hidden size-[27px] rounded-[9px] border-0 sm:inline-grid" />
    </div>
  );
}
