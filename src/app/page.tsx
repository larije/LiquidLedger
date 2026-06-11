"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { DashboardStats, FuelEntryWithRelations, FuelType } from "@/types";
import {
  CreditCard, Car, Fuel, TrendingUp, TrendingDown, FileText,
  BarChart3, ClipboardList, ArrowRight,
} from "lucide-react";

interface DashboardData {
  stats: DashboardStats;
  recentEntries: FuelEntryWithRelations[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch("/api/dashboard").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="py-32 text-center text-gray-400">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const { stats, recentEntries } = data;
  const pct = stats.totalGranted > 0 ? (stats.totalConsumed / stats.totalGranted) * 100 : 0;

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  return (
    <div>
      {/* Province header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Province of Davao del Norte</div>
        <h1 className="text-2xl font-bold text-gray-900">Provincial Treasurer&apos;s Office</h1>
        <p className="text-sm text-gray-500">Fuel Cash Advance Liquidation System — LiquidLedger</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<CreditCard size={20} className="text-blue-600" />}
          label="Total Granted"
          value={formatCurrency(stats.totalGranted)}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingDown size={20} className="text-red-500" />}
          label="Total Consumed"
          value={formatCurrency(stats.totalConsumed)}
          bg="bg-red-50"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          label="Remaining Balance"
          value={formatCurrency(stats.remainingBalance)}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Fuel size={20} className="text-orange-500" />}
          label="Fuel Entries"
          value={stats.totalEntries.toString()}
          bg="bg-orange-50"
          sub={`${stats.totalVehicles} vehicles`}
        />
      </div>

      {/* Utilization bar */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Cash Advance Utilization</span>
            <span className="text-sm font-bold text-gray-900">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-400" : "bg-blue-500"}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>₱0</span>
            <span>{formatCurrency(stats.totalGranted)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent entries */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Fuel Entries</CardTitle>
                <Link href="/fuel-entries" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentEntries.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No entries yet</div>
              ) : (
                <div className="divide-y">
                  {recentEntries.map((e) => (
                    <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{e.vehicle?.assignedDriver}</div>
                        <div className="text-xs text-gray-500">{e.vehicle?.plateNumber} · {formatDate(e.date)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={fuelBadge(e.fuelType as FuelType)}>{FUEL_TYPE_LABELS[e.fuelType as FuelType]}</Badge>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{formatCurrency(e.amount)}</div>
                          <div className="text-xs text-gray-400">{formatNumber(e.quantity)} L</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div>
          <Card>
            <CardHeader><CardTitle>Generate Reports</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-2">
              <QuickLink href="/reports/master-log" icon={<ClipboardList size={16} className="text-blue-600" />} label="Master Consumption Log" desc="Full itemized log with totals" />
              <QuickLink href="/reports/per-driver" icon={<Car size={16} className="text-green-600" />} label="Per-Driver Breakdown" desc="Filtered by assigned driver" />
              <QuickLink href="/reports/air" icon={<FileText size={16} className="text-purple-600" />} label="Acceptance & Inspection" desc="AIR for supplier payment" />
              <QuickLink href="/reports/consumption" icon={<BarChart3 size={16} className="text-orange-500" />} label="Actual Consumption" desc="Grouped by plate number" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, sub }: {
  icon: React.ReactNode; label: string; value: string; bg: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>{icon}</div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-xl font-bold text-gray-900 leading-none">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{label}</div>
        <div className="text-xs text-gray-400 truncate">{desc}</div>
      </div>
    </Link>
  );
}
