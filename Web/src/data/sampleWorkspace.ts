import type { Project, Task, TeamMember } from "../types/workspace";

export const initialProjects: Project[] = [
  {
    id: "website-redesign",
    name: "Website Redesign",
    description: "Design & Development",
    progress: 78,
    dueDate: "Sep 28",
    status: "On track",
    team: ["SC", "MR", "OP"],
    tone: "lavender",
  },
  {
    id: "mobile-app-launch",
    name: "Mobile App Launch",
    description: "Product & Engineering",
    progress: 56,
    dueDate: "Oct 12",
    status: "At risk",
    team: ["AM", "JD", "SC"],
    tone: "mint",
  },
  {
    id: "customer-portal",
    name: "Customer Portal",
    description: "Customer Experience",
    progress: 91,
    dueDate: "Oct 18",
    status: "On track",
    team: ["OP", "MR"],
    tone: "peach",
  },
  {
    id: "q4-growth-campaign",
    name: "Q4 Growth Campaign",
    description: "Marketing",
    progress: 34,
    dueDate: "Nov 04",
    status: "At risk",
    team: ["JD", "AM", "OP"],
    tone: "blue",
  },
];

export const initialTasks: Task[] = [
  {
    id: "finalize-onboarding",
    title: "Finalize onboarding flow",
    project: "Mobile App Launch",
    dueDate: "Today, 4:00 PM",
    priority: "High",
    assignee: "SC",
    completed: false,
  },
  {
    id: "review-analytics",
    title: "Review analytics dashboard",
    project: "Website Redesign",
    dueDate: "Today, 6:30 PM",
    priority: "Medium",
    assignee: "MR",
    completed: false,
  },
  {
    id: "prepare-interviews",
    title: "Prepare user interview notes",
    project: "Customer Portal",
    dueDate: "Tomorrow",
    priority: "Low",
    assignee: "OP",
    completed: false,
  },
];

export const teamMembers: TeamMember[] = [
  { initials: "AM", name: "Alex Morgan", role: "Product lead", avatar: "bg-violet-100 text-violet-800" },
  { initials: "SC", name: "Sam Chen", role: "Design", avatar: "bg-sky-100 text-sky-800" },
  { initials: "MR", name: "Maya Rivera", role: "Engineering", avatar: "bg-pink-100 text-pink-800" },
  { initials: "OP", name: "Oliver Park", role: "Engineering", avatar: "bg-emerald-100 text-emerald-800" },
  { initials: "JD", name: "Jordan Davis", role: "Marketing", avatar: "bg-orange-100 text-orange-800" },
];
