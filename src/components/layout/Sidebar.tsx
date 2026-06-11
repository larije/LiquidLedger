"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, CreditCard, Fuel, FileText,
  ClipboardList, BarChart3, Upload,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicle Master", icon: Car },
  { href: "/cash-advances", label: "Cash Advances", icon: CreditCard },
  { href: "/fuel-entries", label: "Fuel Entries", icon: Fuel },
  { href: "/fuel-entries/import", label: "Import Data", icon: Upload },
  { type: "separator", label: "Reports" },
  { href: "/reports/master-log", label: "Master Consumption Log", icon: ClipboardList },
  { href: "/reports/per-driver", label: "Per-Driver Breakdown", icon: Car },
  { href: "/reports/air", label: "Acceptance & Inspection", icon: FileText },
  { href: "/reports/consumption", label: "Actual Consumption", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-blue-900 text-white flex flex-col z-40">
      <div className="px-4 py-5 border-b border-blue-800">
        <div className="text-xs text-blue-300 uppercase tracking-wider">Province of</div>
        <div className="font-bold text-lg leading-tight">Davao del Norte</div>
        <div className="text-xs text-blue-300 mt-0.5">Provincial Treasurer&apos;s Office</div>
        <div className="mt-2 text-xs font-semibold bg-blue-700 rounded px-2 py-1 inline-block">
          LiquidLedger
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.type === "separator") {
            return (
              <div key={i} className="pt-4 pb-1 px-3 text-xs font-semibold uppercase tracking-widest text-blue-400">
                {item.label}
              </div>
            );
          }
          const Icon = item.icon!;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href!));
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "sidebar-nav-item",
                isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
              )}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-blue-800 text-xs text-blue-400">
        Fuel Cash Advance Liquidation System
      </div>
    </aside>
  );
}
