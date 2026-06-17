"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import {
  LayoutDashboard, Car, CreditCard, Fuel, FileText,
  ClipboardList, BarChart3, Upload, ChevronLeft, ChevronRight,
  type LucideProps,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
type NavLink      = { href: string; label: string; icon: LucideIcon };
type NavSeparator = { type: "separator"; label: string };
type NavItem      = NavLink | NavSeparator;

const navItems: NavItem[] = [
  { href: "/",                     label: "Dashboard",               icon: LayoutDashboard },
  { href: "/vehicles",             label: "Vehicle Master",          icon: Car             },
  { href: "/cash-advances",        label: "Cash Advances",           icon: CreditCard      },
  { href: "/fuel-entries",         label: "Fuel Entries",            icon: Fuel            },
  { href: "/fuel-entries/import",  label: "Import Data",             icon: Upload          },
  { type: "separator",             label: "Reports"                                        },
  { href: "/reports/master-log",   label: "Master Log",              icon: ClipboardList   },
  { href: "/reports/per-driver",   label: "Per-Driver",              icon: Car             },
  { href: "/reports/air",          label: "Acceptance & Inspection", icon: FileText        },
  { href: "/reports/consumption",  label: "Consumption",             icon: BarChart3       },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { collapsed, toggle } = useSidebar();

  const bestMatchLength = navItems
    .filter((item): item is typeof item & { href: string } =>
      "href" in item &&
      (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")))
    )
    .reduce((max, item) => Math.max(max, item.href.length), 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col z-40 print:hidden",
        "bg-white border-r border-gray-200/80",
        "shadow-[4px_0_20px_rgba(0,0,0,0.04)]",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* ── Logo / Province ──────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center border-b border-gray-100 py-4 shrink-0",
          collapsed ? "px-3 justify-center" : "px-4 gap-3"
        )}
      >
        {/* Seal */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/davao-del-norte-seal.png"
            alt="Davao del Norte Seal"
            className="w-8 h-8 object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-medium leading-none mb-0.5">
              Province of
            </div>
            <div className="font-bold text-gray-900 text-[13px] leading-tight truncate">
              Davao del Norte
            </div>
            <div className="text-[10px] text-blue-500 font-medium truncate">
              Provincial Treasurer&apos;s Office
            </div>
          </div>
        )}
      </div>

      {/* ── System badge ─────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-700 tracking-wide">LiquidLedger</span>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className={cn("flex-1 overflow-y-auto py-3 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item, i) => {
          if (!("href" in item)) {
            return collapsed
              ? <div key={i} className="my-2 border-t border-gray-100" />
              : (
                <div key={i} className="pt-4 pb-1.5 px-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {item.label}
                  </span>
                </div>
              );
          }

          const Icon = item.icon;
          const isActive =
            item.href.length === bestMatchLength &&
            (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/")));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "sidebar-nav-item",
                collapsed && "justify-center !px-0 py-2.5",
                isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <div className={cn("border-t border-gray-100 py-3 shrink-0", collapsed ? "px-2" : "px-3")}>
        <button
          onClick={toggle}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
            "text-gray-400 hover:text-gray-700 hover:bg-gray-50",
            "text-xs font-medium transition-colors duration-200",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
