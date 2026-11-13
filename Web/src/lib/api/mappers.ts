/**
 * API response -> something a component can draw.
 *
 * This module belongs to the API layer (src/lib/api).
 *
 * This is the only file that knows both sides, and that is the point. Date
 * wording, avatar colours and the "completed" flag live here, so a component
 * never has to guess what the backend sent and never has to format a date in
 * its own peculiar way. Twelve components each writing "Sep 28" is how an app
 * ends up with twelve date bugs.
 */

import type { ApiProject, ApiTask, ApiUser, ApiUserRole } from "@/types/api";
import type { Project, ProjectTone, Task, TeamMember } from "@/types/ui";

/**
 * Read "2026-09-28" as the local date it names.
 *
 * `new Date("2026-09-28")` is the trap this avoids: JavaScript parses a bare
 * ISO date as midnight UTC, so in a timezone behind Greenwich the whole world
 * sees "Sep 27". Splitting the string and building a local date is two lines
 * and correct everywhere.
 */
function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Today at midnight, so "days until" counts whole days rather than hours. */
function startOfToday(): Date {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from today to `date`. Negative when the date has passed. */
function daysFromToday(date: Date): number {
  const day = 24 * 60 * 60 * 1000;

  return Math.round((date.getTime() - startOfToday().getTime()) / day);
}

/** "Sep 28", or "Sep 28, 2027" when the year is not this one. */
function formatDay(date: Date): string {
  const sameYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export type DueDateView = {
  /** Words for the screen: "Today", "3 d late", "Sep 28", "No deadline". */
  label: string;
  /** Past, still open, and therefore worth painting amber. */
  isOverdue: boolean;
  /** The deadline is today - what the overview's "due today" count reads. */
  isToday: boolean;
};

/**
 * Say when a deadline is, in the few words a table cell has room for.
 *
 * `completed` matters: a finished task whose date came around is not late, it
 * is just done. Showing it as overdue would be a lie the board tells you.
 */
export function describeDueDate(value: string | null, completed = false): DueDateView {
  if (!value) return { label: "No deadline", isOverdue: false, isToday: false };

  const date = parseIsoDate(value);
  const difference = daysFromToday(date);

  if (difference === 0) return { label: "Today", isOverdue: !completed, isToday: true };
  if (difference === 1) return { label: "Tomorrow", isOverdue: false, isToday: false };
  if (difference === -1) return { label: "Yesterday", isOverdue: !completed, isToday: false };

  if (difference < 0) {
    return {
      label: completed ? formatDay(date) : `${Math.abs(difference)} d late`,
      isOverdue: !completed,
      isToday: false,
    };
  }

  return { label: formatDay(date), isOverdue: false, isToday: false };
}

/** The four card accents, chosen by id so a project keeps its colour. */
const TONES: ProjectTone[] = ["lavender", "mint", "peach", "blue"];

/**
 * Pick a card colour from the project id.
 *
 * There is no colour in the database, and inventing one per render would make
 * the same project change hue between two screens. Taking it from the id is
 * stable and needs no new column.
 */
export function projectToneFor(id: number): ProjectTone {
  return TONES[Math.abs(id) % TONES.length] ?? "lavender";
}

/** Avatar classes, from the palette the design already used for people. */
const AVATAR_STYLES = [
  "bg-violet-100 text-violet-800",
  "bg-sky-100 text-sky-800",
  "bg-pink-100 text-pink-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
];

function avatarStyleFor(id: number): string {
  return AVATAR_STYLES[Math.abs(id) % AVATAR_STYLES.length] ?? AVATAR_STYLES[0];
}

const ROLE_LABELS: Record<ApiUserRole, string> = {
  owner: "Workspace owner",
  admin: "Admin",
  member: "Member",
};

/**
 * One project row, plus the people its tasks name.
 *
 * `tasks` is the workspace's whole task list, not a request per project: the
 * card shows the initials of whoever has work in it, and the only honest
 * source for that is the assignees already loaded on the same screen.
 */
export function toProject(project: ApiProject, tasks: ApiTask[]): Project {
  const people = new Map<number, string>();

  for (const task of tasks) {
    if (task.project_id === project.id && task.assignee) {
      people.set(task.assignee.id, task.assignee.initials);
    }
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description || "No description yet",
    progress: project.progress,
    dueDate: describeDueDate(project.due_date, project.status === "Done").label,
    status: project.status,
    team: [...people.values()],
    tone: projectToneFor(project.id),
  };
}

/**
 * One task row.
 *
 * `completed` is not a column in the database - it is the status being "Done",
 * which is all the checkbox needs to know. Un-ticking a task cannot therefore
 * send "not Done": the row keeps the status it had a moment ago in the hook's
 * state (useWorkspace.ts -> toggleTask) and sends that back.
 */
export function toTask(task: ApiTask, myUserId: number | null): Task {
  const completed = task.status === "Done";
  const due = describeDueDate(task.due_date, completed);

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    project: task.project.name,
    projectId: task.project_id,
    dueDate: due.label,
    isOverdue: due.isOverdue,
    isDueToday: due.isToday,
    priority: task.priority,
    status: task.status,
    completed,
    assignee: task.assignee?.initials ?? "",
    assigneeId: task.assigned_to,
    isMine: myUserId !== null && task.assigned_to === myUserId,
  };
}

/** A person, as the Team screen shows them. */
export function toTeamMember(user: ApiUser, myUserId: number): TeamMember {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // The backend derives initials from the name; nothing here recomputes them.
    initials: user.initials,
    roleLabel: ROLE_LABELS[user.role],
    avatar: avatarStyleFor(user.id),
    isSelf: user.id === myUserId,
  };
}
