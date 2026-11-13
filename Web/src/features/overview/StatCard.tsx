/**
 * One number about the workspace, in a box.
 *
 * This module belongs to the OVERVIEW feature (src/features/overview).
 *
 * The Vite version drew eight little bars in the corner of every one of these,
 * at fixed heights, with the last one taller than the rest. They meant nothing:
 * there was no series behind them, and a decorative chart in a component whose
 * whole job is a figure is a chart nobody can read. They are gone.
 *
 * What is left is the honest part - an icon, a label, a number counted from
 * real rows, and a line underneath that says what the number is measured
 * against. `note` is optional because "0 of 0" is not worth a line of text.
 */

import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  tone: "indigo" | "amber" | "emerald" | "sky";
  label: string;
  value: number;
  /** The comparison, in words: "of 14 tasks". Leave out when there is none. */
  note?: ReactNode;
};

const toneClasses = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
};

export function StatCard({ icon, tone, label, value, note }: StatCardProps) {
  return (
    <article className="min-h-[118px] rounded-[13px] border border-slate-200 bg-white p-3.5 shadow-sm sm:min-h-32">
      <div className={`grid size-[31px] place-items-center rounded-[9px] ${toneClasses[tone]}`}>
        {icon}
      </div>
      <p className="mb-0 mt-2.5 text-[9px] font-medium text-slate-500 sm:text-[10px]">{label}</p>
      <strong className="block font-display text-[21px] font-bold tracking-tight text-slate-900 sm:text-[23px]">
        {value}
      </strong>
      {note && <p className="mt-1 text-[8px] text-slate-400 sm:text-[9px]">{note}</p>}
    </article>
  );
}
