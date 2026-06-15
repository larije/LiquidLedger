"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatDateLong, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { FuelEntryWithRelations, CashAdvance, FuelType } from "@/types";
import { Download, Printer } from "lucide-react";

const thP: React.CSSProperties = {
  padding: "5px 7px",
  fontWeight: 700,
  fontSize: "8pt",
  color: "#fff",
  borderRight: "1px solid #3b5a8a",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const tdP: React.CSSProperties = {
  padding: "4px 7px",
  fontSize: "8pt",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  verticalAlign: "middle",
};
const tfP: React.CSSProperties = {
  padding: "5px 7px",
  fontSize: "8pt",
  fontWeight: 700,
  borderRight: "1px solid #3b5a8a",
};

export default function MasterLogPage() {
  const [entries, setEntries] = useState<FuelEntryWithRelations[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", cashAdvanceId: "" });

  const fetchData = useCallback(async () => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handlePrint = () => {
    const el = document.createElement("style");
    el.id = "__print_page";
    el.textContent = "@page { size: A4 landscape; margin: 0; }";
    document.head.appendChild(el);
    window.addEventListener("afterprint", () => {
      document.getElementById("__print_page")?.remove();
    }, { once: true });
    window.print();
  };

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  return (
    <div>
      {/* ── Screen UI ──────────────────────────────────────────────────── */}
      <div className="print:hidden">
        <Header
          title="Master Consumption Log"
          subtitle="Full itemized fuel purchase log with running balance"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}><Printer size={14} /> Print</Button>
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

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
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

      {/* ── Print Document (A4 landscape) ──────────────────────────────── */}
      <div className="hidden print:block">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><td style={{ height: "14mm", padding: 0 }}></td></tr></thead>
          <tfoot><tr><td style={{ height: "16mm", padding: 0 }}></td></tr></tfoot>
          <tbody><tr><td style={{ padding: "0 12mm", verticalAlign: "top" }}>
          <div style={{ fontFamily: '"Times New Roman", Times, serif', color: "#000" }}>

        {/* Province header */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <img src="/davao-del-norte-seal.png" alt="Province of Davao del Norte Official Seal" style={{ width: "72px", height: "72px", objectFit: "contain", flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "center", lineHeight: 1.6 }}>
              <div style={{ fontSize: "11pt", fontWeight: 700 }}>{PROVINCE_HEADER.province.toUpperCase()}</div>
              <div style={{ fontSize: "9.5pt" }}>{PROVINCE_HEADER.address}</div>
              <div style={{ fontSize: "10.5pt", fontWeight: 700 }}>{PROVINCE_HEADER.office.toUpperCase()}</div>
            </div>
            <div style={{ width: "72px", flexShrink: 0 }}></div>
          </div>
          <div style={{ textAlign: "center", marginTop: "8px", borderTop: "1.5px solid #c0c0c0", paddingTop: "8px" }}>
          <div style={{ fontSize: "13pt", fontWeight: 700, textDecoration: "underline", letterSpacing: "0.04em" }}>
            MASTER FUEL CONSUMPTION LOG
          </div>
          <div style={{ fontSize: "9pt", marginTop: "3px", color: "#444" }}>
            {filters.from && filters.to
              ? <>Period: <strong>{formatDateLong(filters.from)}</strong> to <strong>{formatDateLong(filters.to)}</strong></>
              : "All Periods"}
            {selectedAdvance && <> &mdash; Cash Advance: <strong>{selectedAdvance.purpose}</strong></>}
          </div>
          <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "2px" }}>
            Printed: {formatDateLong(new Date())}
          </div>
          </div>
        </div>

        {/* Summary band */}
        <div style={{ display: "flex", border: "1px solid #1e3a5f", marginBottom: "12px", borderRadius: "3px", overflow: "hidden" }}>
          {[
            { label: "Total Cash Advance Granted", value: formatCurrency(totalGranted), color: "#1e3a8a" },
            { label: "Total Amount Consumed", value: formatCurrency(totalConsumed), color: "#991b1b" },
            { label: "Remaining Balance", value: formatCurrency(remaining), color: "#14532d" },
            { label: "Total Fuel Quantity", value: `${formatNumber(totalQty)} L`, color: "#374151" },
            { label: "No. of Transactions", value: String(entries.length), color: "#374151" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "7px 10px", borderLeft: i > 0 ? "1px solid #1e3a5f" : "none", textAlign: "center" }}>
              <div style={{ fontSize: "7pt", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "11pt", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Data table */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1e3a5f" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e3a5f" }}>
              <th style={{ ...thP, textAlign: "center", width: "26px" }}>No.</th>
              <th style={thP}>Date</th>
              <th style={thP}>Driver</th>
              <th style={thP}>Plate No.</th>
              <th style={{ ...thP, textAlign: "right" }}>Odometer</th>
              <th style={thP}>Fuel Type</th>
              <th style={{ ...thP, textAlign: "right" }}>Qty (L)</th>
              <th style={{ ...thP, textAlign: "right" }}>Unit Price (₱)</th>
              <th style={{ ...thP, textAlign: "right" }}>Amount (₱)</th>
              <th style={thP}>Invoice No.</th>
              <th style={{ ...thP, textAlign: "center" }}>Eng. Oil</th>
              <th style={{ ...thP, borderRight: "none" }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f5f7fa", pageBreakInside: "avoid" }}>
                <td style={{ ...tdP, textAlign: "center", color: "#888" }}>{i + 1}</td>
                <td style={{ ...tdP, whiteSpace: "nowrap" }}>{formatDate(e.date)}</td>
                <td style={{ ...tdP, fontWeight: 500 }}>{e.vehicle.assignedDriver}</td>
                <td style={{ ...tdP, fontFamily: "monospace" }}>{e.vehicle.plateNumber}</td>
                <td style={{ ...tdP, textAlign: "right" }}>{e.odometer.toLocaleString()}</td>
                <td style={tdP}>{FUEL_TYPE_LABELS[e.fuelType as FuelType]}</td>
                <td style={{ ...tdP, textAlign: "right" }}>{formatNumber(e.quantity)}</td>
                <td style={{ ...tdP, textAlign: "right" }}>₱{formatNumber(e.unitPrice)}</td>
                <td style={{ ...tdP, textAlign: "right", fontWeight: 600 }}>₱{formatNumber(e.amount)}</td>
                <td style={tdP}>{e.invoiceNumber}</td>
                <td style={{ ...tdP, textAlign: "center" }}>{e.hasEngineOil ? "Yes" : "—"}</td>
                <td style={{ ...tdP, color: "#555", borderRight: "none" }}>{e.remarks ?? "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#1e3a5f", color: "#fff" }}>
              <td colSpan={5} style={{ ...tfP, color: "#fff", borderTop: "2px solid #0f2240" }}>TOTAL</td>
              <td style={{ ...tfP, borderTop: "2px solid #0f2240" }}></td>
              <td style={{ ...tfP, textAlign: "right", color: "#fff", borderTop: "2px solid #0f2240" }}>{formatNumber(totalQty)} L</td>
              <td style={{ ...tfP, borderTop: "2px solid #0f2240" }}></td>
              <td style={{ ...tfP, textAlign: "right", color: "#fff", borderTop: "2px solid #0f2240" }}>₱{formatNumber(totalConsumed)}</td>
              <td colSpan={3} style={{ ...tfP, borderRight: "none", borderTop: "2px solid #0f2240" }}></td>
            </tr>
            <tr style={{ backgroundColor: "#eef2f7" }}>
              <td colSpan={7} style={{ ...tfP, color: "#374151", borderRight: "none", borderTop: "1px solid #1e3a5f" }}>Remaining Balance</td>
              <td style={{ ...tfP, borderTop: "1px solid #1e3a5f" }}></td>
              <td style={{ ...tfP, textAlign: "right", color: "#14532d", borderTop: "1px solid #1e3a5f" }}>₱{formatNumber(remaining)}</td>
              <td colSpan={3} style={{ ...tfP, borderRight: "none", borderTop: "1px solid #1e3a5f" }}></td>
            </tr>
          </tfoot>
        </table>

        {/* Certification note */}
        <div style={{ marginTop: "10px", fontSize: "7.5pt", color: "#666", fontStyle: "italic" }}>
          This report is system-generated from the LiquidLedger Fuel Cash Advance Liquidation System, Provincial Treasurer&apos;s Office — Province of Davao del Norte.
          {filters.from && filters.to
            ? ` Data covers the period ${formatDateLong(filters.from)} to ${formatDateLong(filters.to)}.`
            : " Data covers all recorded fuel entries."}
        </div>

        {/* Signature block */}
        <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px" }}>
          {[
            { label: "Prepared by", sub: "Designated Fuel Custodian" },
            { label: "Reviewed by", sub: "Provincial Accountant" },
            { label: "Approved by", sub: "Provincial Treasurer" },
          ].map(({ label, sub }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ height: "36px" }} />
              <div style={{ borderTop: "1px solid #000", paddingTop: "5px" }}>
                <div style={{ fontSize: "9pt", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: "8pt", color: "#666", marginTop: "1px" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
          </div>
          </td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
