import {
  ArrowDown,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Ellipsis,
  FolderKanban,
  Home,
  ListTodo,
  Menu,
  Search,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { AppView } from "../../types/workspace";
import { Avatar } from "../ui/Avatar";
import { IconButton } from "../ui/IconButton";

type WorkspaceLayoutProps = {
  children: ReactNode;
  activeView: AppView;
  mobileMenuOpen: boolean;
  search: string;
  onViewChange: (view: AppView) => void;
  onMobileMenuChange: (isOpen: boolean) => void;
  onSearchChange: (value: string) => void;
  onNotice: (message: string) => void;
};

const navigation: { view: AppView; label: string; icon: typeof Home }[] = [
  { view: "Overview", label: "Overview", icon: Home },
  { view: "Projects", label: "Projects", icon: FolderKanban },
  { view: "Tasks", label: "Tasks", icon: ListTodo },
  { view: "Team", label: "Team", icon: Users },
];

export function WorkspaceLayout({
  children,
  activeView,
  mobileMenuOpen,
  search,
  onViewChange,
  onMobileMenuChange,
  onSearchChange,
  onNotice,
}: WorkspaceLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  const sidebarIsExposed = isDesktop || mobileMenuOpen;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateDesktopState = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    mediaQuery.addEventListener("change", updateDesktopState);
    return () => mediaQuery.removeEventListener("change", updateDesktopState);
  }, []);

  const changeView = (view: AppView) => {
    onViewChange(view);
    onMobileMenuChange(false);
    onSearchChange("");
  };

  const navigationItem = (
    { view, label, icon: Icon }: (typeof navigation)[number],
    mobile = false,
  ) => (
    <button
      key={view}
      type="button"
      className={
        mobile
          ? `flex flex-col items-center justify-center gap-[3px] rounded-xl text-[8px] font-semibold transition-colors ${
              activeView === view ? "bg-indigo-50 text-brand" : "text-slate-400"
            }`
          : `flex min-h-[42px] items-center gap-3 rounded-[10px] px-[11px] text-left text-xs transition-colors ${
              activeView === view
                ? "bg-teamops-lavender font-bold text-brand"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`
      }
      aria-current={activeView === view ? "page" : undefined}
      onClick={() => changeView(view)}
    >
      <Icon size={mobile ? 19 : 18} strokeWidth={1.8} />
      <span>{label}</span>
      {!mobile && view === "Tasks" && (
        <span className={`ml-auto grid h-5 min-w-[21px] place-items-center rounded-[7px] text-[10px] ${
          activeView === view ? "bg-white text-brand" : "bg-slate-100 text-slate-500"
        }`}>4</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen">
      <aside
        id="workspace-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(280px,82vw)] flex-col border-r border-slate-200 bg-white px-4 pt-[26px] pb-[14px] shadow-xl transition-transform duration-200 md:w-[220px] md:translate-x-0 md:shadow-none xl:w-[252px] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Workspace sidebar"
        aria-hidden={!sidebarIsExposed}
        inert={!sidebarIsExposed}
      >
        <a
          className="mb-[27px] ml-[5px] inline-flex w-fit items-center gap-[10px] font-display text-xl font-extrabold tracking-tight text-slate-900 no-underline"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            changeView("Overview");
          }}
        >
          <span className="grid size-[34px] place-items-center rounded-[11px] bg-brand text-white">
            <BriefcaseBusiness size={19} strokeWidth={2.2} />
          </span>
          <span>Team<span className="text-brand">Ops</span></span>
        </a>

        <button
          type="button"
          className="flex min-h-[57px] items-center gap-2.5 rounded-[13px] border border-slate-200 bg-white p-[9px] text-left"
          onClick={() => onNotice("Workspace switching will be available when connected to your account.")}
        >
          <span className="grid size-[34px] place-items-center rounded-[10px] bg-slate-900 font-display text-sm font-bold text-white">A</span>
          <span className="grid flex-1 gap-[3px]">
            <strong className="text-xs">Acme Studio</strong>
            <small className="text-[10px] text-slate-400">Free workspace</small>
          </span>
          <ChevronDown size={15} className="text-slate-400" />
        </button>

        <span className="mt-[29px] mb-[10px] ml-[9px] text-[9px] font-bold tracking-[1.15px] text-slate-400">
          WORKSPACE
        </span>
        <nav className="grid gap-[5px]" aria-label="Main navigation">
          {navigation.map((item) => navigationItem(item))}
        </nav>

        <div className="mt-auto grid gap-[10px]">
          <div className="rounded-[13px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5">
            <span className="mb-3 grid size-[29px] place-items-center rounded-[9px] bg-white text-brand shadow-sm">
              <Sparkles size={16} />
            </span>
            <strong className="text-[11px]">Make teamwork flow</strong>
            <p className="my-1.5 text-[10px] leading-relaxed text-slate-500">
              Bring all your work together in one place.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand"
              onClick={() => changeView("Projects")}
            >
              Explore projects <ArrowRight size={13} />
            </button>
          </div>
          <button
            type="button"
            className="flex min-h-[37px] items-center gap-3 rounded-[10px] px-[11px] text-left text-xs text-slate-500 hover:bg-slate-50"
            onClick={() => onNotice("Workspace settings are coming soon.")}
          >
            <Settings2 size={18} strokeWidth={1.8} /> Settings
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 border-t border-slate-200 px-1 pt-2.5 text-left"
            onClick={() => onNotice("Signed in as Alex Morgan.")}
          >
            <Avatar initials="AM" className="border-0 bg-violet-100 text-violet-800" />
            <span className="grid flex-1 gap-[3px]">
              <strong className="text-xs">Alex Morgan</strong>
              <small className="text-[10px] text-slate-400">Workspace admin</small>
            </span>
            <Ellipsis size={18} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => onMobileMenuChange(false)}
        />
      )}

      <div className="min-h-screen md:ml-[220px] xl:ml-[252px]">
        <header className="sticky top-0 z-20 flex h-[58px] items-center gap-2 border-b border-slate-200 bg-white/95 px-2.5 backdrop-blur-md sm:px-4 md:h-[67px] md:justify-between md:px-[25px] xl:px-[38px]">
          <IconButton
            variant="quiet"
            className="size-8 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="workspace-sidebar"
            onClick={() => onMobileMenuChange(true)}
          >
            <Menu size={21} />
          </IconButton>
          <div className="mr-auto flex items-center gap-2 text-[10px] text-slate-400 md:mr-0 md:gap-[11px] md:text-[11px]">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <strong className="font-semibold text-slate-700">{activeView}</strong>
          </div>
          <div className="flex items-center gap-1.5 md:gap-[18px]">
            <label className="flex size-[34px] items-center justify-center gap-2 rounded-lg text-slate-400 focus-within:absolute focus-within:right-[85px] focus-within:left-[52px] focus-within:z-10 focus-within:w-auto focus-within:justify-start focus-within:border focus-within:border-indigo-200 focus-within:bg-white focus-within:px-2 md:h-[34px] md:w-[220px] md:justify-start md:rounded-[9px] md:border md:border-slate-200 md:bg-slate-50 md:px-2">
              <Search size={16} />
              <input
                id="workspace-search"
                type="search"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                aria-label="Search projects and tasks"
                className="w-0 min-w-0 flex-1 bg-transparent text-[10px] text-slate-900 outline-none placeholder:text-slate-400 focus:w-full md:w-full"
              />
              <kbd className="hidden rounded border border-slate-200 bg-white px-1 text-[9px] text-slate-400 md:inline">⌘ K</kbd>
            </label>
            <IconButton
              variant="quiet"
              className="relative size-[31px]"
              aria-label="Notifications"
              onClick={() => onNotice("You're all caught up!")}
            >
              <Bell size={19} strokeWidth={1.8} />
              <span className="absolute top-[7px] right-[7px] size-1.5 rounded-full border border-white bg-indigo-500" />
            </IconButton>
            <Avatar initials="AM" className="border-0 bg-violet-100 text-violet-800" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-3 pt-6 pb-24 sm:px-[17px] md:px-[25px] md:pt-[31px] md:pb-6 xl:px-[38px]">
          {children}
          <footer className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-slate-400">
            <span>© {new Date().getFullYear()} TeamOps</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-brand"
              onClick={() => onNotice("Help center is coming soon.")}
            >
              <CircleHelp size={14} /> Help center
            </button>
            <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
              <ArrowDown size={13} /> Sample data · not connected
            </span>
          </footer>
        </main>
      </div>

      <nav className="fixed right-3 bottom-[max(10px,env(safe-area-inset-bottom))] left-3 z-20 grid min-h-[58px] grid-cols-4 rounded-[18px] border border-slate-200 bg-white/95 p-[5px] shadow-lg backdrop-blur-md md:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => navigationItem(item, true))}
      </nav>
    </div>
  );
}
