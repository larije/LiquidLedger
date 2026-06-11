"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { FuelEntryWithRelations, CashAdvance, FuelType } from "@/types";
import { Download, Printer } from "lucide-react";

export default function MasterLogPage() {
  const [entries, setEntries] = useState<FuelEntryWithRelations[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", cashAdvanceId: "" });

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.cashAdvanceId) params.set("cashAdvanceId", filters.cashAdvanceId);
    const [eRes, aRes] = await Promise.all([
      window.fetch(`/api/reports/master-log?${params}`),
      window.fetch("/api/cash-advances"),
    ]);
    const eData = await eRes.json();
    setEntries(eData.entries ?? []);
    setAdvances(await aRes.json());
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalConsumed = entries.reduce((s, e) => s + e.amount, 0);
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);
  const selectedAdvance = advances.find((a) => a.id === filters.cashAdvanceId);
  const totalGranted = selectedAdvance?.amount ?? advances.reduce((s, a) => s + a.amount, 0);
  const remaining = totalGranted - totalConsumed;

  const downloadExcel = () => {
    const params = new URLSearchParams({ format: "excel" });
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.cashAdvanceId) params.set("cashAdvanceId", filters.cashAdvanceId);
    window.open(`/api/reports/master-log?${params}`);
  };

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  return (
    <div>
      <Header
        title="Master Consumption Log"
        subtitle="Full itemized fuel purchase log with running balance"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button onClick={downloadExcel}><Download size={14} /> Export Excel</Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filters.cashAdvanceId}
              onChange={(e) => setFilters((p) => ({ ...p, cashAdvanceId: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500"
            >
              <option value="">All Cash Advances</option>
              {advances.map((a) => <option key={a.id} value={a.id}>{a.purpose}</option>)}
            </select>
            <input type="date" value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Printable report */}
      <div id="print-area" className="print:text-[10pt]">
        {/* Province header */}
        <div className="text-center mb-4 print:mb-2">
          <div className="font-bold text-base">{PROVINCE_HEADER.province.toUpperCase()}</div>
          <div className="text-sm">{PROVINCE_HEADER.address}</div>
          <div className="font-bold">{PROVINCE_HEADER.office.toUpperCase()}</div>
          <div className="font-bold text-lg mt-1">MASTER FUEL CONSUMPTION LOG</div>
          {filters.from && filters.to && (
            <div className="text-sm">Period: {formatDate(filters.from)} to {formatDate(filters.to)}</div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 print:gap-2">
          {[
            { label: "Total Cash Advance Granted", value: formatCurrency(totalGranted), color: "text-blue-700" },
            { label: "Total Amount Consumed", value: formatCurrency(totalConsumed), color: "text-red-600" },
            { label: "Remaining Balance", value: formatCurrency(remaining), color: "text-green-700" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3">
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-900 text-white text-xs">
                      {["No.", "Date", "Driver", "Plate No.", "Odometer", "Fuel Type", "Qty (L)", "Unit Price (₱)", "Amount (₱)", "Invoice No.", "Eng. Oil", "Remarks"].map((h) => (
                        <th key={h} className="px-3 py-2.5 font-semibold text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((e, i) => (
                      <tr key={e.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30`}>
                        <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{formatDate(e.date)}</td>
                        <td className="px-3 py-2 font-medium">{e.vehicle.assignedDriver}</td>
                        <td className="px-3 py-2 font-mono text-blue-700 text-xs">{e.vehicle.plateNumber}</td>
                        <td className="px-3 py-2 text-right text-xs">{e.odometer.toLocaleString()}</td>
                        <td className="px-3 py-2"><Badge variant={fuelBadge(e.fuelType as FuelType)} className="text-xs">{FUEL_TYPE_LABELS[e.fuelType as FuelType]}</Badge></td>
                        <td className="px-3 py-2 text-right">{formatNumber(e.quantity)}</td>
                        <td className="px-3 py-2 text-right">₱{formatNumber(e.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium">₱{formatNumber(e.amount)}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">{e.invoiceNumber}</td>
                        <td className="px-3 py-2 text-center text-xs">{e.hasEngineOil ? "Yes" : "—"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{e.remarks ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-900 text-white font-bold">
                      <td className="px-3 py-2.5" colSpan={5}>TOTAL</td>
                      <td />
                      <td className="px-3 py-2.5 text-right">{formatNumber(totalQty)} L</td>
                      <td />
                      <td className="px-3 py-2.5 text-right">₱{formatNumber(totalConsumed)}</td>
                      <td colSpan={3} />
                    </tr>
                    <tr className="bg-gray-100 font-semibold text-sm">
                      <td className="px-3 py-2" colSpan={6}>Remaining Balance</td>
                      <td colSpan={2} />
                      <td className="px-3 py-2 text-right text-green-700">₱{formatNumber(remaining)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
