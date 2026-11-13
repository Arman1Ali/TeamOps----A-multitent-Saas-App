/**
 * The frame around every signed-in screen: sidebar, header, content, footer.
 *
 * This module belongs to the LAYOUT layer (src/components/layout).
 *
 * In the Vite version this file was 260 lines and drew the sidebar and the
 * header itself, because there was only one page and switching a screen meant
 * setting a bit of state. That has been split three ways:
 *
 *   * Sidebar / Header / MobileNav are their own components, each holding the
 *     state it owns (the search box belongs to the header, the sign-out to the
 *     sidebar);
 *   * `children` is the page Next Router picked from the address, so the frame
 *     no longer decides what is on screen;
 *   * the frame is the one place that knows about the toast, so a message
 *     raised anywhere looks the same.
 *
 * The guard belongs here too. useAuth answers "who is signed in" and this
 * component decides what that means for the address bar, which keeps the hooks
 * free of routing.
 */

"use client";

import { ArrowDown, CircleHelp, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { SignedOutRedirect } from "@/app/SignedOutRedirect";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useUi } from "@/hooks/useUi";
import { useWorkspace } from "@/hooks/useWorkspace";

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { isLive, lastLoadedAt, error, reload } = useWorkspace();
  const { notice, noticeTone } = useUi();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  // Which half of the layout is showing is a media query, not a click, so it
  // is read from the browser and followed when the window changes size.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateDesktopState = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    mediaQuery.addEventListener("change", updateDesktopState);

    return () => mediaQuery.removeEventListener("change", updateDesktopState);
  }, []);

  // Two things close the drawer on their own: turning a phone sideways, and
  // going to another page. A menu still covering the screen after a link was
  // followed is the mistake this prevents.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, isDesktop]);

  if (status === "checking") {
    // Nothing to draw yet, and drawing the frame anyway would show a sidebar
    // full of empty names for a moment.
    return (
      <div className="grid min-h-screen place-items-center text-[11px] text-slate-400">
        Checking your session…
      </div>
    );
  }

  if (status === "signed-out") {
    // The address is changed by SignedOutRedirect, in an effect - a component
    // cannot redirect during a render here, because the session is only known
    // after the browser has had its say. What is drawn meanwhile is the truth.
    return (
      <>
        <SignedOutRedirect />
        <div className="grid min-h-screen place-items-center px-6 text-center">
          <p className="m-0 text-[11px] text-slate-500">
            You are signed out. Taking you to the sign-in screen…
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <aside
        id="workspace-sidebar"
        // `overflow-y-auto` is not decoration. The column holds the logo, the
        // workspace card, four links, the promo block, Settings and the
        // profile row - about 630px - and a laptop with the browser window
        // shortened, or any phone in landscape, has less than that. Without a
        // scroll container of its own the fixed panel simply clips the bottom,
        // and the Sign out button becomes something the keyboard can reach and
        // the mouse cannot.
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(280px,82vw)] flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:w-[220px] md:translate-x-0 md:shadow-none xl:w-[252px] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Workspace sidebar"
        // Hidden from readers and from the cursor while it is off-canvas,
        // rather than merely painted transparent: otherwise the first nine
        // Tab presses on a phone go nowhere anybody can see.
        inert={!isDesktop && !mobileMenuOpen}
      >
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </aside>

      {mobileMenuOpen && !isDesktop && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="min-h-screen md:ml-[220px] xl:ml-[252px]">
        <Header onOpenMenu={() => setMobileMenuOpen(true)} />

        <main className="mx-auto w-full max-w-[1400px] px-3 pt-6 pb-24 sm:px-[17px] md:px-[25px] md:pt-[31px] md:pb-6 xl:px-[38px]">
          {children}

          <footer className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-slate-400">
            <span>© {new Date().getFullYear()} TeamOps</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-brand"
              onClick={reload}
            >
              <CircleHelp size={14} /> Reload data
            </button>

            {/* The footer used to say "Sample data · not connected". It now
                says which of the two is true, because after this much work
                the difference matters. */}
            <span className="ml-auto inline-flex items-center gap-1.5 text-slate-400">
              {error ? (
                <>
                  <ArrowDown size={13} className="text-red-400" />
                  <span className="text-red-500">Not connected</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-bold text-brand"
                    onClick={reload}
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </>
              ) : (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {isLive && lastLoadedAt
                    ? `Live · updated ${lastLoadedAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Live"}
                </>
              )}
            </span>
          </footer>
        </main>
      </div>

      <MobileNav />

      {/* Rendered once for the whole app, from useUi(). A toast per screen
          would mean two could stack on each other after a redirect, and it
          closes itself after a few seconds so nobody has to hunt for a way to
          dismiss it while a phone's bottom bar is in the way. */}
      <Toast message={notice} tone={noticeTone} />
    </div>
  );
}
