"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import type { CashAdvance, ConsumptionRow } from "@/types";
import { Download, Printer } from "lucide-react";

export default function ConsumptionPage() {
  const [rows, setRows] = useState<ConsumptionRow[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [cashAdvanceId, setCashAdvanceId] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    if (cashAdvanceId) params.set("cashAdvanceId", cashAdvanceId);
    const [rRes, aRes] = await Promise.all([
      window.fetch(`/api/reports/consumption?${params}`),
      window.fetch("/api/cash-advances"),
    ]);
    const rData = await rRes.json();
    setRows(rData.rows ?? []);
    setAdvances(await aRes.json());
    setLoading(false);
  }, [period.from, period.to, cashAdvanceId]);

  useEffect(() => { fetch(); }, [fetch]);

  const downloadExcel = () => {
    const params = new URLSearchParams({ format: "excel" });
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    if (cashAdvanceId) params.set("cashAdvanceId", cashAdvanceId);
    window.open(`/api/reports/consumption?${params}`);
  };

  const totDiesel = rows.reduce((s, r) => s + r.dieselLiters, 0);
  const totGas = rows.reduce((s, r) => s + r.gasolineLiters, 0);
  const totPrem = rows.reduce((s, r) => s + r.premiumLiters, 0);
  const totAmt = rows.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div>
      <Header
        title="Actual Consumption Report"
        subtitle="Fuel consumption grouped by plate number with fuel-type columns"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button onClick={downloadExcel}><Download size={14} /> Export Excel</Button>
          </div>
        }
      />

      {/* Controls */}
      <Card className="mb-6 print:hidden">
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <select value={cashAdvanceId} onChange={(e) => setCashAdvanceId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm border-gray-300 outline-none focus:border-blue-500">
              <option value="">All Cash Advances</option>
              {advances.map((a) => <option key={a.id} value={a.id}>{a.purpose}</option>)}
            </select>
            <input type="date" value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm border-gray-300 outline-none" />
            <span className="text-gray-400">to</span>
            <input type="date" value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm border-gray-300 outline-none" />
          </div>
        </CardContent>
      </Card>

      {/* Report document */}
      <div className="bg-white border rounded-xl p-8 print:p-0 print:border-0 max-w-5xl mx-auto print:max-w-none">
        <div className="text-center mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Republic of the Philippines</div>
          <div className="font-bold text-lg">{PROVINCE_HEADER.province.toUpperCase()}</div>
          <div className="text-sm">{PROVINCE_HEADER.address}</div>
          <div className="font-bold">{PROVINCE_HEADER.office.toUpperCase()}</div>
          <div className="font-bold text-xl mt-2 tracking-wide">ACTUAL CONSUMPTION REPORT</div>
          {period.from && period.to && (
            <div className="text-sm mt-1">
              Period Covered: {formatDate(period.from)} to {formatDate(period.to)}
            </div>
          )}
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border border-blue-700 px-3 py-2 text-left" rowSpan={2}>Plate No.</th>
              <th className="border border-blue-700 px-3 py-2 text-left" rowSpan={2}>Driver</th>
              <th className="border border-blue-700 px-3 py-2 text-left" rowSpan={2}>Vehicle Description</th>
              <th className="border border-blue-700 px-3 py-2 text-center" colSpan={3}>Quantity (Liters)</th>
              <th className="border border-blue-700 px-3 py-2 text-right" rowSpan={2}>Total Amount (₱)</th>
              <th className="border border-blue-700 px-3 py-2 text-left" rowSpan={2}>Invoice No.</th>
            </tr>
            <tr className="bg-blue-800 text-white">
              <th className="border border-blue-700 px-3 py-2 text-center">Diesel</th>
              <th className="border border-blue-700 px-3 py-2 text-center">Unleaded</th>
              <th className="border border-blue-700 px-3 py-2 text-center">Premium</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="border px-3 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="border px-3 py-8 text-center text-gray-400">No data for selected period</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.plateNumber} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                  <td className="border border-gray-300 px-3 py-2 font-mono font-semibold text-blue-800">{r.plateNumber}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{r.driverName}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">{r.description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {r.dieselLiters > 0 ? formatNumber(r.dieselLiters) : "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {r.gasolineLiters > 0 ? formatNumber(r.gasolineLiters) : "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {r.premiumLiters > 0 ? formatNumber(r.premiumLiters) : "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    ₱{formatNumber(r.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">
                    {r.invoiceNumbers.join(", ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-blue-900 text-white font-bold">
              <td className="border border-blue-700 px-3 py-2.5 text-center" colSpan={3}>TOTAL</td>
              <td className="border border-blue-700 px-3 py-2.5 text-right">{formatNumber(totDiesel)}</td>
              <td className="border border-blue-700 px-3 py-2.5 text-right">{formatNumber(totGas)}</td>
              <td className="border border-blue-700 px-3 py-2.5 text-right">{formatNumber(totPrem)}</td>
              <td className="border border-blue-700 px-3 py-2.5 text-right">₱{formatNumber(totAmt)}</td>
              <td className="border border-blue-700 px-3 py-2.5" />
            </tr>
          </tfoot>
        </table>

        {/* Certification */}
        <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="text-xs text-gray-600 mb-1">Prepared by:</p>
            <div className="border-b-2 border-gray-800 mt-8 mb-1" />
            <div className="font-semibold text-center text-xs">Administrative Officer / Property Custodian</div>
            <div className="text-center text-xs text-gray-500">Date: ___________________</div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Approved/Certified by:</p>
            <div className="border-b-2 border-gray-800 mt-8 mb-1" />
            <div className="font-semibold text-center text-xs">Department/Office Head</div>
            <div className="text-center text-xs text-gray-500">Date: ___________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
