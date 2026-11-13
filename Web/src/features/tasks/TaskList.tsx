/**
 * The table of tasks, and the one decision every row needs made for it.
 *
 * This module belongs to the TASKS feature (src/features/tasks).
 *
 * TaskRow is told whether it may be ticked rather than working it out, because
 * the rule lives on the server (app/services/common.py -> can_manage_task) and
 * repeating it in a row would mean two copies that can disagree. This list is
 * the one place that has both the signed-in person's role and the whole set of
 * rows, so it is the place to translate the rule into a boolean per row.
 *
 * The column widths are written once here in the header row and mirrored in
 * TaskRow's grid, which is the usual fragile part of any table: they are kept
 * adjacent in the comment below so a change is obvious in both.
 */

import { EmptyState } from "@/components/ui/EmptyState";
import { mayChangeTask } from "@/lib/auth/permissions";
import { TaskRow } from "./TaskRow";
import type { ApiUserRole } from "@/types/api";
import type { Task } from "@/types/ui";

type TaskListProps = {
  tasks: Task[];
  /** The signed-in person's role, from the token's user. */
  role?: ApiUserRole;
  /** Ticking a task the reader already holds, or un-ticking a finished one. */
  onToggle: (taskId: number) => void;
  /** Ticking a task nobody holds: claim it, then finish it. */
  onClaimAndToggle: (taskId: number) => void;
  /** Offered a way out of "nothing here", because the reasons differ. */
  onCreateTask?: () => void;
  emptyMessage?: string;
  /** Whether the empty list is worth a button: no projects means no, and the
   *  caller decides, since only it knows whether a project exists. */
  canCreateTask?: boolean;
};

export function TaskList({
  tasks,
  role,
  onToggle,
  onClaimAndToggle,
  onCreateTask,
  emptyMessage = "No tasks match your search.",
  canCreateTask = true,
}: TaskListProps) {
  return (
    <div>
      {/* grid-cols-[20px_minmax(180px,1.8fr)_minmax(120px,1fr)_100px_minmax(126px,1fr)_32px]
          is the same string TaskRow uses from md upwards. Change one, change
          the other, or the header stops naming the columns underneath it. */}
      <div className="hidden min-h-9 grid-cols-[20px_minmax(180px,1.8fr)_minmax(120px,1fr)_100px_minmax(126px,1fr)_32px] items-center gap-3 border-b border-slate-100 text-[9px] text-slate-400 sm:grid">
        <span />
        <span>Task</span>
        <span>Project</span>
        <span>Priority</span>
        <span>Due date</span>
        <span className="sr-only">Assignee</span>
      </div>

      {tasks.map((task) => {
        const allowed = mayChangeTask(role, task.isMine);
        const unclaimed = task.assigneeId === null && !task.completed;

        return (
          <TaskRow
            key={task.id}
            task={task}
            canToggle={allowed}
            isUnclaimed={unclaimed && allowed}
            onToggle={() => (unclaimed ? onClaimAndToggle(task.id) : onToggle(task.id))}
          />
        );
      })}

      {tasks.length === 0 && (
        <EmptyState
          message={emptyMessage}
          action={canCreateTask ? "Add a task" : undefined}
          onAction={canCreateTask ? onCreateTask : undefined}
        />
      )}
    </div>
  );
}
