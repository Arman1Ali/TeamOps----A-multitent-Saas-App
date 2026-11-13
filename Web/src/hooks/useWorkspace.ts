import { useState } from "react";
import { initialProjects, initialTasks } from "../data/sampleWorkspace";
import type { Project, Task } from "../types/workspace";

export function useWorkspace() {
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);

  function addProject(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const baseId = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "new-project";
    const projectIds = new Set(projects.map((project) => project.id));
    let projectId = baseId;
    let suffix = 2;
    while (projectIds.has(projectId)) {
      projectId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const project: Project = {
      id: projectId,
      name: trimmedName,
      description: "New initiative",
      progress: 0,
      dueDate: "To be set",
      status: "On track",
      team: ["AM"],
      tone: "lavender",
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task): Task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  return { projects, tasks, addProject, toggleTask };
}
