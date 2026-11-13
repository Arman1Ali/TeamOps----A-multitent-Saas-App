/**
 * The four buttons along the bottom of a phone screen.
 *
 * This module belongs to the LAYOUT layer (src/components/layout).
 *
 * It reads NAVIGATION rather than repeating the list, because the sidebar and
 * this bar are the same menu drawn twice - and a link added to one of them and
 * forgotten in the other is the kind of bug nobody notices until somebody taps
 * an empty square on their phone.
 *
 * Only shown below md, where the sidebar is off-canvas. The spacing at the
 * bottom of the page is the safe-area inset, so the bar does not sit on top of
 * a phone's home gesture.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, activeHrefFor } from "./navigation";

export function MobileNav() {
  const activeHref = activeHrefFor(usePathname());

  return (
    <nav
      className="fixed right-3 bottom-[max(10px,env(safe-area-inset-bottom))] left-3 z-20 grid min-h-[58px] grid-cols-4 rounded-[18px] border border-slate-200 bg-white/95 p-[5px] shadow-lg backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      {NAVIGATION.map(({ label, href, icon: Icon }) => {
        const isActive = activeHref === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-[3px] rounded-xl text-[8px] font-semibold transition-colors no-underline ${
              isActive ? "bg-indigo-50 text-brand" : "text-slate-400"
            }`}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
