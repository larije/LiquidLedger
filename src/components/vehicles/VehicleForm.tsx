"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/types";
import type { Vehicle } from "@/types";
import { toInputDate } from "@/lib/utils";

const schema = z.object({
  assignedDriver: z.string().min(2, "Driver name required"),
  plateNumber: z.string().min(4, "Plate number required"),
  propertyNumber: z.string().min(1, "Property number required"),
  description: z.string().min(3, "Description required"),
  acquisitionDate: z.string().min(1, "Date required"),
  fuelType: z.enum(["GASOLINE", "DIESEL", "PREMIUM_UNLEADED"]),
  tankCapacity: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<Vehicle>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

export default function VehicleForm({ initial, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assignedDriver: initial?.assignedDriver ?? "",
      plateNumber: initial?.plateNumber ?? "",
      propertyNumber: initial?.propertyNumber ?? "",
      description: initial?.description ?? "",
      acquisitionDate: initial?.acquisitionDate ? toInputDate(initial.acquisitionDate) : "",
      fuelType: (initial?.fuelType as FormData["fuelType"]) ?? "DIESEL",
      tankCapacity: initial?.tankCapacity?.toString() ?? "60",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Assigned Driver" {...register("assignedDriver")} error={errors.assignedDriver?.message} required placeholder="Full name" />
        </div>
        <Input label="Plate Number" {...register("plateNumber")} error={errors.plateNumber?.message} required placeholder="e.g. DAV-1234" />
        <Input label="Property Number" {...register("propertyNumber")} error={errors.propertyNumber?.message} required placeholder="e.g. PR-2023-001" />
        <div className="col-span-2">
          <Input label="Vehicle Description" {...register("description")} error={errors.description?.message} required placeholder="e.g. Toyota Hilux, Pick-up Truck" />
        </div>
        <Input type="date" label="Date of Acquisition" {...register("acquisitionDate")} error={errors.acquisitionDate?.message} required />
        <Select
          label="Fuel Type"
          {...register("fuelType")}
          error={errors.fuelType?.message}
          required
          options={FUEL_TYPES.map((t) => ({ value: t, label: FUEL_TYPE_LABELS[t] }))}
        />
        <Input
          type="number" step="0.1" label="Tank Capacity (liters)" {...register("tankCapacity")}
          error={errors.tankCapacity?.message} required placeholder="60"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initial ? "Update Vehicle" : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );
}
