/**
 * The form that files a new project.
 *
 * This module belongs to the PROJECTS feature (src/features/projects), even
 * though it is drawn over other screens: it is opened from the overview, from
 * the projects page and from an empty state, and all three should get exactly
 * the same form.
 *
 * It holds the fields and nothing else. Saving goes through
 * useWorkspace().addProject, which calls POST /projects and puts the answer in
 * the shared list - so this file has no idea where the project ends up, and
 * cannot get that wrong.
 *
 * What is not here matters as much: no `company_id`. The workspace comes from
 * the token, and a form that sent one would be asking the server to file data
 * somewhere its caller does not belong.
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
import type { ApiProjectStatus } from "@/types/api";

/** The four choices the backend's Literal accepts, in the order they read. */
const STATUSES: ApiProjectStatus[] = ["On track", "At risk", "Blocked", "Done"];

export function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const { addProject } = useWorkspace();
  const { notify } = useUi();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ApiProjectStatus>("On track");
  const [dueDate, setDueDate] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProblem(null);
    setSaving(true);

    try {
      const project = await addProject({
        name: name.trim(),
        description: description.trim(),
        status,
        // An empty date input is "" rather than null, and the API answers 422
        // for that, so the conversion happens here and nowhere else.
        due_date: dueDate || null,
      });
      notify(`“${project.name}” created.`, "success");
      onClose();
    } catch (cause) {
      setSaving(false);
      setProblem(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Check that the API is running.",
      );
      // Leaving the fields filled is deliberate: the person has to change one
      // thing, not type a whole project again.
    }
  }

  return (
    <Dialog
      titleId="create-project-title"
      heading="Create a project"
      introduction="Everything except the name can be changed later."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <Field id="project-name" label="Project name">
          <input
            id="project-name"
            autoFocus
            maxLength={100}
            className={fieldInputClasses}
            placeholder="e.g. Website Redesign"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field id="project-description" label="Description" hint="What this project is for, in a sentence.">
          <textarea
            id="project-description"
            maxLength={500}
            className={fieldAreaClasses}
            placeholder="Optional"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <Field id="project-status" label="Status">
            <select
              id="project-status"
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

          {/* type="date" sends "YYYY-MM-DD", which is the format the API's
              `date` field reads. Anything else would be a 422. */}
          <Field id="project-due-date" label="Deadline">
            <input
              id="project-due-date"
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
            <Plus size={16} /> {saving ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
