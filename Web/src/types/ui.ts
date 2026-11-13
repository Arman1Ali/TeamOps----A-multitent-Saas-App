/**
 * The shapes the components draw on screen.
 *
 * These are NOT the API's shapes - src/types/api.ts holds those. A screen needs
 * "Sep 28" rather than "2026-09-28", and a coloured dot rather than the number
 * 4, so something has to translate. That translation happens in exactly one
 * place, src/lib/api/mappers.ts, and lands in these types.
 *
 * Keeping them apart is what stops date formatting from leaking into twelve
 * components, where twelve slightly different versions of it would appear.
 */

import type { ApiTaskStatus } from "./api";

/** Which of the four screens is open. Also the sidebar's labels. */
export type AppView = "Overview" | "Projects" | "Tasks" | "Team";

/** A project's state, in the words the filters use. */
export type ProjectStatus = "On track" | "At risk" | "Blocked" | "Done";

/**
 * The four card accent colours. There is no colour in the database, so one is
 * chosen per project from its id - see mappers.ts -> projectToneFor().
 */
export type ProjectTone = "lavender" | "mint" | "peach" | "blue";

export type TaskPriority = "High" | "Medium" | "Low";

/** A project as a card shows it. */
export type Project = {
  id: number;
  name: string;
  description: string;
  /** 0-100, straight from the API. */
  progress: number;
  /** Already words: "Sep 28", or "No deadline" when the API sent null. */
  dueDate: string;
  status: ProjectStatus;
  /**
   * Initials of the people working on it, taken from the assignees of that
   * project's tasks. The API has no project-members table, and inventing one
   * in the frontend would be a fiction, so this is real data read another way.
   */
  team: string[];
  tone: ProjectTone;
};

/** A task as a row shows it. */
export type Task = {
  id: number;
  title: string;
  description: string;
  /** The project's name, for the row's second column. */
  project: string;
  projectId: number;
  /** "Today", "3 d late", "Sep 28" - see mappers.ts -> describeDueDate(). */
  dueDate: string;
  /** When the deadline passed and the task is still open. */
  isOverdue: boolean;
  /** The deadline is today - what the header's bell counts. */
  isDueToday: boolean;
  priority: TaskPriority;
  /** The API's own status, needed when writing the change back. */
  status: ApiTaskStatus;
  /** The checkbox: true once the status is "Done". */
  completed: boolean;
  /** Initials of whoever holds it, or "" when it is unclaimed. */
  assignee: string;
  assigneeId: number | null;
  /** True when the signed-in user holds it - they may always tick it off. */
  isMine: boolean;
};

/** A person on the Team screen. */
export type TeamMember = {
  id: number;
  name: string;
  email: string;
  initials: string;
  /** "Workspace owner", "Admin", "Member" - a label, not the raw role. */
  roleLabel: string;
  /** Tailwind classes for the avatar, chosen from the id. */
  avatar: string;
  isSelf: boolean;
};

/** The chips above the project grid. */
export type ProjectFilter = "All projects" | "Active" | ProjectStatus;
