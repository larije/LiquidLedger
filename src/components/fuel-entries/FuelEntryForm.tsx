"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { formatCurrency, formatNumber, toInputDate } from "@/lib/utils";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/types";
import type { Vehicle, CashAdvance, FuelEntry } from "@/types";
import { AlertTriangle, Info } from "lucide-react";

const schema = z.object({
  date: z.string().min(1, "Date required"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  cashAdvanceId: z.string().min(1, "Select a cash advance"),
  odometer: z.string().min(1, "Required"),
  fuelType: z.enum(["GASOLINE", "DIESEL", "PREMIUM_UNLEADED"]),
  hasEngineOil: z.boolean(),
  quantity: z.string().min(1, "Required"),
  unitPrice: z.string().min(1, "Required"),
  invoiceNumber: z.string().min(1, "Invoice/charge number required"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<FuelEntry>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function FuelEntryForm({ initial, onSubmit, onCancel }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<CashAdvance | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: initial?.date ? toInputDate(initial.date) : new Date().toISOString().split("T")[0],
      vehicleId: initial?.vehicleId ?? "",
      cashAdvanceId: initial?.cashAdvanceId ?? "",
      odometer: initial?.odometer?.toString() ?? "0",
      fuelType: (initial?.fuelType as FormData["fuelType"]) ?? "DIESEL",
      hasEngineOil: initial?.hasEngineOil ?? false,
      quantity: initial?.quantity?.toString() ?? "",
      unitPrice: initial?.unitPrice?.toString() ?? "",
      invoiceNumber: initial?.invoiceNumber ?? "",
      remarks: initial?.remarks ?? "",
    },
  });

  const watchedVehicleId = watch("vehicleId");
  const watchedCashAdvanceId = watch("cashAdvanceId");
  const quantityStr = watch("quantity");
  const unitPriceStr = watch("unitPrice");
  const quantity = parseFloat(quantityStr) || 0;
  const unitPrice = parseFloat(unitPriceStr) || 0;
  const computedAmount = quantity > 0 && unitPrice > 0 ? +(quantity * unitPrice).toFixed(2) : 0;

  useEffect(() => {
    Promise.all([
      window.fetch("/api/vehicles").then((r) => r.json()),
      window.fetch("/api/cash-advances").then((r) => r.json()),
    ]).then(([v, a]) => { setVehicles(v); setAdvances(a); });
  }, []);

  useEffect(() => {
    const v = vehicles.find((x) => x.id === watchedVehicleId) ?? null;
    setSelectedVehicle(v);
    if (v) setValue("fuelType", v.fuelType as FormData["fuelType"]);
  }, [watchedVehicleId, vehicles, setValue]);

  useEffect(() => {
    setSelectedAdvance(advances.find((x) => x.id === watchedCashAdvanceId) ?? null);
  }, [watchedCashAdvanceId, advances]);

  const tankExceeded = selectedVehicle && quantity > selectedVehicle.tankCapacity;
  const insufficientBalance = selectedAdvance && computedAmount > selectedAdvance.balance;

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Date" {...register("date")} error={errors.date?.message} required />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Vehicle / Driver <span className="text-red-500">*</span></label>
          <select
            {...register("vehicleId")}
            className="rounded-lg border px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">— Select driver / vehicle —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.assignedDriver} — {v.plateNumber}
              </option>
            ))}
          </select>
          {errors.vehicleId && <p className="text-xs text-red-600">{errors.vehicleId.message}</p>}
        </div>
      </div>

      {selectedVehicle && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm grid grid-cols-3 gap-3">
          <div><span className="text-gray-500 text-xs block">Plate No.</span><span className="font-mono font-semibold text-blue-800">{selectedVehicle.plateNumber}</span></div>
          <div><span className="text-gray-500 text-xs block">Vehicle</span><span className="font-medium text-gray-800">{selectedVehicle.description}</span></div>
          <div><span className="text-gray-500 text-xs block">Tank Capacity</span><span className="font-medium text-gray-800">{formatNumber(selectedVehicle.tankCapacity, 0)} L</span></div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Cash Advance <span className="text-red-500">*</span></label>
        <select
          {...register("cashAdvanceId")}
          className="rounded-lg border px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
        >
          <option value="">— Select cash advance —</option>
          {advances.map((a) => (
            <option key={a.id} value={a.id}>
              {a.purpose} — Balance: {formatCurrency(a.balance)}
            </option>
          ))}
        </select>
        {errors.cashAdvanceId && <p className="text-xs text-red-600">{errors.cashAdvanceId.message}</p>}
      </div>

      {selectedAdvance && (
        <div className="bg-green-50 rounded-lg p-3 text-sm flex gap-4">
          <div><span className="text-gray-500 text-xs block">Total Granted</span><span className="font-semibold">{formatCurrency(selectedAdvance.amount)}</span></div>
          <div><span className="text-gray-500 text-xs block">Consumed</span><span className="font-semibold text-red-600">{formatCurrency(selectedAdvance.amount - selectedAdvance.balance)}</span></div>
          <div><span className="text-gray-500 text-xs block">Remaining</span><span className="font-semibold text-green-700">{formatCurrency(selectedAdvance.balance)}</span></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input type="number" label="Odometer Reading (km)" {...register("odometer")} error={errors.odometer?.message} placeholder="0" />

        <Select
          label="Fuel Type"
          {...register("fuelType")}
          error={errors.fuelType?.message}
          required
          options={FUEL_TYPES.map((t) => ({ value: t, label: FUEL_TYPE_LABELS[t] }))}
        />

        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="hasEngineOil"
              render={({ field }) => (
                <input
                  type="checkbox" id="hasEngineOil"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
              )}
            />
            <label htmlFor="hasEngineOil" className="text-sm text-gray-700">Includes Engine Oil</label>
          </div>
        </div>

        <div>
          <Input
            type="number" step="0.01" label="Quantity (liters)" {...register("quantity")}
            error={errors.quantity?.message} required
            hint={selectedVehicle ? `Max tank: ${formatNumber(selectedVehicle.tankCapacity, 0)} L` : undefined}
          />
          {tankExceeded && (
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle size={12} />
              Exceeds tank capacity ({formatNumber(selectedVehicle!.tankCapacity, 0)} L). Verify before saving.
            </div>
          )}
        </div>

        <div>
          <Input
            type="number" step="0.01" label="Unit Price (₱ per liter)" {...register("unitPrice")}
            error={errors.unitPrice?.message} required placeholder="60.00"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center gap-1"><Info size={13} /> Auto-calculated amount</span>
        <span className="text-lg font-bold text-gray-900">{formatCurrency(computedAmount)}</span>
      </div>

      {insufficientBalance && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertTriangle size={14} />
          Amount exceeds remaining balance ({formatCurrency(selectedAdvance!.balance)}). Refill the cash advance first.
        </div>
      )}

      <Input label="Charge/Sales Invoice Number" {...register("invoiceNumber")} error={errors.invoiceNumber?.message} required placeholder="e.g. CS-2024-00123" />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Remarks (optional)</label>
        <textarea
          {...register("remarks")}
          rows={2}
          className="rounded-lg border px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !!insufficientBalance}>
          {isSubmitting ? "Saving..." : initial ? "Update Entry" : "Record Fuel Entry"}
        </Button>
      </div>
    </form>
  );
}
