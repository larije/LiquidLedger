"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings, ChevronRight, Menu } from "lucide-react";
import { useSidebar } from "./SidebarContext";

const BREADCRUMB_MAP: Record<string, string[]> = {
  "/":                       ["Dashboard"],
  "/vehicles":               ["Vehicle Master"],
  "/cash-advances":          ["Cash Advances"],
  "/fuel-entries":           ["Fuel Entries"],
  "/fuel-entries/import":    ["Fuel Entries", "Import Data"],
  "/reports/master-log":     ["Reports", "Master Consumption Log"],
  "/reports/per-driver":     ["Reports", "Per-Driver Breakdown"],
  "/reports/air":            ["Reports", "Acceptance & Inspection"],
  "/reports/consumption":    ["Reports", "Actual Consumption"],
};

export default function AppHeader() {
  const pathname       = usePathname();
  const { toggle }     = useSidebar();
  const [now, setNow]  = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const crumbs    = BREADCRUMB_MAP[pathname] ?? [pathname.split("/").filter(Boolean).pop() ?? "Page"];
  const dateStr   = now?.toLocaleDateString("en-PH", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) ?? "";
  const timeStr   = now?.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) ?? "";

  return (
    <header className="app-header sticky top-0 z-30 h-[58px] bg-white/90 backdrop-blur-md border-b border-gray-200/80 flex items-center px-5 gap-4 print:hidden shrink-0">
      {/* ── Left: mobile hamburger + breadcrumb ──────────────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <nav className="flex items-center gap-0.5 min-w-0 overflow-hidden">
          <span className="text-xs text-gray-400 hidden sm:inline-block shrink-0 font-medium">
            Treasurer&apos;s Office
          </span>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-0.5 min-w-0">
              <ChevronRight size={12} className="text-gray-300 shrink-0 mx-0.5" />
              <span
                className={
                  i === crumbs.length - 1
                    ? "text-xs font-semibold text-gray-900 truncate"
                    : "text-xs text-gray-500 truncate hidden sm:inline"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* ── Right: clock, search, bells, avatar ──────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Date / time chip */}
        {now && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 mr-1">
            <span className="text-[11px] text-gray-500 leading-none">{dateStr}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-[11px] font-semibold text-gray-700 leading-none">{timeStr}</span>
          </div>
        )}

        {/* Search */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>

        {/* User avatar */}
        <div className="ml-1 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-sm">
          <span className="text-[10px] font-bold text-white tracking-wide">PTO</span>
        </div>
      </div>
    </header>
  );
}
