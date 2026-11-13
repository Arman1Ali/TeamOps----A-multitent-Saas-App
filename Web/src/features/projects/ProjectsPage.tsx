/**
 * The Projects screen: every project in the workspace, and the ways to change
 * one of them.
 *
 * This module belongs to the PROJECTS feature (src/features/projects).
 *
 * Three things happen in this file and nowhere else:
 *
 *   * the filter chips and the search box are combined into one list. Both are
 *     over rows already in memory, so neither is a request;
 *   * the dialogs that change a project live here, in the screen that owns the
 *     cards, rather than inside a card that would then need its own copy of
 *     the same three forms;
 *   * the delete confirmation says how many tasks go with the project, because
 *     that is the part nobody thinks about until it has happened.
 */

"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignedOutRedirect } from "@/app/SignedOutRedirect";
import { CreateProjectDialog } from "@/features/projects/CreateProjectDialog";
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { mayManageWorkspace } from "@/lib/auth/permissions";
import type { ApiProject } from "@/types/api";
import type { Project, ProjectFilter } from "@/types/ui";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";

/**
 * Whether one card should be on screen.
 *
 * "Active" is not a value the backend has - it means "not Done", which is the
 * only reading of that chip that agrees with what the old app did and with
 * what the word means. Everything else compares the status directly.
 */
function matchesFilter(project: Project, filter: ProjectFilter): boolean {
  if (filter === "All projects") return true;
  if (filter === "Active") return project.status !== "Done";

  return project.status === filter;
}

/** "1 task", "4 tasks" - the two places a count is read out say it alike. */
function taskCountText(count: number): string {
  return `${count} task${count === 1 ? "" : "s"}`;
}

export function ProjectsPage() {
  const { status, user } = useAuth();
  const { projects, tasks, apiProjects, isLoading, error, reload, dropProject } = useWorkspace();
  const { search, notify } = useUi();

  const [filter, setFilter] = useState<ProjectFilter>("All projects");
  const [creating, setCreating] = useState(false);
  // The edit form is seeded from the API's row rather than from the card's
  // view model: a card shows "Sep 28" and a colour, and the form needs
  // "2026-09-28" and the number it started on to know what changed.
  const [editing, setEditing] = useState<ApiProject | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [addingTaskTo, setAddingTaskTo] = useState<Project | null>(null);

  const shown = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          matchesFilter(project, filter) &&
          (!shown ||
            project.name.toLowerCase().includes(shown) ||
            project.description.toLowerCase().includes(shown)),
      ),
    [projects, filter, shown],
  );

  if (status === "signed-out") return <SignedOutRedirect />;
  if (isLoading) return <LoadingState rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const canManage = mayManageWorkspace(user?.role);
  const nothingAtAll = projects.length === 0;
  // Counted once here rather than twice in the confirmation below - once in
  // the sentence warning what is about to be lost, once in the sentence
  // saying what was lost - so the two cannot disagree.
  const deletingTaskCount = deleting
    ? tasks.filter((task) => task.projectId === deleting.id).length
    : 0;

  return (
    <>
      <SectionHeading
        eyebrow={user?.company?.name?.toUpperCase() ?? "YOUR WORKSPACE"}
        title="Projects"
        description={
          nothingAtAll
            ? "A project is where the tasks live. Start the first one."
            : `${projects.length} in this workspace, ${visible.length} shown.`
        }
        action="New project"
        onAction={() => setCreating(true)}
      />

      <ProjectFilters value={filter} onChange={setFilter} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            taskCount={tasks.filter((task) => task.projectId === project.id).length}
            canManage={canManage}
            onEdit={() => setEditing(apiProjects.find((row) => row.id === project.id) ?? null)}
            onDelete={() => setDeleting(project)}
            onAddTask={() => setAddingTaskTo(project)}
          />
        ))}

        {visible.length === 0 && (
          <EmptyState
            message={
              nothingAtAll
                ? "This workspace has no projects yet."
                : shown
                  ? `Nothing matches “${search}”${filter === "All projects" ? "" : ` in ${filter}`}.`
                  : `No project is ${filter.toLowerCase()}.`
            }
            action={nothingAtAll ? "New project" : "Show all projects"}
            onAction={nothingAtAll ? () => setCreating(true) : () => setFilter("All projects")}
          />
        )}
      </div>

      {creating && <CreateProjectDialog onClose={() => setCreating(false)} />}

      {editing && <EditProjectDialog project={editing} onClose={() => setEditing(null)} />}

      {addingTaskTo && (
        <CreateTaskDialog defaultProjectId={addingTaskTo.id} onClose={() => setAddingTaskTo(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          titleId="delete-project-title"
          heading={`Delete “${deleting.name}”?`}
          consequence={`${taskCountText(deletingTaskCount)} inside it go as well. The API removes them with the project, and this cannot be undone.`}
          confirmLabel="Delete project"
          // Saying what happened after a delete is the caller's job, not the
          // confirmation box's: the card leaving the grid is proof enough that
          // the click landed, but the count that went with it is information
          // only this screen has.
          onConfirm={async () => {
            await dropProject(deleting.id);
            notify(
              `“${deleting.name}” deleted${
                deletingTaskCount ? `, with ${taskCountText(deletingTaskCount)} inside it` : ""
              }.`,
              "success",
            );
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
