/**
 * Two pieces of state the whole workspace frame shares: the toast and the
 * search box.
 *
 * This module belongs to the HOOKS layer (src/hooks).
 *
 * Both are here rather than in props because they are reached from different
 * places at once: the header owns the search input, but the four screens read
 * its value; and a project card, a task row and the sidebar all want to raise
 * the same one-line message. Passing either down three levels would work, and
 * would tie every component in between to a conversation it is not part of.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type UiValue = {
  /** What the search box holds. Screens filter on it themselves. */
  search: string;
  setSearch: (value: string) => void;
  /** Show a message for a moment. Empty string means nothing is showing. */
  notice: string;
  /** Whether the last message was a refusal or a confirmation. Toast reads it. */
  noticeTone: NoticeTone;
  notify: (message: string, tone?: NoticeTone) => void;
  clearNotice: () => void;
};

/** Two kinds of one-line message, and they are not the same claim. */
export type NoticeTone = "success" | "error";

const UiContext = createContext<UiValue | null>(null);

/** How long a message stays up. Long enough to read once, short enough to ignore. */
const NOTICE_MS = 3200;

export function UiProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");
  // Bumped on every notify, so showing the same message twice restarts the
  // timer below instead of being ignored as "no change in state".
  const [noticeKey, setNoticeKey] = useState(0);

  // The timer is cleared on the way out, so a message that is replaced does
  // not get ended by the old one's timeout.
  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(""), NOTICE_MS);

    return () => window.clearTimeout(timeout);
  }, [notice, noticeKey]);

  const notify = useCallback((message: string, tone: NoticeTone = "success") => {
    setNotice(message);
    setNoticeTone(tone);
    setNoticeKey((key) => key + 1);
  }, []);

  const value = useMemo<UiValue>(
    () => ({
      search,
      setSearch,
      notice,
      noticeTone,
      notify,
      clearNotice: () => setNotice(""),
    }),
    [search, notice, noticeTone, notify],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const context = useContext(UiContext);

  if (!context) throw new Error("useUi must be used inside <UiProvider>");

  return context;
}
