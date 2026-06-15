"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate, formatDateLong, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { FuelEntryWithRelations, CashAdvance, FuelType } from "@/types";
import { Download, Printer } from "lucide-react";

const pTh: React.CSSProperties = {
  border: "1px solid #555",
  padding: "5px 8px",
  fontWeight: 700,
  fontSize: "8.5pt",
  backgroundColor: "#f0f0f0",
  textAlign: "center",
};
const pTd: React.CSSProperties = {
  border: "1px solid #aaa",
  padding: "4px 8px",
  fontSize: "8.5pt",
  verticalAlign: "top",
};

export default function AIRPage() {
  const [entries, setEntries] = useState<FuelEntryWithRelations[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    from: "", to: "", cashAdvanceId: "",
    airNumber: "AIR-001",
    payee: "",
    dateGenerated: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (config.from) params.set("from", config.from);
    if (config.to) params.set("to", config.to);
    if (config.cashAdvanceId) params.set("cashAdvanceId", config.cashAdvanceId);
    const [eRes, aRes] = await Promise.all([
      window.fetch(`/api/reports/air?${params}`),
      window.fetch("/api/cash-advances"),
    ]);
    const eData = await eRes.json();
    setEntries(eData.entries ?? []);
    setAdvances(await aRes.json());
    setLoading(false);
  }, [config.from, config.to, config.cashAdvanceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const downloadExcel = () => {
    const params = new URLSearchParams({
      format: "excel",
      airNumber: config.airNumber,
      payee: config.payee,
    });
    if (config.from) params.set("from", config.from);
    if (config.to) params.set("to", config.to);
    if (config.cashAdvanceId) params.set("cashAdvanceId", config.cashAdvanceId);
    window.open(`/api/reports/air?${params}`);
  };

  const pageTotal = entries.reduce((s, e) => s + e.amount, 0);

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
          title="Acceptance & Inspection Report"
          subtitle="Generate AIR for supplier/payee fuel invoice payments"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}><Printer size={14} /> Print</Button>
              <Button onClick={downloadExcel}><Download size={14} /> Export Excel</Button>
            </div>
          }
        />

        {/* Configuration panel */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="AIR Number" value={config.airNumber}
                onChange={(e) => setConfig((p) => ({ ...p, airNumber: e.target.value }))} />
              <Input label="Date Generated" type="date" value={config.dateGenerated}
                onChange={(e) => setConfig((p) => ({ ...p, dateGenerated: e.target.value }))} />
              <Input label="Payee / Supplier" value={config.payee} placeholder="e.g. Petron Corporation"
                onChange={(e) => setConfig((p) => ({ ...p, payee: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cash Advance</label>
                <select
                  value={config.cashAdvanceId}
                  onChange={(e) => setConfig((p) => ({ ...p, cashAdvanceId: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm w-full border-gray-300 outline-none focus:border-blue-500"
                >
                  <option value="">All Cash Advances</option>
                  {advances.map((a) => <option key={a.id} value={a.id}>{a.purpose}</option>)}
                </select>
              </div>
              <Input label="Date From" type="date" value={config.from}
                onChange={(e) => setConfig((p) => ({ ...p, from: e.target.value }))} />
              <Input label="Date To" type="date" value={config.to}
                onChange={(e) => setConfig((p) => ({ ...p, to: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* AIR Document preview */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-4xl mx-auto overflow-hidden">

          {/* ── Document Header ─────────────────────────────────────────── */}
          <div className="px-10 pt-8 pb-6 border-b-2 border-gray-800">
            {/* Republic line */}
            <p className="text-center text-[10px] font-semibold tracking-[0.45em] text-gray-500 uppercase mb-5">
              Republic of the Philippines
            </p>

            {/* Seal · Province · (mirror spacer keeps text truly centred) */}
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

            {/* Thin rule + Report title */}
            <div className="mt-6 pt-5 border-t border-gray-300 text-center">
              <p className="text-[17px] font-black tracking-[0.2em] text-gray-900 uppercase">
                Acceptance and Inspection Report
              </p>
            </div>
          </div>

          <div className="px-10 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="space-y-1">
              {[
                { label: "AIR No.:", value: config.airNumber },
                { label: "Date:", value: config.dateGenerated ? formatDateLong(config.dateGenerated) : "_______________" },
                { label: "Payee/Supplier:", value: config.payee || "_______________" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="font-semibold w-36">{label}</span>
                  <span className="border-b border-gray-400 flex-1">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex gap-2">
                <span className="font-semibold w-44">Requisitioning Office:</span>
                <span className="border-b border-gray-400 flex-1">{PROVINCE_HEADER.office}</span>
              </div>
              {config.from && config.to && (
                <div className="flex gap-2">
                  <span className="font-semibold w-44">Period Covered:</span>
                  <span className="border-b border-gray-400 flex-1">{formatDate(config.from)} – {formatDate(config.to)}</span>
                </div>
              )}
            </div>
          </div>
          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr>
                {["Qty", "Unit", "Description / Particulars", "Unit Cost (₱)", "Amount (₱)", "Invoice No."].map((h, i) => (
                  <th key={h} className={`border border-gray-800 px-3 py-2 font-bold bg-gray-100 text-center ${i === 2 ? "text-left" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="border px-3 py-6 text-center text-gray-400">Loading entries...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className="border px-3 py-6 text-center text-gray-400">No entries for selected period</td></tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                    <td className="border border-gray-400 px-3 py-1.5 text-right">{formatNumber(e.quantity)}</td>
                    <td className="border border-gray-400 px-3 py-1.5 text-center">LTR</td>
                    <td className="border border-gray-400 px-3 py-1.5">
                      {FUEL_TYPE_LABELS[e.fuelType as FuelType]}{e.hasEngineOil && " (w/ Engine Oil)"}
                      <div className="text-xs text-gray-500">{e.vehicle.assignedDriver} — {e.vehicle.plateNumber} — {formatDate(e.date)}</div>
                    </td>
                    <td className="border border-gray-400 px-3 py-1.5 text-right">₱{formatNumber(e.unitPrice)}</td>
                    <td className="border border-gray-400 px-3 py-1.5 text-right font-medium">₱{formatNumber(e.amount)}</td>
                    <td className="border border-gray-400 px-3 py-1.5 text-xs">{e.invoiceNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="border border-gray-800 px-3 py-2 text-center">PAGE TOTAL</td>
                <td className="border border-gray-800 px-3 py-2" />
                <td className="border border-gray-800 px-3 py-2 text-right">₱{formatNumber(pageTotal)}</td>
                <td className="border border-gray-800 px-3 py-2" />
              </tr>
            </tfoot>
          </table>
          <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
            <div>
              <div className="font-bold mb-4 uppercase tracking-wide text-xs">ACCEPTANCE:</div>
              <p className="text-xs text-gray-600 mb-6">Received complete and in good condition, and in accordance with specifications and requirements.</p>
              <div className="border-b-2 border-gray-800 mt-10 mb-1" />
              <div className="font-semibold text-center text-xs">Supply Officer / Authorized Representative</div>
              <div className="text-center text-xs text-gray-500 mt-1">Date: ___________________</div>
            </div>
            <div>
              <div className="font-bold mb-4 uppercase tracking-wide text-xs">INSPECTION:</div>
              <p className="text-xs text-gray-600 mb-6">Inspected, tested and/or examined in accordance with standards and found in order as to quantity and quality.</p>
              <div className="border-b-2 border-gray-800 mt-10 mb-1" />
              <div className="font-semibold text-center text-xs">R.O. / PGSO / Technical Inspector</div>
              <div className="text-center text-xs text-gray-500 mt-1">Date: ___________________</div>
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
            <div style={{ marginBottom: "14px", paddingBottom: "10px", borderBottom: "2px solid #000" }}>
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
                <div style={{ fontSize: "13pt", fontWeight: 700, letterSpacing: "0.05em" }}>
                  ACCEPTANCE AND INSPECTION REPORT
                </div>
                <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "3px" }}>Printed: {formatDateLong(new Date())}</div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px", fontSize: "9pt" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  { label: "AIR No.:", value: config.airNumber },
                  { label: "Date:", value: config.dateGenerated ? formatDateLong(config.dateGenerated) : "_______________" },
                  { label: "Payee / Supplier:", value: config.payee || "_______________" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontWeight: 700, width: "130px", flexShrink: 0 }}>{label}</span>
                    <span style={{ borderBottom: "1px solid #555", flex: 1 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <span style={{ fontWeight: 700, width: "160px", flexShrink: 0 }}>Requisitioning Office:</span>
                  <span style={{ borderBottom: "1px solid #555", flex: 1 }}>{PROVINCE_HEADER.office}</span>
                </div>
                {config.from && config.to && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontWeight: 700, width: "160px", flexShrink: 0 }}>Period Covered:</span>
                    <span style={{ borderBottom: "1px solid #555", flex: 1 }}>{formatDate(config.from)} – {formatDate(config.to)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Itemized table */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #555", marginBottom: "16px" }}>
              <thead>
                <tr>
                  <th style={{ ...pTh, width: "7%" }}>Qty</th>
                  <th style={{ ...pTh, width: "5%" }}>Unit</th>
                  <th style={{ ...pTh, textAlign: "left", width: "38%" }}>Description / Particulars</th>
                  <th style={{ ...pTh, width: "13%" }}>Unit Cost (₱)</th>
                  <th style={{ ...pTh, width: "13%" }}>Amount (₱)</th>
                  <th style={{ ...pTh, width: "24%" }}>Invoice No.</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...pTd, textAlign: "right" }}>{formatNumber(e.quantity)}</td>
                    <td style={{ ...pTd, textAlign: "center" }}>LTR</td>
                    <td style={pTd}>
                      <div style={{ fontWeight: 500 }}>{FUEL_TYPE_LABELS[e.fuelType as FuelType]}{e.hasEngineOil && " (w/ Engine Oil)"}</div>
                      <div style={{ fontSize: "7.5pt", color: "#555" }}>{e.vehicle.assignedDriver} — {e.vehicle.plateNumber} — {formatDate(e.date)}</div>
                    </td>
                    <td style={{ ...pTd, textAlign: "right" }}>₱{formatNumber(e.unitPrice)}</td>
                    <td style={{ ...pTd, textAlign: "right", fontWeight: 600 }}>₱{formatNumber(e.amount)}</td>
                    <td style={{ ...pTd, fontSize: "7.5pt" }}>{e.invoiceNumber}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: 700 }}>
                  <td colSpan={3} style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "center", fontWeight: 700, fontSize: "8.5pt" }}>PAGE TOTAL</td>
                  <td style={{ border: "1px solid #555", padding: "5px 8px" }}></td>
                  <td style={{ border: "1px solid #555", padding: "5px 8px", textAlign: "right", fontSize: "8.5pt" }}>₱{formatNumber(pageTotal)}</td>
                  <td style={{ border: "1px solid #555", padding: "5px 8px" }}></td>
                </tr>
              </tfoot>
            </table>

            {/* Signature blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", fontSize: "8.5pt" }}>
              <div>
                <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>ACCEPTANCE:</div>
                <p style={{ fontSize: "8pt", color: "#555", lineHeight: 1.6, marginBottom: "16px" }}>
                  Received complete and in good condition, and in accordance with specifications and requirements.
                </p>
                <div style={{ height: "40px" }} />
                <div style={{ borderTop: "2px solid #000", paddingTop: "5px" }}>
                  <div style={{ fontWeight: 700, textAlign: "center" }}>Supply Officer / Authorized Representative</div>
                  <div style={{ textAlign: "center", fontSize: "8pt", color: "#666", marginTop: "2px" }}>Date: ___________________</div>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>INSPECTION:</div>
                <p style={{ fontSize: "8pt", color: "#555", lineHeight: 1.6, marginBottom: "16px" }}>
                  Inspected, tested and/or examined in accordance with standards and found in order as to quantity and quality.
                </p>
                <div style={{ height: "40px" }} />
                <div style={{ borderTop: "2px solid #000", paddingTop: "5px" }}>
                  <div style={{ fontWeight: 700, textAlign: "center" }}>R.O. / PGSO / Technical Inspector</div>
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
