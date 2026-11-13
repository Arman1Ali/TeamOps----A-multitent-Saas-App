import { CheckCheck, Clock3, ListTodo } from "lucide-react";
import type { Task } from "../../types/workspace";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { TaskList } from "./TaskList";

type TasksPageProps = {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
};

export function TasksPage({ tasks, onToggleTask }: TasksPageProps) {
  const completed = tasks.filter((task) => task.completed).length;
  const summaries = [
    { label: "To do", value: tasks.length - completed, icon: ListTodo, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Completed", value: completed, icon: CheckCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Due today", value: 4, icon: Clock3, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <>
      <SectionHeading
        eyebrow="YOUR WORKSPACE"
        title="My tasks"
        description="Stay on top of what needs your attention."
      />
      <div className="my-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {summaries.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className={`grid size-8 place-items-center rounded-lg ${tone}`}><Icon size={18} /></span>
            <span className="grid gap-0.5">
              <strong className="font-display text-base">{value}</strong>
              <small className="text-[9px] text-slate-500">{label}</small>
            </span>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white p-3 shadow-card sm:px-[17px]">
        <div className="flex items-center justify-between py-3">
          <div>
            <h3 className="m-0 text-xs font-bold">All tasks</h3>
            <p className="m-0 mt-1 text-[9px] text-slate-500">A clear view of your team&apos;s next steps.</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] text-slate-600">{tasks.length} tasks</span>
        </div>
        <TaskList tasks={tasks} onToggle={onToggleTask} />
      </section>
    </>
  );
}
