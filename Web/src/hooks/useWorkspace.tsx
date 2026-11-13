/**
 * The workspace's data: its projects, its tasks, its people.
 *
 * This module belongs to the HOOKS layer (src/hooks).
 *
 * Why one provider for all three, when there are four screens:
 *
 *   * the overview shows projects and tasks side by side, and a project card
 *     wants the initials of the people with tasks in it - the two lists are
 *     already the same conversation;
 *   * four screens each fetching their own copy means four requests on every
 *     navigation, and four versions of "loading" that never quite agree;
 *   * one place to retry when the network fails, and one place an action can
 *     refresh what it changed.
 *
 * Nothing here decides what a screen looks like. It holds the data, runs the
 * calls, and rolls back what the server refused.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createProject, deleteProject, listProjects, updateProject } from "@/lib/api/projects";
import { createTask, listTasks, updateTask } from "@/lib/api/tasks";
import { inviteUser, listUsers, removeUser, updateUser } from "@/lib/api/team";
import { ApiError } from "@/lib/api/http";
import { toProject, toTask, toTeamMember } from "@/lib/api/mappers";
import { useAuth } from "./useAuth";
import type {
  ApiProject,
  ApiProjectCreate,
  ApiTask,
  ApiTaskCreate,
  ApiUser,
  ApiUserCreate,
  ApiUserRole,
} from "@/types/api";
import type { Project, Task, TeamMember } from "@/types/ui";

type WorkspaceValue = {
  // --- raw API rows, in the order the backend sent them -----------------
  apiProjects: ApiProject[];
  apiTasks: ApiTask[];
  apiUsers: ApiUser[];

  // --- the same data, ready to draw -------------------------------------
  projects: Project[];
  tasks: Task[];
  members: TeamMember[];

  // --- the three states every screen has to answer ----------------------
  /** True only during the first load; a refresh keeps the rows on screen. */
  isLoading: boolean;
  /** Words to show in the error state, or null when all is well. */
  error: string | null;
  /** False while the API is unreachable - the footer chip reads this. */
  isLive: boolean;
  /** When the data was last successfully read, for the footer chip. */
  lastLoadedAt: Date | null;

  reload: () => Promise<void>;
  /**
   * Re-read the projects from the API.
   *
   * `progress` is a stored column, not something the server works out from
   * the tasks in a project - so adding or finishing a task does not change it
   * on its own. A screen that wants the cards to reflect what it just did
   * still has to ask for the rows again, which is what this is for.
   */
  refreshProjects: () => Promise<void>;

  // --- the writes the screens offer -------------------------------------
  addProject: (input: ApiProjectCreate) => Promise<ApiProject>;
  /**
   * `sendFields` says which keys really were changed, so a left-alone
   * deadline is not sent as a clear. See projects.ts -> updateProject.
   */
  patchProject: (
    id: number,
    patch: Partial<ApiProjectCreate>,
    sendFields?: Array<keyof ApiProjectCreate>,
  ) => Promise<ApiProject>;
  dropProject: (id: number) => Promise<void>;
  /** The checkbox. Ticks to "Done", and back to whatever it was before. */
  toggleTask: (id: number) => Promise<void>;
  /**
   * The checkbox as a person actually uses it: take an unassigned task and
   * finish it in one click. See the comment on the implementation.
   */
  claimAndToggle: (id: number) => Promise<void>;
  addTask: (input: ApiTaskCreate) => Promise<ApiTask>;
  invite: (input: ApiUserCreate) => Promise<ApiUser>;
  /**
   * Hand somebody a different role. Called only from the Team screen, and
   * only for a person who is not the caller - see TeamPage for why.
   */
  changeRole: (id: number, role: ApiUserRole) => Promise<ApiUser>;
  dropMember: (id: number) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/** Sort the task list the way a board reads it: soonest deadline first. */
function byDueDate(a: ApiTask, b: ApiTask): number {
  return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();

  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [apiTasks, setApiTasks] = useState<ApiTask[]>([]);
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  /**
   * The last status each task had while it was still open.
   *
   * Un-ticking a task has to send a real status, and "not Done" is not one.
   * A task that was "In progress" should go back to "In progress", so the
   * status from before it was finished is remembered here. A ref, because it
   * is a lookup table rather than something to render.
   */
  const lastOpenStatus = useRef(new Map<number, ApiTask["status"]>());

  const load = useCallback(async () => {
    try {
      // Three calls, all at once. They are independent, and waiting for one
      // after the other triples how long an empty screen is on screen.
      const [projects, tasks, people] = await Promise.all([
        listProjects({ sort: "created_at" }),
        listTasks({ sort: "due_date" }),
        listUsers(),
      ]);

      for (const task of tasks) {
        if (task.status !== "Done") lastOpenStatus.current.set(task.id, task.status);
      }

      setApiProjects(projects);
      setApiTasks(tasks);
      setApiUsers(people);
      setError(null);
      setIsLive(true);
      setLastLoadedAt(new Date());
    } catch (cause) {
      setIsLive(false);
      setError(
        cause instanceof ApiError
          ? cause.detail
          : "Could not reach the server. Check that the API is running (port 8000) and the database is up.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load once there is a person to load for, and again if they sign out.
  useEffect(() => {
    if (status !== "signed-in") {
      // Signed out: drop the previous workspace's rows, so a second account on
      // the same browser never sees the first one's data for a frame.
      setApiProjects([]);
      setApiTasks([]);
      setApiUsers([]);
      setIsLoading(false);
      setIsLive(false);

      return;
    }

    setIsLoading(true);
    void load();
  }, [load, status]);

  const myId = user?.id ?? null;

  // Mapped once here rather than in each card: ProjectCard, TaskRow and the
  // team list all read from the same memoised result.
  const projects = useMemo(
    () => apiProjects.map((project) => toProject(project, apiTasks)),
    [apiProjects, apiTasks],
  );
  const tasks = useMemo(
    () => [...apiTasks].sort(byDueDate).map((task) => toTask(task, myId)),
    [apiTasks, myId],
  );
  const members = useMemo(
    () => apiUsers.map((person) => toTeamMember(person, myId ?? -1)),
    [apiUsers, myId],
  );

  /**
   * Read the task list again after something the server changed sideways.
   *
   * Deleting a project takes its tasks with it, and removing a person leaves
   * their tasks behind unassigned. Neither is something the local list can
   * work out for itself, so rather than guessing which rows moved, both
   * callers ask the API what it has now.
   */
  const refreshTasks = useCallback(async () => {
    const tasks = await listTasks({ sort: "due_date" });
    for (const task of tasks) {
      if (task.status !== "Done") lastOpenStatus.current.set(task.id, task.status);
    }
    setApiTasks(tasks);
  }, []);

  const refreshProjects = useCallback(async () => {
    setApiProjects(await listProjects({ sort: "created_at" }));
  }, []);

  const addProject = useCallback(async (input: ApiProjectCreate) => {
    const created = await createProject(input);
    setApiProjects((current) => [created, ...current]);

    return created;
  }, []);

  const patchProject = useCallback(
    async (id: number, patch: Partial<ApiProjectCreate>, sendFields?: Array<keyof ApiProjectCreate>) => {
      const updated = await updateProject(id, patch, sendFields);
      setApiProjects((current) => current.map((p) => (p.id === id ? updated : p)));

      return updated;
    },
    [],
  );

  const dropProject = useCallback(
    async (id: number) => {
      await deleteProject(id);
      setApiProjects((current) => current.filter((p) => p.id !== id));
      await refreshTasks();
    },
    [refreshTasks],
  );

  const toggleTask = useCallback(
    async (id: number) => {
      const current = apiTasks.find((task) => task.id === id);
      if (!current) return;

      // Flip it locally first: a tick that waits 200 ms for the server feels
      // broken even when it works perfectly.
      const goingDone = current.status !== "Done";
      const optimistic: ApiTask = {
        ...current,
        status: goingDone ? "Done" : (lastOpenStatus.current.get(id) ?? "To do"),
      };
      setApiTasks((tasks) => tasks.map((task) => (task.id === id ? optimistic : task)));

      try {
        const saved = await updateTask(id, { status: optimistic.status });

        setApiTasks((tasks) => tasks.map((task) => (task.id === id ? saved : task)));
        if (saved.status !== "Done") lastOpenStatus.current.set(id, saved.status);
      } catch (cause) {
        // Put back exactly what was there, then say why. A board that quietly
        // keeps a tick the server refused teaches people not to trust it.
        setApiTasks((tasks) => tasks.map((task) => (task.id === id ? current : task)));
        throw cause;
      }
    },
    [apiTasks],
  );

  /**
   * Taking a task that has no assignee, then ticking it.
   *
   * Two calls, in this order, for a reason: PUT /tasks/{id} decides whether
   * the caller may change a task by looking at who is assigned to it *now*.
   * A member who claims a task in the same request that finishes it is
   * therefore refused - the assignment had not happened yet as far as the
   * server was concerned. Claiming first, then updating, is the version that
   * works, and it is one click from here rather than two from the screen.
   */
  const claimAndToggle = useCallback(
    async (id: number) => {
      if (!myId) throw new ApiError(401, "You are not signed in any more");

      const current = apiTasks.find((task) => task.id === id);
      if (!current) return;

      if (current.assigned_to === null) {
        const claimed = await updateTask(id, { assigned_to: myId });
        setApiTasks((tasks) => tasks.map((task) => (task.id === id ? claimed : task)));
      }

      await toggleTask(id);
    },
    [apiTasks, myId, toggleTask],
  );

  const addTask = useCallback(async (input: ApiTaskCreate) => {
    const created = await createTask(input);
    setApiTasks((current) => [...current, created]);

    if (created.status !== "Done") lastOpenStatus.current.set(created.id, created.status);

    return created;
  }, []);

  const invite = useCallback(async (input: ApiUserCreate) => {
    const person = await inviteUser(input);
    setApiUsers((current) => [...current, person]);

    return person;
  }, []);

  const changeRole = useCallback(async (id: number, role: ApiUserRole) => {
    // PUT /users/{id} takes a partial body, so only `role` is sent. Sending
    // the name and email as well would re-validate fields nobody changed and
    // risk a 422 over something unrelated to the promotion.
    const updated = await updateUser(id, { role });
    setApiUsers((current) => current.map((person) => (person.id === id ? updated : person)));

    return updated;
  }, []);

  const dropMember = useCallback(
    async (id: number) => {
      await removeUser(id);
      setApiUsers((current) => current.filter((person) => person.id !== id));

      // Their tasks went unassigned in the database, so read them again.
      await refreshTasks();
    },
    [refreshTasks],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      apiProjects,
      apiTasks,
      apiUsers,
      projects,
      tasks,
      members,
      isLoading,
      error,
      isLive,
      lastLoadedAt,
      reload: load,
      refreshProjects,
      addProject,
      patchProject,
      dropProject,
      toggleTask,
      claimAndToggle,
      addTask,
      invite,
      changeRole,
      dropMember,
    }),
    [
      apiProjects,
      apiTasks,
      apiUsers,
      projects,
      tasks,
      members,
      isLoading,
      error,
      isLive,
      lastLoadedAt,
      load,
      refreshProjects,
      addProject,
      patchProject,
      dropProject,
      toggleTask,
      claimAndToggle,
      addTask,
      invite,
      changeRole,
      dropMember,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const context = useContext(WorkspaceContext);

  if (!context) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");

  return context;
}
