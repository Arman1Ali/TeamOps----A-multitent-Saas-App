import type { Task } from "../../types/workspace";
import { EmptyState } from "../../components/ui/EmptyState";
import { TaskRow } from "./TaskRow";

type TaskListProps = {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  emptyMessage?: string;
};

export function TaskList({
  tasks,
  onToggle,
  emptyMessage = "No tasks match your search.",
}: TaskListProps) {
  return (
    <div>
      <div className="hidden min-h-9 grid-cols-[20px_minmax(180px,1.8fr)_minmax(120px,1fr)_100px_minmax(126px,1fr)_32px] items-center gap-3 border-b border-slate-100 text-[9px] text-slate-400 sm:grid">
        <span />
        <span>Task</span>
        <span>Project</span>
        <span>Priority</span>
        <span>Due date</span>
        <span className="sr-only">Assignee</span>
      </div>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={() => onToggle(task.id)} />
      ))}
      {tasks.length === 0 && <EmptyState message={emptyMessage} />}
    </div>
  );
}
