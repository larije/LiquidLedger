"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import FuelEntryForm from "@/components/fuel-entries/FuelEntryForm";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { FuelEntryWithRelations, FuelType } from "@/types";
import { Plus, Pencil, Trash2, Search, Fuel, Filter } from "lucide-react";

export default function FuelEntriesPage() {
  const [entries, setEntries] = useState<FuelEntryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FuelEntryWithRelations | null>(null);
  const { toast }   = useToast();
  const { confirm } = useConfirm();

  const [filters, setFilters] = useState({ driver: "", plate: "", fuelType: "", from: "", to: "" });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.driver) params.set("driver", filters.driver);
    if (filters.plate) params.set("plate", filters.plate);
    if (filters.fuelType) params.set("fuelType", filters.fuelType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await window.fetch(`/api/fuel-entries?${params}`);
    setEntries(await res.json());
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    const url = editing ? `/api/fuel-entries/${editing.id}` : "/api/fuel-entries";
    const res = await window.fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast("success", editing ? "Entry updated" : "Entry recorded", "The fuel entry has been saved.");
      setModalOpen(false);
      fetchEntries();
    } else {
      const e = await res.json().catch(() => ({}));
      toast("error", "Failed to save entry", e.error ?? "Please check your input and try again.");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Fuel Entry?",
      message: "You are about to permanently delete this fuel entry. The corresponding cash advance balance will be restored.",
      details: "This action cannot be undone.",
      variant: "danger",
      confirmLabel: "Delete Entry",
    });
    if (!ok) return;
    const res = await window.fetch(`/api/fuel-entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("success", "Entry deleted", "The cash advance balance has been restored.");
      fetchEntries();
    } else {
      toast("error", "Failed to delete entry", "An unexpected error occurred. Please try again.");
    }
  };

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  const total = entries.reduce((s, e) => s + e.amount, 0);
  const totalQty = entries.reduce((s, e) => s + e.quantity, 0);

  return (
    <div>
      <Header
        title="Fuel Entries"
        subtitle="Single source of truth for all fuel purchases"
        actions={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={15} /> New Entry
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <input
              type="text" placeholder="Driver name..." value={filters.driver}
              onChange={(e) => setFilters((p) => ({ ...p, driver: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500 w-36"
            />
            <input
              type="text" placeholder="Plate number..." value={filters.plate}
              onChange={(e) => setFilters((p) => ({ ...p, plate: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500 w-32"
            />
            <select
              value={filters.fuelType}
              onChange={(e) => setFilters((p) => ({ ...p, fuelType: e.target.value }))}
              className="border rounded-lg px-3 py-1.5 text-sm border-gray-300 outline-none focus:border-blue-500"
            >
              <option value="">All Fuel Types</option>
              <option value="DIESEL">Diesel</option>
              <option value="GASOLINE">Gasoline</option>
              <option value="PREMIUM_UNLEADED">Premium Unleaded</option>
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
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({ driver: "", plate: "", fuelType: "", from: "", to: "" })}
                className="text-xs text-blue-600 hover:underline cursor-pointer">
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary row */}
      {entries.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-600">{entries.length} entries</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-600">{formatNumber(totalQty)} L total</span>
          <span className="text-gray-600">•</span>
          <span className="font-semibold text-gray-800">{formatCurrency(total)} total</span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <Fuel size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No fuel entries found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    {["Date", "Driver", "Plate", "Fuel Type", "Qty (L)", "Unit Price", "Amount", "Invoice No.", "Engine Oil", ""].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{e.vehicle.assignedDriver}</td>
                      <td className="px-4 py-3 font-mono text-blue-700">{e.vehicle.plateNumber}</td>
                      <td className="px-4 py-3"><Badge variant={fuelBadge(e.fuelType)}>{FUEL_TYPE_LABELS[e.fuelType]}</Badge></td>
                      <td className="px-4 py-3 text-right">{formatNumber(e.quantity)}</td>
                      <td className="px-4 py-3 text-right">₱{formatNumber(e.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{e.invoiceNumber}</td>
                      <td className="px-4 py-3 text-center">{e.hasEngineOil ? "✓" : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditing(e); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 font-semibold">
                    <td className="px-4 py-3" colSpan={4}>TOTAL</td>
                    <td className="px-4 py-3 text-right">{formatNumber(totalQty)}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right">{formatCurrency(total)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Fuel Entry" : "New Fuel Entry"}
        size="lg"
      >
        <FuelEntryForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit as any}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
