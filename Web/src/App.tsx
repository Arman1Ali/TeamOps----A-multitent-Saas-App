import { useEffect, useMemo, useState } from "react";
import { CreateProjectDialog } from "./components/projects/CreateProjectDialog";
import { Toast } from "./components/ui/Toast";
import { WorkspaceLayout } from "./components/layout/WorkspaceLayout";
import { teamMembers } from "./data/sampleWorkspace";
import { OverviewPage } from "./features/overview/OverviewPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { TasksPage } from "./features/tasks/TasksPage";
import { TeamPage } from "./features/team/TeamPage";
import { useWorkspace } from "./hooks/useWorkspace";
import type { AppView, ProjectFilter } from "./types/workspace";

function matchesSearch(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query);
}

function App() {
  const { projects, tasks, addProject, toggleTask } = useWorkspace();
  const [activeView, setActiveView] = useState<AppView>("Overview");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("All projects");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [notice, setNotice] = useState("");

  const query = search.trim().toLocaleLowerCase();
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const searchMatches =
          !query ||
          matchesSearch(project.name, query) ||
          matchesSearch(project.description, query);
        const statusMatches =
          projectFilter === "All projects" ||
          (projectFilter === "Active" && project.status !== "Completed") ||
          project.status === projectFilter;
        return searchMatches && statusMatches;
      }),
    [projects, projectFilter, query],
  );
  const searchableTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !query ||
          matchesSearch(task.title, query) ||
          matchesSearch(task.project, query),
      ),
    [query, tasks],
  );

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("workspace-search")?.focus();
      }

      if (event.key === "Escape") {
        setProjectDialogOpen(false);
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function changeView(view: AppView) {
    setActiveView(view);
    setSearch("");
  }

  function createProject() {
    const trimmedName = projectName.trim();
    if (!trimmedName) return;
    addProject(trimmedName);
    setProjectName("");
    setProjectDialogOpen(false);
    setProjectFilter("All projects");
    setActiveView("Projects");
  }

  function renderPage() {
    switch (activeView) {
      case "Projects":
        return (
          <ProjectsPage
            projects={filteredProjects}
            filter={projectFilter}
            onFilterChange={setProjectFilter}
            onCreateProject={() => setProjectDialogOpen(true)}
          />
        );
      case "Tasks":
        return <TasksPage tasks={searchableTasks} onToggleTask={toggleTask} />;
      case "Team":
        return (
          <TeamPage
            members={teamMembers}
            onInvite={() =>
              setNotice("Team invitations will be available when connected to your workspace.")
            }
          />
        );
      case "Overview":
        return (
          <OverviewPage
            projects={projects.filter((project) => {
              const searchMatches =
                !query ||
                matchesSearch(project.name, query) ||
                matchesSearch(project.description, query);
              const isActive = project.status !== "Completed";
              return searchMatches && isActive;
            })}
            tasks={searchableTasks}
            onViewProjects={() => changeView("Projects")}
            onViewTasks={() => changeView("Tasks")}
            onCreateProject={() => setProjectDialogOpen(true)}
            onToggleTask={toggleTask}
          />
        );
    }
  }

  return (
    <>
      <WorkspaceLayout
        activeView={activeView}
        mobileMenuOpen={mobileMenuOpen}
        search={search}
        onViewChange={changeView}
        onMobileMenuChange={setMobileMenuOpen}
        onSearchChange={setSearch}
        onNotice={setNotice}
      >
        {renderPage()}
      </WorkspaceLayout>

      {projectDialogOpen && (
        <CreateProjectDialog
          name={projectName}
          onNameChange={setProjectName}
          onClose={() => setProjectDialogOpen(false)}
          onSubmit={createProject}
        />
      )}
      <Toast message={notice} />
    </>
  );
}

export default App;




