/**
 * A thin completion bar.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * The value is clamped here rather than trusted from the API: progress is
 * stored as a free 0-100 integer, and a row with 140 in it would otherwise
 * push the bar out of its own container.
 *
 * It carries role="progressbar" and the aria label because the number is drawn
 * as a width, not written as one - without those, the bar is invisible.
 */

type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label = "Project progress" }: ProgressBarProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className="h-[5px] overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
      aria-valuenow={boundedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${boundedValue}%`}
    >
      <span
        className="block h-full rounded-full bg-gradient-to-r from-brand-bright to-indigo-400"
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}
