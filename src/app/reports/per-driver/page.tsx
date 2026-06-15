"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatDateLong, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { FuelEntryWithRelations, FuelType } from "@/types";
import { Printer } from "lucide-react";

interface DriverGroup {
  driver: string;
  plateNumber: string;
  description: string;
  entries: FuelEntryWithRelations[];
  totalAmount: number;
  totalQty: number;
}

const pTh: React.CSSProperties = {
  padding: "5px 8px",
  fontWeight: 700,
  fontSize: "8.5pt",
  textAlign: "left",
  borderBottom: "1px solid #1e3a5f",
  borderRight: "1px solid #d1d5db",
  backgroundColor: "#e8edf5",
  color: "#1e3a5f",
};
const pTd: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: "8.5pt",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  verticalAlign: "middle",
};

export default function PerDriverPage() {
  const [groups, setGroups] = useState<DriverGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const fetch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await window.fetch(`/api/fuel-entries?${params}`);
    const entries: FuelEntryWithRelations[] = await res.json();

    const map = new Map<string, DriverGroup>();
    for (const e of entries) {
      const key = e.vehicle.assignedDriver;
      if (!map.has(key)) {
        map.set(key, {
          driver: e.vehicle.assignedDriver,
          plateNumber: e.vehicle.plateNumber,
          description: e.vehicle.description,
          entries: [], totalAmount: 0, totalQty: 0,
        });
      }
      const g = map.get(key)!;
      g.entries.push(e);
      g.totalAmount += e.amount;
      g.totalQty += e.quantity;
    }
    setGroups(Array.from(map.values()).sort((a, b) => a.driver.localeCompare(b.driver)));
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, [filters]);

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  const grandTotal = groups.reduce((s, g) => s + g.totalAmount, 0);
  const grandQty = groups.reduce((s, g) => s + g.totalQty, 0);
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
          title="Per-Driver Breakdown"
          subtitle="Fuel consumption filtered and totaled by assigned driver"
          actions={<Button variant="outline" onClick={handlePrint}><Printer size={14} /> Print</Button>}
        />

        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <input type="date" value={filters.from}
                onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none"
              />
              <span className="text-gray-400">to</span>
              <input type="date" value={filters.to}
                onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Province header card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-10 pt-7 pb-6 mb-6">
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
          <div className="mt-5 pt-4 border-t border-gray-300 text-center">
            <p className="text-[17px] font-black tracking-[0.2em] text-gray-900 uppercase">
              Fuel Consumption — Per-Driver Breakdown
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <Card key={g.driver}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{g.driver}</CardTitle>
                      <div className="text-sm text-gray-500 mt-0.5 font-mono">{g.plateNumber} · {g.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-xl font-bold text-blue-700">{formatCurrency(g.totalAmount)}</div>
                      <div className="text-xs text-gray-400">{formatNumber(g.totalQty)} L</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y bg-gray-50 text-xs">
                        {["Date", "Fuel Type", "Odometer", "Qty (L)", "Unit Price", "Amount", "Invoice No."].map((h) => (
                          <th key={h} className="px-4 py-2 font-semibold text-gray-600 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {g.entries.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2">{formatDate(e.date)}</td>
                          <td className="px-4 py-2"><Badge variant={fuelBadge(e.fuelType as FuelType)} className="text-xs">{FUEL_TYPE_LABELS[e.fuelType as FuelType]}</Badge></td>
                          <td className="px-4 py-2 text-right">{e.odometer.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{formatNumber(e.quantity)}</td>
                          <td className="px-4 py-2 text-right">₱{formatNumber(e.unitPrice)}</td>
                          <td className="px-4 py-2 text-right font-medium">₱{formatNumber(e.amount)}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{e.invoiceNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 font-semibold border-t-2">
                        <td className="px-4 py-2" colSpan={3}>SUBTOTAL — {g.driver}</td>
                        <td className="px-4 py-2 text-right">{formatNumber(g.totalQty)} L</td>
                        <td />
                        <td className="px-4 py-2 text-right text-blue-700">{formatCurrency(g.totalAmount)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
                  FUEL CONSUMPTION — PER-DRIVER BREAKDOWN
                </div>
                <div style={{ fontSize: "9pt", marginTop: "3px", color: "#444" }}>
                  {filters.from && filters.to
                    ? <>{`Period: `}<strong>{formatDateLong(filters.from)}</strong>{` to `}<strong>{formatDateLong(filters.to)}</strong></>
                    : "All Periods"}
                </div>
                <div style={{ fontSize: "8.5pt", color: "#666", marginTop: "2px" }}>Printed: {printDate}</div>
              </div>
            </div>

            {/* Summary band */}
            <div style={{ display: "flex", border: "1px solid #1e3a5f", marginBottom: "16px", borderRadius: "3px", overflow: "hidden" }}>
              {[
                { label: "No. of Drivers", value: String(groups.length), color: "#374151" },
                { label: "Total Fuel Quantity", value: `${formatNumber(grandQty)} L`, color: "#374151" },
                { label: "Total Amount", value: formatCurrency(grandTotal), color: "#1e3a8a" },
              ].map((s, i) => (
                <div key={s.label} style={{ flex: 1, padding: "7px 10px", borderLeft: i > 0 ? "1px solid #1e3a5f" : "none", textAlign: "center" }}>
                  <div style={{ fontSize: "7pt", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{s.label}</div>
                  <div style={{ fontSize: "11pt", fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Driver sections */}
            {groups.map((g) => (
              <div key={g.driver} style={{ marginBottom: "18px", pageBreakInside: "avoid" }}>
                <div style={{ backgroundColor: "#1e3a5f", color: "#fff", padding: "6px 10px", fontSize: "9pt", fontWeight: 700 }}>
                  {g.driver} &mdash; {g.plateNumber} &mdash; {g.description}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #c7d2e8" }}>
                  <thead>
                    <tr>
                      <th style={pTh}>Date</th>
                      <th style={pTh}>Fuel Type</th>
                      <th style={{ ...pTh, textAlign: "right" }}>Odometer</th>
                      <th style={{ ...pTh, textAlign: "right" }}>Qty (L)</th>
                      <th style={{ ...pTh, textAlign: "right" }}>Unit Price (₱)</th>
                      <th style={{ ...pTh, textAlign: "right" }}>Amount (₱)</th>
                      <th style={{ ...pTh, borderRight: "none" }}>Invoice No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e, i) => (
                      <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8f9fb" }}>
                        <td style={{ ...pTd, whiteSpace: "nowrap" }}>{formatDate(e.date)}</td>
                        <td style={pTd}>{FUEL_TYPE_LABELS[e.fuelType as FuelType]}</td>
                        <td style={{ ...pTd, textAlign: "right" }}>{e.odometer.toLocaleString()}</td>
                        <td style={{ ...pTd, textAlign: "right" }}>{formatNumber(e.quantity)}</td>
                        <td style={{ ...pTd, textAlign: "right" }}>₱{formatNumber(e.unitPrice)}</td>
                        <td style={{ ...pTd, textAlign: "right", fontWeight: 600 }}>₱{formatNumber(e.amount)}</td>
                        <td style={{ ...pTd, borderRight: "none", color: "#555" }}>{e.invoiceNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#dbe5f4" }}>
                      <td colSpan={3} style={{ ...pTd, borderTop: "1px solid #1e3a5f", fontWeight: 700, color: "#1e3a5f" }}>
                        SUBTOTAL — {g.driver}
                      </td>
                      <td style={{ ...pTd, textAlign: "right", borderTop: "1px solid #1e3a5f", fontWeight: 700 }}>{formatNumber(g.totalQty)} L</td>
                      <td style={{ ...pTd, borderTop: "1px solid #1e3a5f" }}></td>
                      <td style={{ ...pTd, textAlign: "right", borderTop: "1px solid #1e3a5f", fontWeight: 700, color: "#1e3a8a" }}>{formatCurrency(g.totalAmount)}</td>
                      <td style={{ ...pTd, borderRight: "none", borderTop: "1px solid #1e3a5f" }}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}

            {/* Grand total */}
            <div style={{ border: "2px solid #1e3a5f", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#eef2f7", marginTop: "4px" }}>
              <div style={{ fontSize: "10pt", fontWeight: 700, color: "#1e3a5f" }}>GRAND TOTAL</div>
              <div style={{ display: "flex", gap: "40px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "7.5pt", color: "#555" }}>TOTAL QUANTITY</div>
                  <div style={{ fontSize: "10pt", fontWeight: 700 }}>{formatNumber(grandQty)} L</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "7.5pt", color: "#555" }}>TOTAL AMOUNT</div>
                  <div style={{ fontSize: "11pt", fontWeight: 700, color: "#1e3a8a" }}>{formatCurrency(grandTotal)}</div>
                </div>
              </div>
            </div>

            {/* Certification note */}
            <div style={{ marginTop: "10px", fontSize: "7.5pt", color: "#666", fontStyle: "italic" }}>
              This report is system-generated from the LiquidLedger Fuel Cash Advance Liquidation System, Provincial Treasurer&apos;s Office — Province of Davao del Norte.
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
