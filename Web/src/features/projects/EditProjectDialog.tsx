/**
 * Changing a project that already exists.
 *
 * This module belongs to the PROJECTS feature (src/features/projects).
 *
 * Same four fields as the create form, plus progress, and one difference that
 * decides the shape of this file: it only sends what changed.
 *
 * PUT /projects/{id} treats a missing key as "leave that alone", and the
 * backend's own comment says sending due_date as null means "clear the
 * deadline". A form that always sent every field would therefore wipe a
 * deadline the moment somebody moved the progress slider and saved - because
 * the date box was never touched, not because anybody meant to clear it. So
 * the diff is worked out here and handed to patchProject as a list of keys.
 */

"use client";

import { Check, Pencil } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
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
import type { ApiProject, ApiProjectCreate, ApiProjectStatus } from "@/types/api";

const STATUSES: ApiProjectStatus[] = ["On track", "At risk", "Blocked", "Done"];

export function EditProjectDialog({ project, onClose }: { project: ApiProject; onClose: () => void }) {
  const { patchProject } = useWorkspace();
  const { notify } = useUi();

  // Seeded from the row as it arrived. This dialog edits one project and the
  // row it was opened from cannot change underneath it while it is open.
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ApiProjectStatus>(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [dueDate, setDueDate] = useState(project.due_date ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * The keys whose value is not what it was, and how to send each one.
   *
   * `due_date` is the tricky one: it is only sent when the box differs from
   * the stored date, and its value is null when the box is empty - which is
   * what the API needs in order to clear a deadline on purpose.
   */
  const changes = useMemo(() => {
    const fields: Array<keyof ApiProjectCreate> = [];
    const patch: Partial<ApiProjectCreate> = {};

    if (name.trim() !== project.name) {
      fields.push("name");
      patch.name = name.trim();
    }
    if (description.trim() !== project.description) {
      fields.push("description");
      patch.description = description.trim();
    }
    if (status !== project.status) {
      fields.push("status");
      patch.status = status;
    }
    if (progress !== project.progress) {
      fields.push("progress");
      patch.progress = progress;
    }
    if (dueDate !== (project.due_date ?? "")) {
      fields.push("due_date");
      patch.due_date = dueDate || null;
    }

    return { fields, patch };
  }, [name, description, status, progress, dueDate, project]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (changes.fields.length === 0) {
      onClose();

      return;
    }

    setProblem(null);
    setSaving(true);

    try {
      await patchProject(project.id, changes.patch, changes.fields);
      notify(`“${name.trim()}” saved.`, "success");
      onClose();
    } catch (cause) {
      setSaving(false);
      setProblem(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Nothing was saved.",
      );
    }
  }

  return (
    <Dialog
      titleId="edit-project-title"
      heading="Edit project"
      introduction="Only the fields you change are sent back to the server."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Field id="edit-name" label="Project name">
          <input
            id="edit-name"
            autoFocus
            maxLength={100}
            className={fieldInputClasses}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field id="edit-description" label="Description">
          <textarea
            id="edit-description"
            maxLength={500}
            className={fieldAreaClasses}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <Field id="edit-status" label="Status">
            <select
              id="edit-status"
              className={fieldInputClasses}
              value={status}
              onChange={(event) => setStatus(event.target.value as ApiProjectStatus)}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field id="edit-due-date" label="Deadline" hint="Emptying this clears the deadline.">
            <input
              id="edit-due-date"
              type="date"
              className={fieldInputClasses}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
        </div>

        {/* The value is written beside the slider because a range input's
            number is not read out by every browser, and "progress" without a
            figure is not much of a label. */}
        <Field id="edit-progress" label={`Progress - ${progress}%`}>
          <input
            id="edit-progress"
            type="range"
            min={0}
            max={100}
            step={5}
            className="h-10 w-full accent-[var(--color-brand)]"
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
          />
        </Field>

        {problem && (
          <p className="m-0 mb-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700" role="alert">
            {problem}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={dialogCancelButtonClasses} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={dialogPrimaryButtonClasses}
            disabled={saving || changes.fields.length === 0}
          >
            {saving ? <Check size={16} /> : <Pencil size={15} />}
            {saving ? "Saving…" : changes.fields.length === 0 ? "Nothing to save" : "Save changes"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
