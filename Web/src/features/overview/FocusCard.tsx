import { ArrowRight, Sparkles } from "lucide-react";

type FocusCardProps = {
  onViewTasks: () => void;
};

export function FocusCard({ onViewTasks }: FocusCardProps) {
  return (
    <section className="relative mt-4 flex min-h-[170px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-4 py-5 text-white shadow-lg shadow-indigo-600/15 sm:min-h-[190px] sm:px-[31px]">
      <div className="relative z-10 max-w-[510px]">
        <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[1.1px] text-indigo-100">
          <Sparkles size={14} /> TODAY&apos;S FOCUS
        </span>
        <h2 className="mb-1.5 mt-3 font-display text-[17px] font-bold sm:text-[21px]">Make today count.</h2>
        <p className="m-0 max-w-[235px] text-[9px] leading-relaxed text-indigo-100 sm:max-w-none sm:text-[11px]">
          You have 4 tasks due today. 12 need your attention.
        </p>
        <button
          type="button"
          className="mt-3.5 inline-flex items-center gap-2 text-[10px] font-bold text-white transition-all hover:gap-3"
          onClick={onViewTasks}
        >
          View my tasks <ArrowRight size={15} />
        </button>
      </div>

      <div className="relative z-10 mr-0 grid size-[74px] flex-none place-items-center sm:mr-6 sm:size-[110px]">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#8580f1" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray="263.89"
            strokeDashoffset="84.44"
            strokeLinecap="round"
          />
        </svg>
        <span className="relative flex items-baseline font-display text-lg font-bold sm:text-[22px]">
          68<small className="text-xs">%</small>
          <em className="absolute top-full left-1/2 -translate-x-1/2 text-[7px] font-semibold not-italic sm:text-[8px]">Done</em>
        </span>
      </div>
      <span className="pointer-events-none absolute -top-[105px] right-[75px] size-[230px] rounded-full border border-white/10" />
      <span className="pointer-events-none absolute -right-[74px] -bottom-[180px] size-[300px] rounded-full border border-white/10" />
    </section>
  );
}
