"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatNumber } from "@/lib/utils";
import { FUEL_TYPE_LABELS } from "@/types";
import type { Vehicle, FuelType } from "@/types";
import { Plus, Pencil, Trash2, Car } from "lucide-react";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await window.fetch("/api/vehicles");
    const data = await res.json();
    setVehicles(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (v: Vehicle) => { setEditing(v); setModalOpen(true); };

  const handleDelete = async (id: string, driver: string) => {
    if (!confirm(`Delete vehicle assigned to ${driver}? This will also delete all fuel entries.`)) return;
    const res = await window.fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (res.ok) { toast("success", "Vehicle deleted"); fetch(); }
    else toast("error", "Failed to delete vehicle");
  };

  const handleSubmit = async (data: Partial<Vehicle>) => {
    const url = editing ? `/api/vehicles/${editing.id}` : "/api/vehicles";
    const method = editing ? "PUT" : "POST";
    const res = await window.fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast("success", editing ? "Vehicle updated" : "Vehicle added");
      setModalOpen(false);
      fetch();
    } else {
      const err = await res.json();
      toast("error", err.error ?? "Failed to save");
    }
  };

  const fuelBadgeVariant = (ft: FuelType) =>
    ft === "DIESEL" ? "info" : ft === "PREMIUM_UNLEADED" ? "warning" : "success";

  return (
    <div>
      <Header
        title="Vehicle Master"
        subtitle="Manage assigned drivers, plates, and vehicle specifications"
        actions={<Button onClick={openAdd}><Plus size={15} /> Add Vehicle</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="py-16 text-center">
              <Car size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No vehicles yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    {["Driver", "Plate No.", "Property No.", "Description", "Fuel Type", "Tank (L)", "Acquired", ""].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.assignedDriver}</td>
                      <td className="px-4 py-3 font-mono text-blue-700">{v.plateNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{v.propertyNumber}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{v.description}</td>
                      <td className="px-4 py-3">
                        <Badge variant={fuelBadgeVariant(v.fuelType)}>{FUEL_TYPE_LABELS[v.fuelType]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatNumber(v.tankCapacity, 0)} L</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(v.acquisitionDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors cursor-pointer">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(v.id, v.assignedDriver)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        size="lg"
      >
        <VehicleForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
