import { ArrowRight } from "lucide-react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: SectionHeadingProps) {
  return (
    <div className="mb-[14px] flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="text-[9px] font-bold tracking-[1.15px] text-slate-400">
            {eyebrow}
          </span>
        )}
        <h2 className="m-0 font-display text-[17px] font-bold tracking-[-0.45px]">
          {title}
        </h2>
        {description && <p className="m-0 mt-1 text-[10px] text-slate-500">{description}</p>}
      </div>
      {action && (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold text-brand hover:text-brand-dark"
          onClick={onAction}
        >
          {action} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
