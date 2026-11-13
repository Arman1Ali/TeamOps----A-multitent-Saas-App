import { SearchX } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full grid justify-items-center gap-2 px-6 py-10 text-center text-xs text-slate-500">
      <SearchX size={20} className="text-slate-400" />
      <span>{message}</span>
    </div>
  );
}
