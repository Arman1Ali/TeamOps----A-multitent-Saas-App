/**
 * "Are you sure?", with the answer sent back to whoever asked.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * Deleting a project takes its tasks with it, and removing a person unassigns
 * everything they held. Both are calls the API cannot undo, so neither should
 * happen on a single click. Rather than a browser `confirm()` - which cannot
 * be styled, cannot say what will be lost, and blocks the whole page - this
 * uses the same Dialog frame as everything else and says the consequence out
 * loud.
 *
 * It decides nothing. `onConfirm` belongs to the caller, and this component
 * only keeps the button from being pressed twice while the call is in flight.
 */

"use client";

import { useState } from "react";
import { Dialog, dialogCancelButtonClasses } from "./Dialog";

type ConfirmDialogProps = {
  titleId: string;
  heading: string;
  /** The sentence that says what is about to be lost. Required on purpose. */
  consequence: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  titleId,
  heading,
  consequence,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setProblem(null);

    try {
      await onConfirm();
      onCancel();
    } catch (cause) {
      // Staying open with the reason is the honest answer: the thing is still
      // there, and closing would imply otherwise.
      setProblem(cause instanceof Error ? cause.message : "The server refused that.");
      setBusy(false);
    }
  }

  return (
    <Dialog titleId={titleId} heading={heading} onClose={onCancel}>
      <p className="m-0 mb-4 text-[11px] leading-relaxed text-slate-500">{consequence}</p>

      {problem && (
        <p
          className="m-0 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700"
          role="alert"
        >
          {problem}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" className={dialogCancelButtonClasses} onClick={onCancel}>
          Keep it
        </button>
        <button
          type="button"
          className="inline-flex min-h-[37px] items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[11px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
