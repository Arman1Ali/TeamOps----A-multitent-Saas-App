/**
 * The frame every form in a modal is built out of.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * Three dialogs exist in this app - create a project, add a task, invite a
 * teammate - and each of them needs the same six pieces: a dimmed backdrop, a
 * white box, a title that can be labelled, an Escape key that closes it, and a
 * way back to the element that opened it. Writing that six times is how three
 * dialogs end up with three different close behaviours.
 *
 * What lives here is only the frame. The fields and the submit handler belong
 * to the caller, so this file never has to know what a project is.
 */

"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";

type DialogProps = {
  /** Matches the heading's id, so aria-labelledby points at real text. */
  titleId: string;
  heading: string;
  /** The sentence under the heading: what this form is for. */
  introduction?: string;
  /** The picture in the top-left corner. Optional, because a form's heading
   * already says what it is; the icon is decoration, not information. */
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

/** Button styles shared by the Cancel and the primary action of every dialog. */
export const dialogCancelButtonClasses =
  "min-h-[37px] rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50";

export const dialogPrimaryButtonClasses =
  "inline-flex min-h-[37px] items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[11px] font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60";

/** One label above one control, with the gap and text size every form uses. */
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[10px] font-bold text-slate-700" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="m-0 mt-1 text-[9px] text-slate-400">{hint}</p>}
    </div>
  );
}

/** The input classes, written once so no two forms drift apart. */
export const fieldInputClasses =
  "h-10 w-full rounded-lg border border-slate-300 px-3 text-[11px] outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export const fieldAreaClasses = `${fieldInputClasses} h-[72px] resize-y py-2 leading-relaxed`;

export function Dialog({ titleId, heading, introduction, icon, onClose, children }: DialogProps) {
  // Remembered so the cursor can be handed back on close. Without this, a
  // dialog opened from a card leaves focus on document.body, and keyboard
  // users have to tab through the whole page again.
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    // Listened for on the document rather than the box: the moment focus is
    // inside a text input, a keydown on the dialog would never be reached.
    document.addEventListener("keydown", handleKeyDown);

    // Scrolling behind an open modal makes the frame slide away from where
    // the reader was looking.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-5 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        // Checked on mousedown rather than click, so a person who starts a
        // text selection inside the form and finishes it on the backdrop does
        // not have the dialog close on them.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[420px] rounded-[17px] border border-slate-100 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mb-5 flex items-start justify-between">
          {icon ? <span className="grid size-[37px] place-items-center rounded-[11px] bg-indigo-50 text-indigo-600">{icon}</span> : <span />}
          <IconButton variant="quiet" className="size-[30px]" aria-label="Close dialog" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </div>
        <h2 id={titleId} className="mb-1 mt-2 font-display text-xl font-bold tracking-tight">
          {heading}
        </h2>
        {introduction && (
          <p className="mb-5 mt-1.5 text-[11px] text-slate-500">{introduction}</p>
        )}
        {children}
      </div>
    </div>
  );
}
