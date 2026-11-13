/**
 * A small list of actions that opens from an icon button.
 *
 * This module belongs to the UI primitives layer (src/components/ui).
 *
 * A project card, a team member tile and the sidebar all have a "..." button,
 * and all three need the same four behaviours: open on click, close on a
 * choice, close on Escape, and close when the click lands somewhere else.
 * Writing that once is the difference between three menus that agree and three
 * that drift.
 *
 * The items are the caller's children, so this file knows nothing about
 * projects or people - it only owns the box and its opening.
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "./IconButton";

type MenuProps = {
  /** Says what the button belongs to: "More options for Atlas". */
  label: string;
  icon: ReactNode;
  children: ReactNode;
  /** Extra classes for the box, for the one case that needs a wider one. */
  panelClassName?: string;
};

export function Menu({ label, icon, children, panelClassName = "w-[212px]" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      // Checked against the wrapper rather than the panel, so the click that
      // opened the menu is not also the click that closes it.
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        variant="quiet"
        className="size-[30px]"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {icon}
      </IconButton>

      {open && (
        // Closing on a choice is done on the box rather than in every item, so
        // an item cannot forget to do it and leave a menu hanging over the
        // next action.
        <div
          className={`absolute top-[32px] right-0 z-30 grid gap-0.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ${panelClassName}`}
          role="menu"
          aria-label={label}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  /** Given when the entry does something here. Leave out when `href` is set. */
  onClick?: () => void;
  /** Given instead of onClick when the entry goes to another page. */
  href?: string;
  tone?: "default" | "danger";
  disabled?: boolean;
};

/**
 * One line in a menu.
 *
 * `tone` exists because "Delete project" and "Edit project" are not the same
 * kind of decision, and the red text is the only warning a menu gets to give.
 */
export function MenuItem({
  icon,
  label,
  onClick,
  href,
  tone = "default",
  disabled = false,
}: MenuItemProps) {
  const toneClasses =
    tone === "danger"
      ? "text-red-600 hover:bg-red-50"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
  const sharedClasses = `flex min-h-[32px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[10px] font-semibold no-underline transition-colors ${toneClasses}`;

  // A menu entry that goes somewhere is a link. Turning a link into a button
  // that calls router.push loses middle-click, "open in new tab" and the
  // address the reader is about to visit - and the address is the point.
  if (href) {
    return (
      <Link href={href} role="menuitem" className={sharedClasses}>
        <span className="flex-none">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={`${sharedClasses} disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex-none">{icon}</span>
      {label}
    </button>
  );
}
