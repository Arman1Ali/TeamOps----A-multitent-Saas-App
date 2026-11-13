export type AppView = "Overview" | "Projects" | "Tasks" | "Team";

export type ProjectStatus = "On track" | "At risk" | "Completed";
export type ProjectTone = "lavender" | "mint" | "peach" | "blue";
export type TaskPriority = "High" | "Medium" | "Low";

export type Project = {
  id: string;
  name: string;
  description: string;
  progress: number;
  dueDate: string;
  status: ProjectStatus;
  team: string[];
  tone: ProjectTone;
};

export type Task = {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: TaskPriority;
  assignee: string;
  completed: boolean;
};

export type TeamMember = {
  initials: string;
  name: string;
  role: string;
  avatar: string;
};

export type ProjectFilter = "All projects" | "Active" | ProjectStatus;
