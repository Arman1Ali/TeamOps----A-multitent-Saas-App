/**
 * The one-line message at the bottom right.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * Screens do not render this themselves: WorkspaceLayout renders it once and
 * reads `notice` from useUi(), so a message raised anywhere in the app looks
 * the same and only one can be up at a time.
 *
 * `tone` is not decoration. "Saved" in green and "the server said no" in red
 * are different claims, and a person should not have to read the words to tell
 * them apart.
 */

import { AlertTriangle, CheckCircle2 } from "lucide-react";

type ToastProps = {
  message: string;
  tone?: "success" | "error";
};

export function Toast({ message, tone = "success" }: ToastProps) {
  if (!message) return null;

  const isError = tone === "error";

  return (
    <div
      className={`fixed right-4 bottom-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border bg-white px-4 py-3 text-[11px] shadow-xl ${
        isError ? "border-red-200 text-red-700" : "border-slate-200 text-slate-700"
      }`}
      // role="status" is announced politely: a screen reader finishes what it
      // is reading before saying this, which is what a toast is for.
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {isError ? (
        <AlertTriangle size={17} className="flex-none text-red-500" />
      ) : (
        <CheckCircle2 size={17} className="flex-none text-emerald-500" />
      )}
      {message}
    </div>
  );
}
