"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate, formatDateLong, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import type { CashAdvance, ConsumptionRow } from "@/types";
import { Download, Printer } from "lucide-react";

const pThBase: React.CSSProperties = {
  border: "1px solid #3b5a8a",
  padding: "5px 7px",
  fontWeight: 700,
  fontSize: "8.5pt",
  color: "#fff",
  textAlign: "left",
};
const pTd: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "4px 7px",
  fontSize: "8.5pt",
  verticalAlign: "middle",
};

export default function ConsumptionPage() {
  const [rows, setRows] = useState<ConsumptionRow[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [cashAdvanceId, setCashAdvanceId] = useState("");

  const fetchData = useCallback(async () => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

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
  const printDate = formatDateLong(new Date());

  const handlePrint = () => {
    const el = document.createElement("style");
    el.id = "__print_page";
    el.textContent = "@page { size: A4 portrait; margin: 0; }";
    document.head.appendChild(el);
    window.addEventListener("afterprint", () => {
      document.getElementById("__print_page")?.remove();
    }, { once: true });
    window.print();
  };

  return (
    <div>
      {/* ── Screen UI ──────────────────────────────────────────────────── */}
      <div className="print:hidden">
        <Header
          title="Actual Consumption Report"
          subtitle="Fuel consumption grouped by plate number with fuel-type columns"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}><Printer size={14} /> Print</Button>
              <Button onClick={downloadExcel}><Download size={14} /> Export Excel</Button>
            </div>
          }
        />

        <Card className="mb-6">
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

        {/* Screen report document */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-5xl mx-auto overflow-hidden">

          {/* ── Document Header ─────────────────────────────────────────── */}
          <div className="px-10 pt-8 pb-6 border-b-2 border-gray-800">
            <p className="text-center text-[10px] font-semibold tracking-[0.45em] text-gray-500 uppercase mb-5">
              Republic of the Philippines
            </p>
            <div className="flex items-center gap-6">
              <img
                src="/davao-del-norte-seal.png"
                alt="Province of Davao del Norte Official Seal"
                className="w-24 h-24 object-contain flex-shrink-0"
              />
              <div className="flex-1 text-center leading-snug">
                <p className="text-2xl font-black tracking-wider text-gray-900">
                  {PROVINCE_HEADER.province.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-1">{PROVINCE_HEADER.address}</p>
                <p className="text-sm font-bold tracking-widest text-gray-700 mt-2 uppercase">
                  {PROVINCE_HEADER.office}
                </p>
              </div>
              <div className="w-24 flex-shrink-0" />
            </div>
            <div className="mt-6 pt-5 border-t border-gray-300 text-center">
              <p className="text-[17px] font-black tracking-[0.2em] text-gray-900 uppercase">
                Actual Consumption Report
              </p>
              {period.from && period.to && (
                <p className="text-sm text-gray-500 mt-1.5">
                  Period Covered: {formatDate(period.from)} to {formatDate(period.to)}
                </p>
              )}
            </div>
          </div>

          <div className="px-10 py-6">
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
                    <td className="border border-gray-300 px-3 py-2 text-right">{r.dieselLiters > 0 ? formatNumber(r.dieselLiters) : "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{r.gasolineLiters > 0 ? formatNumber(r.gasolineLiters) : "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{r.premiumLiters > 0 ? formatNumber(r.premiumLiters) : "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold">₱{formatNumber(r.totalAmount)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600">{r.invoiceNumbers.join(", ")}</td>
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
          </div>{/* /px-10 py-6 */}
        </div>
      </div>

      {/* ── Print Document (A4 portrait) ───────────────────────────────── */}
      <div className="hidden print:block">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><td style={{ height: "18mm", padding: 0 }}></td></tr></thead>
          <tfoot><tr><td style={{ height: "20mm", padding: 0 }}></td></tr></tfoot>
          <tbody><tr><td style={{ padding: "0 15mm", verticalAlign: "top" }}>
          <div style={{ fontFamily: '"Times New Roman", Times, serif', color: "#000" }}>

            {/* Province header */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ textAlign: "center", fontSize: "8.5pt", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                Republic of the Philippines
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <img src="/davao-del-norte-seal.png" alt="Province of Davao del Norte Official Seal" style={{ width: "72px", height: "72px", objectFit: "contain", flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: "center", lineHeight: 1.6 }}>
                  <div style={{ fontSize: "11pt", fontWeight: 700 }}>{PROVINCE_HEADER.province.toUpperCase()}</div>
                  <div style={{ fontSize: "9.5pt" }}>{PROVINCE_HEADER.address}</div>
                  <div style={{ fontSize: "10.5pt", fontWeight: 700 }}>{PROVINCE_HEADER.office.toUpperCase()}</div>
                </div>
                <div style={{ width: "72px", flexShrink: 0 }}></div>
              </div>
              <div style={{ textAlign: "center", marginTop: "10px", borderTop: "1.5px solid #c0c0c0", paddingTop: "8px" }}>
                <div style={{ fontSize: "13pt", fontWeight: 700, textDecoration: "underline", letterSpacing: "0.04em" }}>
                  ACTUAL CONSUMPTION REPORT
                </div>
                {period.from && period.to && (
                  <div style={{ fontSize: "9pt", marginTop: "3px", color: "#444" }}>
                    Period Covered: <strong>{formatDateLong(period.from)}</strong> to <strong>{formatDateLong(period.to)}</strong>
                  </div>
                )}
                <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "2px" }}>Printed: {printDate}</div>
              </div>
            </div>

            {/* Data table */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1e3a5f" }}>
              <thead>
                <tr style={{ backgroundColor: "#1e3a5f" }}>
                  <th style={{ ...pThBase, width: "10%" }} rowSpan={2}>Plate No.</th>
                  <th style={{ ...pThBase, width: "13%" }} rowSpan={2}>Driver</th>
                  <th style={{ ...pThBase, width: "20%" }} rowSpan={2}>Vehicle Description</th>
                  <th style={{ ...pThBase, textAlign: "center", width: "24%" }} colSpan={3}>Quantity (Liters)</th>
                  <th style={{ ...pThBase, textAlign: "right", width: "13%" }} rowSpan={2}>Total Amount (₱)</th>
                  <th style={{ ...pThBase, width: "20%", borderRight: "none" }} rowSpan={2}>Invoice No.</th>
                </tr>
                <tr style={{ backgroundColor: "#264d7e" }}>
                  {["Diesel", "Unleaded", "Premium"].map((h) => (
                    <th key={h} style={{ ...pThBase, textAlign: "center", width: "8%" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.plateNumber} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f5f7fa" }}>
                    <td style={{ ...pTd, fontFamily: "monospace", fontWeight: 600, color: "#1e3a8a" }}>{r.plateNumber}</td>
                    <td style={{ ...pTd, fontWeight: 500 }}>{r.driverName}</td>
                    <td style={{ ...pTd, color: "#555" }}>{r.description}</td>
                    <td style={{ ...pTd, textAlign: "right" }}>{r.dieselLiters > 0 ? formatNumber(r.dieselLiters) : "—"}</td>
                    <td style={{ ...pTd, textAlign: "right" }}>{r.gasolineLiters > 0 ? formatNumber(r.gasolineLiters) : "—"}</td>
                    <td style={{ ...pTd, textAlign: "right" }}>{r.premiumLiters > 0 ? formatNumber(r.premiumLiters) : "—"}</td>
                    <td style={{ ...pTd, textAlign: "right", fontWeight: 600 }}>₱{formatNumber(r.totalAmount)}</td>
                    <td style={{ ...pTd, fontSize: "7.5pt", color: "#555", borderRight: "none" }}>{r.invoiceNumbers.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#1e3a5f", color: "#fff", fontWeight: 700 }}>
                  <td colSpan={3} style={{ border: "1px solid #3b5a8a", padding: "5px 7px", textAlign: "center", fontSize: "8.5pt" }}>TOTAL</td>
                  <td style={{ border: "1px solid #3b5a8a", padding: "5px 7px", textAlign: "right", fontSize: "8.5pt" }}>{formatNumber(totDiesel)}</td>
                  <td style={{ border: "1px solid #3b5a8a", padding: "5px 7px", textAlign: "right", fontSize: "8.5pt" }}>{formatNumber(totGas)}</td>
                  <td style={{ border: "1px solid #3b5a8a", padding: "5px 7px", textAlign: "right", fontSize: "8.5pt" }}>{formatNumber(totPrem)}</td>
                  <td style={{ border: "1px solid #3b5a8a", padding: "5px 7px", textAlign: "right", fontSize: "8.5pt" }}>₱{formatNumber(totAmt)}</td>
                  <td style={{ padding: "5px 7px" }}></td>
                </tr>
              </tfoot>
            </table>

            {/* Certification note */}
            <div style={{ marginTop: "10px", fontSize: "7.5pt", color: "#666", fontStyle: "italic" }}>
              This report is system-generated from the LiquidLedger Fuel Cash Advance Liquidation System, Provincial Treasurer&apos;s Office — Province of Davao del Norte.
              {period.from && period.to
                ? ` Data covers the period ${formatDateLong(period.from)} to ${formatDateLong(period.to)}.`
                : " Data covers all recorded fuel entries."}
            </div>

            {/* Signature block */}
            <div style={{ marginTop: "36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", fontSize: "8.5pt" }}>
              <div>
                <div style={{ fontSize: "8pt", color: "#555", marginBottom: "4px" }}>Prepared by:</div>
                <div style={{ height: "40px" }} />
                <div style={{ borderTop: "2px solid #000", paddingTop: "5px" }}>
                  <div style={{ fontWeight: 700, textAlign: "center" }}>Administrative Officer / Property Custodian</div>
                  <div style={{ textAlign: "center", fontSize: "8pt", color: "#666", marginTop: "2px" }}>Date: ___________________</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8pt", color: "#555", marginBottom: "4px" }}>Approved / Certified by:</div>
                <div style={{ height: "40px" }} />
                <div style={{ borderTop: "2px solid #000", paddingTop: "5px" }}>
                  <div style={{ fontWeight: 700, textAlign: "center" }}>Department / Office Head</div>
                  <div style={{ textAlign: "center", fontSize: "8pt", color: "#666", marginTop: "2px" }}>Date: ___________________</div>
                </div>
              </div>
            </div>

          </div>
          </td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
