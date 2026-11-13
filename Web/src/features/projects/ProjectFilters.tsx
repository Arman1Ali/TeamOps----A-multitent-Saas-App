/**
 * The chips above the project grid.
 *
 * This module belongs to the PROJECTS feature (src/features/projects).
 *
 * They are all client-side filters over the rows already loaded, because the
 * page holds every project of the workspace already - asking the API again for
 * one status would be a second request to get a smaller copy of an answer this
 * component has in memory.
 *
 * `All projects` and `Active` are not statuses; the backend has no such value.
 * They are shortcuts over the four it does have, and that is spelled out in
 * ProjectsPage where the predicate lives, not implied by a label here.
 */

import type { ProjectFilter } from "@/types/ui";

/**
 * The order the chips read in: everything, then the useful shortcut, then
 * the four states in the order a project tends to pass through them.
 */
const FILTERS: ProjectFilter[] = ["All projects", "Active", "On track", "At risk", "Blocked", "Done"];

type ProjectFiltersProps = {
  value: ProjectFilter;
  onChange: (value: ProjectFilter) => void;
};

export function ProjectFilters({ value, onChange }: ProjectFiltersProps) {
  return (
    <div
      className="my-5 mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] bg-slate-100 p-1"
      role="group"
      aria-label="Filter projects"
    >
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`min-h-[30px] whitespace-nowrap rounded-md px-3 text-[9px] font-semibold transition-colors ${
            value === filter ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
          aria-pressed={value === filter}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
