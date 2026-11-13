import type { ProjectFilter } from "../../types/workspace";

const filters: ProjectFilter[] = ["All projects", "Active", "On track", "At risk"];

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
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`min-h-[30px] whitespace-nowrap rounded-md px-3 text-[9px] font-semibold transition-colors ${
            value === filter
              ? "bg-white text-brand shadow-sm"
              : "text-slate-500 hover:text-slate-700"
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
