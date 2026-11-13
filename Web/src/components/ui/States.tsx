/**
 * The two states a screen shows while it is not showing data.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * They live in one file because they are always used together, at the top of a
 * screen's render:
 *
 *     if (isLoading) return <LoadingState />;
 *     if (error)     return <ErrorState message={error} onRetry={reload} />;
 *
 * Both early-return, so neither is ever competing with half a table of rows.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * A quiet placeholder shaped roughly like what is coming.
 *
 * Not a spinner in the middle of a blank page: the bars sit where the cards
 * will, so the screen does not jump when the data lands.
 */
export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3" role="status" aria-live="polite" aria-label="Loading">
      <span className="sr-only">Loading your workspace…</span>
      {Array.from({ length: rows }, (_, index) => (
        <span
          key={index}
          className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

/**
 * Why the screen is empty, and a way to try again.
 *
 * The message comes from ApiError.detail, which is written to be read: "That
 * is not yours to change" tells you more than a red box with "Error 403" in
 * it. The retry button is not decoration - most failures here are the API or
 * the database not having started yet, and once they have, a retry works.
 */
export function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[13px] border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle size={22} className="text-red-500" />
      <p className="m-0 max-w-[46ch] text-xs leading-relaxed text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="inline-flex min-h-[34px] items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-[11px] font-bold text-red-700 transition hover:border-red-300"
          onClick={onRetry}
        >
          <RefreshCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  );
}
