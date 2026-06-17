"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { DashboardStats, FuelEntryWithRelations, FuelType } from "@/types";
import {
  Car, Fuel,
  FileText, BarChart3, ClipboardList,
  ArrowRight, Banknote, ReceiptText, Wallet,
} from "lucide-react";

interface DashboardData {
  stats: DashboardStats;
  recentEntries: FuelEntryWithRelations[];
}

/* ─────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <DashboardSkeleton />;

  const { stats, recentEntries } = data;
  const pct = stats.totalGranted > 0
    ? Math.min(100, (stats.totalConsumed / stats.totalGranted) * 100)
    : 0;

  const fuelBadge = (ft: FuelType): "info" | "success" | "warning" =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  const utilizationColor =
    pct > 90 ? "#EF4444" :
    pct > 70 ? "#F59E0B" :
               "#2563EB";

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Province header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
            Province of Davao del Norte
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Fuel Cash Advance Liquidation — Provincial Treasurer&apos;s Office
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-700">Live System</span>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Banknote size={24} strokeWidth={1.75} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total Granted"
          value={formatCurrency(stats.totalGranted)}
          trend={{ dir: "up", label: "cash advance budget" }}
          delay="stagger-1"
          gradient="linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)"
          topBorderColor="#2563EB"
          iconGlow="rgba(37,99,235,0.18)"
          badge={{ text: "↗ Active", color: "blue" }}
        />
        <StatCard
          icon={<ReceiptText size={24} strokeWidth={1.75} />}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="Total Consumed"
          value={formatCurrency(stats.totalConsumed)}
          trend={{ dir: "neutral", label: `${pct.toFixed(1)}% of budget` }}
          delay="stagger-2"
          gradient="linear-gradient(180deg, #FFFFFF 0%, #FFF8F8 100%)"
          topBorderColor="#EF4444"
          iconGlow="rgba(239,68,68,0.18)"
          badge={{ text: `${pct.toFixed(0)}% used`, color: "red" }}
        />
        <StatCard
          icon={<Wallet size={24} strokeWidth={1.75} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Remaining Balance"
          value={formatCurrency(stats.remainingBalance)}
          trend={{ dir: "up", label: "available to spend" }}
          delay="stagger-3"
          gradient="linear-gradient(180deg, #FFFFFF 0%, #F7FFF9 100%)"
          topBorderColor="#10B981"
          iconGlow="rgba(16,185,129,0.18)"
          badge={{ text: "↑ Healthy", color: "green" }}
        />
        <StatCard
          icon={<Fuel size={24} strokeWidth={1.75} />}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          label="Fuel Entries"
          value={stats.totalEntries.toString()}
          trend={{ dir: "neutral", label: `${stats.totalVehicles} vehicle${stats.totalVehicles !== 1 ? "s" : ""}` }}
          delay="stagger-4"
          gradient="linear-gradient(180deg, #FFFFFF 0%, #FFF9F2 100%)"
          topBorderColor="#F97316"
          iconGlow="rgba(249,115,22,0.18)"
          badge={{ text: "✓ Updated", color: "orange" }}
        />
      </div>

      {/* ── Utilization bar ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-sm font-semibold text-gray-800">Cash Advance Utilization</span>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatCurrency(stats.totalConsumed)} consumed of {formatCurrency(stats.totalGranted)} granted
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ color: utilizationColor }}
              >
                {pct.toFixed(1)}%
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: utilizationColor,
                  background: pct > 90 ? "#FEF2F2" : pct > 70 ? "#FFFBEB" : "#EFF6FF",
                }}
              >
                {pct > 90 ? "Critical" : pct > 70 ? "High" : "Healthy"}
              </span>
            </div>
          </div>

          {/* Track */}
          <div className="relative h-3.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct > 90
                  ? "linear-gradient(90deg, #EF4444, #DC2626)"
                  : pct > 70
                  ? "linear-gradient(90deg, #F59E0B, #D97706)"
                  : "linear-gradient(90deg, #2563EB, #1D4ED8)",
                boxShadow: `0 0 8px ${utilizationColor}55`,
              }}
            />
          </div>

          {/* Scale */}
          <div className="flex justify-between mt-3 text-[11px] text-gray-400">
            <span>₱0.00</span>
            <span className="text-gray-500 font-medium">
              Balance: {formatCurrency(stats.remainingBalance)}
            </span>
            <span>{formatCurrency(stats.totalGranted)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom grid: entries + reports ──────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-7">

        {/* Recent fuel entries */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Fuel Entries</CardTitle>
                <Link
                  href="/fuel-entries"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentEntries.length === 0 ? (
                <EmptyEntries />
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentEntries.map((e, idx) => (
                    <div
                      key={e.id}
                      className="px-7 py-5 flex items-center justify-between hover:bg-gray-50/60 transition-colors"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Driver + vehicle */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                          <Car size={16} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                            {e.vehicle?.assignedDriver}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {e.vehicle?.plateNumber} · {formatDate(e.date)}
                          </p>
                        </div>
                      </div>

                      {/* Badge + amount */}
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <Badge variant={fuelBadge(e.fuelType as FuelType)} dot>
                          {FUEL_TYPE_LABELS[e.fuelType as FuelType]}
                        </Badge>
                        <div className="text-right hidden xs:block">
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {formatCurrency(e.amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatNumber(e.quantity)} L
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report cards */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <ReportCard
                href="/reports/master-log"
                icon={<ClipboardList size={18} />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Master Consumption Log"
                desc="Full itemized log with totals"
              />
              <ReportCard
                href="/reports/per-driver"
                icon={<Car size={18} />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label="Per-Driver Breakdown"
                desc="Filtered by assigned driver"
              />
              <ReportCard
                href="/reports/air"
                icon={<FileText size={18} />}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                label="Acceptance & Inspection"
                desc="AIR for supplier payment"
              />
              <ReportCard
                href="/reports/consumption"
                icon={<BarChart3 size={18} />}
                iconBg="bg-orange-50"
                iconColor="text-orange-500"
                label="Actual Consumption"
                desc="Grouped by plate number"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-600 border border-blue-100",
  red:    "bg-red-50 text-red-500 border border-red-100",
  green:  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  orange: "bg-orange-50 text-orange-500 border border-orange-100",
};

function StatCard({
  icon, iconBg, iconColor, label, value, trend, delay,
  gradient, topBorderColor, iconGlow, badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  trend?: { dir: "up" | "down" | "neutral"; label: string };
  delay?: string;
  gradient?: string;
  topBorderColor?: string;
  iconGlow?: string;
  badge?: { text: string; color: string };
}) {
  return (
    <Card
      hover
      className={`animate-slide-up ${delay ?? ""}`}
      style={{
        ...(gradient ? { background: gradient } : {}),
        ...(topBorderColor ? { borderTop: `3px solid ${topBorderColor}` } : {}),
      }}
    >
      <CardContent className="py-7">
        <div className="flex items-start justify-between mb-5">
          <div
            className={`stat-icon ${iconBg}`}
            style={iconGlow ? { boxShadow: `0 4px 16px ${iconGlow}` } : undefined}
          >
            <span className={iconColor}>{icon}</span>
          </div>
          {badge && (
            <span className={`stat-badge ${BADGE_CLASSES[badge.color] ?? ""}`}>
              {badge.text}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-2 font-medium tracking-wide uppercase">{label}</p>
        <p className="text-[26px] font-bold text-gray-900 leading-none tracking-tight">
          {value}
        </p>
        {trend && (
          <p className="text-[11px] text-gray-400 mt-2.5">{trend.label}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportCard({
  href, icon, iconBg, iconColor, label, desc,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  desc: string;
}) {
  return (
    <Link href={href} className="report-card group block">
      <div className={`report-icon w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors leading-tight truncate">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0 self-center"
      />
    </Link>
  );
}

function EmptyEntries() {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Fuel size={22} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">No fuel entries yet</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Add a fuel entry to see it here
        </p>
      </div>
      <Link
        href="/fuel-entries"
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        Go to Fuel Entries →
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
            <div className="skeleton w-12 h-12 rounded-xl mb-3" />
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-6 w-32" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
        <div className="skeleton h-4 w-40 mb-4" />
        <div className="skeleton h-3 w-full rounded-full" />
      </div>
    </div>
  );
}
