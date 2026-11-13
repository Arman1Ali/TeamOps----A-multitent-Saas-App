import { CheckCircle2 } from "lucide-react";

export function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-xl"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 size={17} className="flex-none text-emerald-500" />
      {message}
    </div>
  );
}
