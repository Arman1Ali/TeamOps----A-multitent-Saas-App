import { BriefcaseBusiness, Plus, X } from "lucide-react";
import type { FormEvent } from "react";
import { IconButton } from "../ui/IconButton";

type CreateProjectDialogProps = {
  name: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function CreateProjectDialog({
  name,
  onNameChange,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-5 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="w-full max-w-[420px] rounded-[17px] border border-slate-100 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onSubmit={handleSubmit}
      >
        <div className="mb-5 flex items-start justify-between">
          <span className="grid size-[37px] place-items-center rounded-[11px] bg-indigo-50 text-indigo-600">
            <BriefcaseBusiness size={20} />
          </span>
          <IconButton variant="quiet" className="size-[30px]" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </div>
        <span className="text-[9px] font-bold tracking-[1.15px] text-slate-400">GET STARTED</span>
        <h2 id="create-project-title" className="mb-1 mt-2 font-display text-xl font-bold tracking-tight">
          Create a project
        </h2>
        <p className="mb-5 mt-0 text-[11px] text-slate-500">Give your next great idea a name.</p>
        <label className="mb-1.5 block text-[10px] font-bold text-slate-700" htmlFor="project-name">
          Project name
        </label>
        <input
          id="project-name"
          autoFocus
          maxLength={80}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-[11px] outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="min-h-[37px] rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex min-h-[37px] items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[11px] font-bold text-white hover:bg-brand-dark"
          >
            <Plus size={16} /> Create project
          </button>
        </div>
      </form>
    </div>
  );
}
