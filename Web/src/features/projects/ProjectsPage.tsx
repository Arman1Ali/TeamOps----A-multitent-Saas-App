import type { Project, ProjectFilter } from "../../types/workspace";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";

type ProjectsPageProps = {
  projects: Project[];
  filter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
  onCreateProject: () => void;
};

export function ProjectsPage({
  projects,
  filter,
  onFilterChange,
  onCreateProject,
}: ProjectsPageProps) {
  return (
    <>
      <SectionHeading
        eyebrow="YOUR WORKSPACE"
        title="Projects"
        description="Keep every initiative moving forward."
        action="New project"
        onAction={onCreateProject}
      />
      <ProjectFilters value={filter} onChange={onFilterChange} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        {projects.length === 0 && <EmptyState message="No projects match your search." />}
      </div>
    </>
  );
}
