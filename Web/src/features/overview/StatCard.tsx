import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  tone: "indigo" | "amber" | "emerald" | "sky";
  label: string;
  value: number;
  note: ReactNode;
};

const toneClasses = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", bars: "bg-indigo-200", last: "bg-indigo-400" },
  amber: { icon: "bg-amber-50 text-amber-600", bars: "bg-amber-200", last: "bg-amber-400" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bars: "bg-emerald-200", last: "bg-emerald-400" },
  sky: { icon: "bg-sky-50 text-sky-600", bars: "bg-sky-200", last: "bg-sky-400" },
};

const sparkHeights = ["h-[35%]", "h-[54%]", "h-[43%]", "h-[71%]", "h-[52%]", "h-[84%]", "h-[65%]", "h-full"];

export function StatCard({ icon, tone, label, value, note }: StatCardProps) {
  const colors = toneClasses[tone];

  return (
    <article className="relative min-h-[118px] overflow-hidden rounded-[13px] border border-slate-200 bg-white p-3.5 shadow-sm sm:min-h-32">
      <div className={`grid size-[31px] place-items-center rounded-[9px] ${colors.icon}`}>{icon}</div>
      <p className="mb-0 mt-2.5 text-[9px] font-medium text-slate-500 sm:text-[10px]">{label}</p>
      <strong className="block font-display text-[21px] font-bold tracking-tight text-slate-900 sm:text-[23px]">{value}</strong>
      <p className="mt-1 flex items-center gap-1 text-[8px] text-emerald-600 sm:text-[9px]">{note}</p>
      <span className="absolute right-3 bottom-3 flex h-[26px] items-end gap-[3px] opacity-70" aria-hidden="true">
        {sparkHeights.map((height, index) => (
          <i
            key={height}
            className={`w-[3px] rounded-full ${index === sparkHeights.length - 1 ? colors.bars + " " + colors.last : colors.bars} ${height}`}
          />
        ))}
      </span>
    </article>
  );
}
