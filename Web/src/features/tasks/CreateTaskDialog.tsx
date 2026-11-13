/**
 * The form that adds work to a project.
 *
 * This module belongs to the TASKS feature (src/features/tasks).
 *
 * Two fields come from lists the workspace already holds rather than being
 * typed: the project a task belongs to (POST /tasks refuses a project from
 * another workspace, so only your own are offered) and the person it is
 * handed to (same rule, checked against your company). Choosing rather than
 * typing is what keeps a 422 or a 403 from being the usual outcome.
 *
 * Saving goes through useWorkspace().addTask, which appends the server's row -
 * including its nested project and assignee - so the new task appears on the
 * board already shaped like everything else.
 */

"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Dialog,
  Field,
  dialogCancelButtonClasses,
  dialogPrimaryButtonClasses,
  fieldAreaClasses,
  fieldInputClasses,
} from "@/components/ui/Dialog";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ApiError } from "@/lib/api/http";
import type { ApiTaskPriority, ApiTaskStatus } from "@/types/api";

const STATUSES: ApiTaskStatus[] = ["To do", "In progress", "Done"];
const PRIORITIES: ApiTaskPriority[] = ["High", "Medium", "Low"];

/** The "nobody has taken this" option, spelled the way the API wants it. */
const UNASSIGNED = "none";

export function CreateTaskDialog({
  defaultProjectId,
  onClose,
}: {
  /** Opens pre-pointed at this project, when launched from a card. */
  defaultProjectId?: number;
  onClose: () => void;
}) {
  const { apiProjects, apiUsers, addTask } = useWorkspace();
  const { notify } = useUi();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(String(defaultProjectId ?? apiProjects[0]?.id ?? ""));
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED);
  const [status, setStatus] = useState<ApiTaskStatus>("To do");
  const [priority, setPriority] = useState<ApiTaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // A task must live in a project, and there is no such thing as a task with
    // no title. Both are caught here so the answer is a sentence rather than
    // a 422 from Pydantic.
    if (!title.trim() || !projectId) {
      setProblem(!title.trim() ? "A task needs a title." : "Pick the project this belongs to.");

      return;
    }

    setProblem(null);
    setSaving(true);

    try {
      const task = await addTask({
        title: title.trim(),
        description: description.trim(),
        project_id: Number(projectId),
        assigned_to: assigneeId === UNASSIGNED ? null : Number(assigneeId),
        status,
        priority,
        due_date: dueDate || null,
      });
      notify(`“${task.title}” added to ${task.project.name}.`, "success");
      onClose();
    } catch (cause) {
      setSaving(false);
      setProblem(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Check that the API is running.",
      );
    }
  }

  if (apiProjects.length === 0) {
    // Not an error state: there is genuinely nowhere to put a task. Saying so
    // beats showing a form whose only required dropdown is empty.
    return (
      <Dialog
        titleId="create-task-title"
        heading="No project yet"
        introduction="A task always belongs to a project, so make one first."
        onClose={onClose}
      >
        <div className="flex justify-end">
          <button type="button" className={dialogCancelButtonClasses} onClick={onClose}>
            Close
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      titleId="create-task-title"
      heading="Add a task"
      introduction="Whoever you assign it to can tick it off."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Field id="task-title" label="Task">
          <input
            id="task-title"
            autoFocus
            maxLength={100}
            className={fieldInputClasses}
            placeholder="e.g. Redraw the pricing table"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </Field>

        <Field id="task-description" label="Description" hint="Optional. What does done look like?">
          <textarea
            id="task-description"
            maxLength={1000}
            className={fieldAreaClasses}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <Field id="task-project" label="Project">
            <select
              id="task-project"
              className={fieldInputClasses}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              required
            >
              {apiProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="task-assignee" label="Assignee">
            <select
              id="task-assignee"
              className={fieldInputClasses}
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value={UNASSIGNED}>Nobody yet</option>
              {apiUsers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mb-3.5 grid grid-cols-3 gap-3">
          <Field id="task-status" label="Status">
            <select
              id="task-status"
              className={fieldInputClasses}
              value={status}
              onChange={(event) => setStatus(event.target.value as ApiTaskStatus)}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field id="task-priority" label="Priority">
            <select
              id="task-priority"
              className={fieldInputClasses}
              value={priority}
              onChange={(event) => setPriority(event.target.value as ApiTaskPriority)}
            >
              {PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field id="task-due-date" label="Deadline">
            <input
              id="task-due-date"
              type="date"
              className={fieldInputClasses}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
        </div>

        {problem && (
          <p className="m-0 mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
            {problem}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={dialogCancelButtonClasses} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={dialogPrimaryButtonClasses} disabled={saving}>
            <Plus size={16} /> {saving ? "Adding…" : "Add task"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
