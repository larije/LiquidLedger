"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import CashAdvanceForm from "@/components/cash-advances/CashAdvanceForm";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatDateLong, PROVINCE_HEADER } from "@/lib/utils";
import type { CashAdvance } from "@/types";
import { Plus, Pencil, Trash2, CreditCard, Printer } from "lucide-react";

type AdvanceWithCount = CashAdvance & { _count: { fuelEntries: number } };

const th: React.CSSProperties = {
  padding: "7px 10px",
  fontWeight: 700,
  textAlign: "left",
  fontSize: "9pt",
  borderBottom: "2px solid #1e3a5f",
  borderRight: "1px solid #d1d5db",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "9pt",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  verticalAlign: "middle",
};
const tdFoot: React.CSSProperties = {
  padding: "7px 10px",
  fontSize: "9pt",
  fontWeight: 700,
  borderTop: "2px solid #1e3a5f",
  borderRight: "1px solid #d1d5db",
};

export default function CashAdvancesPage() {
  const [advances, setAdvances] = useState<AdvanceWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CashAdvance | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await window.fetch("/api/cash-advances");
    setAdvances(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (data: Partial<CashAdvance>) => {
    const url = editing ? `/api/cash-advances/${editing.id}` : "/api/cash-advances";
    const res = await window.fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast("success", editing ? "Updated" : "Cash advance created"); setModalOpen(false); fetchData(); }
    else toast("error", "Failed to save");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cash advance? All linked fuel entries must be deleted first.")) return;
    const res = await window.fetch(`/api/cash-advances/${id}`, { method: "DELETE" });
    if (res.ok) { toast("success", "Deleted"); fetchData(); }
    else toast("error", "Failed to delete");
  };

  const pct = (a: CashAdvance) => Math.min(100, ((a.amount - a.balance) / a.amount) * 100);

  const totalGranted = advances.reduce((s, a) => s + a.amount, 0);
  const totalConsumed = advances.reduce((s, a) => s + (a.amount - a.balance), 0);
  const totalBalance = advances.reduce((s, a) => s + a.balance, 0);
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
          title="Cash Advances"
          subtitle="Track granted fuel cash advances and their remaining balances"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer size={14} /> Print
              </Button>
              <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                <Plus size={15} /> New Cash Advance
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : advances.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No cash advances yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {advances.map((a) => {
              const consumed = a.amount - a.balance;
              const p = pct(a);
              return (
                <Card key={a.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Granted {formatDate(a.dateGranted)}</div>
                        <div className="font-semibold text-gray-900 text-sm leading-tight">{a.purpose}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(a); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Granted</span>
                        <span className="font-semibold">{formatCurrency(a.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Consumed</span>
                        <span className="text-red-600 font-medium">{formatCurrency(consumed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Remaining</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(a.balance)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Utilization</span>
                        <span>{p.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p > 90 ? "bg-red-500" : p > 70 ? "bg-yellow-400" : "bg-blue-500"}`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                      {a._count.fuelEntries} fuel entries
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Print Document ─────────────────────────────────────────────── */}
      <div className="hidden print:block">
        {/*
          Outer table trick: <thead> and <tfoot> are repeated by the browser on every
          printed page, so their height acts as a top/bottom margin on ALL pages even
          when @page { margin: 0 } is set (which suppresses the browser's URL/date chrome).
        */}
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
              CASH ADVANCES SUMMARY REPORT
            </div>
            <div style={{ fontSize: "9pt", marginTop: "4px", color: "#444" }}>
              As of: <strong>{printDate}</strong>
            </div>
          </div>
        </div>

        {/* Summary band */}
        <div style={{ display: "flex", gap: "0", border: "1px solid #1e3a5f", marginBottom: "14px", borderRadius: "3px", overflow: "hidden" }}>
          {[
            { label: "Total Cash Advance Granted", value: formatCurrency(totalGranted), color: "#1e3a8a" },
            { label: "Total Amount Consumed", value: formatCurrency(totalConsumed), color: "#991b1b" },
            { label: "Total Remaining Balance", value: formatCurrency(totalBalance), color: "#14532d" },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1,
              padding: "8px 12px",
              borderLeft: i > 0 ? "1px solid #1e3a5f" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "7.5pt", color: "#555", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "11pt", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Data table */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #1e3a5f" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e3a5f", color: "#fff" }}>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", width: "32px", textAlign: "center" }}>No.</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a" }}>Purpose / Description</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", whiteSpace: "nowrap" }}>Date Granted</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", textAlign: "right" }}>Amount Granted</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", textAlign: "right" }}>Amount Consumed</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", textAlign: "right" }}>Remaining Balance</th>
              <th style={{ ...th, color: "#fff", border: "none", borderRight: "1px solid #3b5a8a", textAlign: "right" }}>Utilization</th>
              <th style={{ ...th, color: "#fff", border: "none", textAlign: "center" }}>Entries</th>
            </tr>
          </thead>
          <tbody>
            {advances.map((a, i) => {
              const consumed = a.amount - a.balance;
              const p = pct(a);
              const rowBg = i % 2 === 0 ? "#fff" : "#f5f7fa";
              return (
                <tr key={a.id} style={{ backgroundColor: rowBg }}>
                  <td style={{ ...td, textAlign: "center", color: "#666" }}>{i + 1}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{a.purpose}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{formatDate(a.dateGranted)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{formatCurrency(a.amount)}</td>
                  <td style={{ ...td, textAlign: "right", color: "#991b1b" }}>{formatCurrency(consumed)}</td>
                  <td style={{ ...td, textAlign: "right", color: "#14532d", fontWeight: 700 }}>{formatCurrency(a.balance)}</td>
                  <td style={{ ...td, textAlign: "right" }}>{p.toFixed(1)}%</td>
                  <td style={{ ...td, textAlign: "center" }}>{a._count.fuelEntries}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#eef2f7" }}>
              <td colSpan={3} style={{ ...tdFoot }}>TOTAL</td>
              <td style={{ ...tdFoot, textAlign: "right", color: "#1e3a8a" }}>{formatCurrency(totalGranted)}</td>
              <td style={{ ...tdFoot, textAlign: "right", color: "#991b1b" }}>{formatCurrency(totalConsumed)}</td>
              <td style={{ ...tdFoot, textAlign: "right", color: "#14532d" }}>{formatCurrency(totalBalance)}</td>
              <td colSpan={2} style={{ ...tdFoot }}></td>
            </tr>
          </tfoot>
        </table>

        {/* Certification note */}
        <div style={{ marginTop: "14px", fontSize: "8.5pt", color: "#555", fontStyle: "italic" }}>
          This report reflects all recorded fuel cash advances as of {printDate}. Figures are system-generated from the LiquidLedger Fuel Cash Advance Liquidation System.
        </div>

        {/* Signature block */}
        <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "32px" }}>
          {[
            { label: "Prepared by", sub: "Designated Fuel Custodian" },
            { label: "Verified by", sub: "Provincial Accountant" },
            { label: "Approved by", sub: "Provincial Treasurer" },
          ].map(({ label, sub }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ height: "40px" }} />
              <div style={{ borderTop: "1px solid #000", paddingTop: "5px" }}>
                <div style={{ fontSize: "9.5pt", fontWeight: 700 }}>&nbsp;</div>
                <div style={{ fontSize: "8.5pt", fontWeight: 700, marginTop: "2px" }}>{label}</div>
                <div style={{ fontSize: "8pt", color: "#555" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
          </div>
          </td></tr></tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Cash Advance" : "New Cash Advance"}>
        <CashAdvanceForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
