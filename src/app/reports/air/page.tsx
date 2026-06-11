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

  const fetch = useCallback(async () => {
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

  useEffect(() => { fetch(); }, [fetch]);

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

  // Group by fuel type for AIR summary
  const grouped = entries.reduce<Record<string, { qty: number; unitPrice: number; amount: number; invoices: string[] }>>((acc, e) => {
    const key = `${e.fuelType}::${e.unitPrice}`;
    if (!acc[key]) acc[key] = { qty: 0, unitPrice: e.unitPrice, amount: 0, invoices: [] };
    acc[key].qty += e.quantity;
    acc[key].amount += e.amount;
    if (!acc[key].invoices.includes(e.invoiceNumber)) acc[key].invoices.push(e.invoiceNumber);
    return acc;
  }, {});
  const summaryRows = Object.entries(grouped).map(([key, v]) => ({
    fuelType: key.split("::")[0] as FuelType,
    ...v,
  }));
  const pageTotal = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <Header
        title="Acceptance & Inspection Report"
        subtitle="Generate AIR for supplier/payee fuel invoice payments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer size={14} /> Print</Button>
            <Button onClick={downloadExcel}><Download size={14} /> Export Excel</Button>
          </div>
        }
      />

      {/* Configuration panel */}
      <Card className="mb-6 print:hidden">
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

      {/* AIR Document */}
      <div id="air-document" className="bg-white border rounded-xl p-8 print:p-0 print:border-0 max-w-4xl mx-auto print:max-w-none">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 pb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Republic of the Philippines</div>
          <div className="font-bold text-lg">{PROVINCE_HEADER.province.toUpperCase()}</div>
          <div className="text-sm">{PROVINCE_HEADER.address}</div>
          <div className="font-bold text-base mt-1">{PROVINCE_HEADER.office.toUpperCase()}</div>
          <div className="font-bold text-xl mt-3 tracking-wide">ACCEPTANCE AND INSPECTION REPORT</div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-semibold w-36">AIR No.:</span>
              <span className="border-b border-gray-400 flex-1">{config.airNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-36">Date:</span>
              <span className="border-b border-gray-400 flex-1">{config.dateGenerated ? formatDateLong(config.dateGenerated) : "_______________"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-36">Payee/Supplier:</span>
              <span className="border-b border-gray-400 flex-1">{config.payee || "_______________"}</span>
            </div>
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

        {/* Itemized table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr>
              {["Qty", "Unit", "Description / Particulars", "Unit Cost (₱)", "Amount (₱)", "Invoice No."].map((h, i) => (
                <th key={h}
                  className={`border border-gray-800 px-3 py-2 font-bold bg-gray-100 text-center ${i === 2 ? "text-left" : ""}`}>
                  {h}
                </th>
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
                    {FUEL_TYPE_LABELS[e.fuelType as FuelType]}
                    {e.hasEngineOil && " (w/ Engine Oil)"}
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
              <td colSpan={3} className="border border-gray-800 px-3 py-2 text-center font-bold">PAGE TOTAL</td>
              <td className="border border-gray-800 px-3 py-2" />
              <td className="border border-gray-800 px-3 py-2 text-right">₱{formatNumber(pageTotal)}</td>
              <td className="border border-gray-800 px-3 py-2" />
            </tr>
          </tfoot>
        </table>

        {/* Signature blocks */}
        <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
          <div>
            <div className="font-bold mb-4 uppercase tracking-wide text-xs">ACCEPTANCE:</div>
            <p className="text-xs text-gray-600 mb-6">
              Received complete and in good condition, and in accordance with specifications and requirements.
            </p>
            <div className="border-b-2 border-gray-800 mt-10 mb-1" />
            <div className="font-semibold text-center text-xs">Supply Officer / Authorized Representative</div>
            <div className="text-center text-xs text-gray-500 mt-1">Date: ___________________</div>
          </div>
          <div>
            <div className="font-bold mb-4 uppercase tracking-wide text-xs">INSPECTION:</div>
            <p className="text-xs text-gray-600 mb-6">
              Inspected, tested and/or examined in accordance with standards and found in order as to quantity and quality.
            </p>
            <div className="border-b-2 border-gray-800 mt-10 mb-1" />
            <div className="font-semibold text-center text-xs">R.O. / PGSO / Technical Inspector</div>
            <div className="text-center text-xs text-gray-500 mt-1">Date: ___________________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
