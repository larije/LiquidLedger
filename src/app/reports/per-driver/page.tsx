"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatNumber, PROVINCE_HEADER } from "@/lib/utils";
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

  useEffect(() => { fetch(); }, [filters]);

  const fuelBadge = (ft: FuelType) =>
    ({ DIESEL: "info", GASOLINE: "success", PREMIUM_UNLEADED: "warning" } as const)[ft];

  return (
    <div>
      <Header
        title="Per-Driver Breakdown"
        subtitle="Fuel consumption filtered and totaled by assigned driver"
        actions={<Button variant="outline" onClick={() => window.print()}><Printer size={14} /> Print</Button>}
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

      <div className="text-center mb-4">
        <div className="font-bold text-base">{PROVINCE_HEADER.province.toUpperCase()}</div>
        <div className="text-sm">{PROVINCE_HEADER.address}</div>
        <div className="font-bold">{PROVINCE_HEADER.office.toUpperCase()}</div>
        <div className="font-bold text-lg mt-1">FUEL CONSUMPTION — PER-DRIVER BREAKDOWN</div>
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
  );
}
