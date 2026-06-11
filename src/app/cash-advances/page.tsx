"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import CashAdvanceForm from "@/components/cash-advances/CashAdvanceForm";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CashAdvance } from "@/types";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";

export default function CashAdvancesPage() {
  const [advances, setAdvances] = useState<(CashAdvance & { _count: { fuelEntries: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CashAdvance | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await window.fetch("/api/cash-advances");
    setAdvances(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSubmit = async (data: Partial<CashAdvance>) => {
    const url = editing ? `/api/cash-advances/${editing.id}` : "/api/cash-advances";
    const res = await window.fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast("success", editing ? "Updated" : "Cash advance created"); setModalOpen(false); fetch(); }
    else toast("error", "Failed to save");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cash advance? All linked fuel entries must be deleted first.")) return;
    const res = await window.fetch(`/api/cash-advances/${id}`, { method: "DELETE" });
    if (res.ok) { toast("success", "Deleted"); fetch(); }
    else toast("error", "Failed to delete");
  };

  const pct = (a: CashAdvance) => Math.min(100, ((a.amount - a.balance) / a.amount) * 100);

  return (
    <div>
      <Header
        title="Cash Advances"
        subtitle="Track granted fuel cash advances and their remaining balances"
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={15} /> New Cash Advance</Button>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Cash Advance" : "New Cash Advance"}>
        <CashAdvanceForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
