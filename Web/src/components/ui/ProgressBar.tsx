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
