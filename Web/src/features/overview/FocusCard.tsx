/**
 * The banner that answers "how are we doing, in one sentence".
 *
 * This module belongs to the OVERVIEW feature (src/features/overview).
 *
 * Every figure in here is counted from the rows the overview already has: the
 * ring is finished tasks over all tasks, and the two numbers in the sentence
 * are the ones the page worked out from the same list. Nothing is rounded to
 * look better and nothing is hardcoded.
 *
 * A zero-task workspace gets a different sentence and a different button,
 * because "0% done" over an empty board is not information - it is a bug
 * waiting to be reported.
 */

import { ArrowRight, Plus, Sparkles } from "lucide-react";

type FocusCardProps = {
  totalTasks: number;
  completedTasks: number;
  dueTodayTasks: number;
  overdueTasks: number;
  onViewTasks: () => void;
  onCreateTask: () => void;
};

/** The ring's circumference: 2πr with r = 42, as the SVG below is drawn. */
const RING_LENGTH = 2 * Math.PI * 42;

export function FocusCard({
  totalTasks,
  completedTasks,
  dueTodayTasks,
  overdueTasks,
  onViewTasks,
  onCreateTask,
}: FocusCardProps) {
  // Integer percentage, clamped by arithmetic rather than by a floor: a task
  // list cannot be negative, so 0 is genuinely "nothing finished yet".
  const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const sentence =
    totalTasks === 0
      ? "Nothing on the board yet. Add the first task and this will tell you how it is going."
      : percent === 100
        ? `All ${totalTasks} tasks finished. Whatever is next has not been written down yet.`
        : [
            `${dueTodayTasks} task${dueTodayTasks === 1 ? "" : "s"} due today`,
            overdueTasks > 0 ? `${overdueTasks} past their date` : null,
            `${completedTasks} of ${totalTasks} done`,
          ]
            .filter(Boolean)
            .join(" · ");

  return (
    <section className="relative mt-4 flex min-h-[170px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-4 py-5 text-white shadow-lg shadow-indigo-600/15 sm:min-h-[190px] sm:px-[31px]">
      <div className="relative z-10 max-w-[510px]">
        <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[1.1px] text-indigo-100">
          <Sparkles size={14} /> TODAY&apos;S FOCUS
        </span>
        <h2 className="mb-1.5 mt-3 font-display text-[17px] font-bold sm:text-[21px]">
          {percent === 100 && totalTasks > 0 ? "Everything is done." : "Make today count."}
        </h2>
        <p className="m-0 max-w-[235px] text-[9px] leading-relaxed text-indigo-100 sm:max-w-none sm:text-[11px]">
          {sentence}
        </p>

        <div className="mt-3.5 flex items-center gap-4">
          {totalTasks === 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-white transition-all hover:gap-3"
              onClick={onCreateTask}
            >
              <Plus size={15} /> Add the first task
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[10px] font-bold text-white transition-all hover:gap-3"
              onClick={onViewTasks}
            >
              View my tasks <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 mr-0 grid size-[74px] flex-none place-items-center sm:mr-6 sm:size-[110px]">
        {/* The offset is the remaining share of the circumference, so the
            white arc grows as tasks finish rather than being drawn at a
            height someone chose. */}
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#8580f1" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
            strokeLinecap="round"
          />
        </svg>
        <span className="relative flex items-baseline font-display text-lg font-bold sm:text-[22px]">
          {percent}
          <small className="text-xs">%</small>
          <em className="absolute top-full left-1/2 -translate-x-1/2 text-[7px] font-semibold not-italic sm:text-[8px]">
            Done
          </em>
        </span>
      </div>

      <span className="pointer-events-none absolute -top-[105px] right-[75px] size-[230px] rounded-full border border-white/10" />
      <span className="pointer-events-none absolute -right-[74px] -bottom-[180px] size-[300px] rounded-full border border-white/10" />
    </section>
  );
}
