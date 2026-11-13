/**
 * "There is nothing here", said in the space where the rows would be.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * It appears in two quite different situations, and the message is what tells
 * them apart: nothing matched the search, or the workspace genuinely has no
 * projects yet. The first is solved by clearing the box, the second by adding
 * something - which is why `action` is optional rather than a second component.
 */

import { SearchX } from "lucide-react";

type EmptyStateProps = {
  message: string;
  /** A button label, e.g. "New project". Leave it out for "no matches". */
  action?: string;
  onAction?: () => void;
};

export function EmptyState({ message, action, onAction }: EmptyStateProps) {
  return (
    <div className="col-span-full grid justify-items-center gap-2 px-6 py-10 text-center text-xs text-slate-500">
      <SearchX size={20} className="text-slate-400" />
      <span>{message}</span>
      {action && onAction && (
        <button
          type="button"
          className="mt-1 inline-flex min-h-[32px] items-center rounded-lg bg-brand px-3 text-[11px] font-bold text-white transition hover:bg-brand-dark"
          onClick={onAction}
        >
          {action}
        </button>
      )}
    </div>
  );
}
