"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { CashAdvance } from "@/types";
import { toInputDate } from "@/lib/utils";

const schema = z.object({
  amount: z.string().min(1, "Amount required"),
  dateGranted: z.string().min(1, "Date required"),
  purpose: z.string().min(3, "Purpose required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initial?: Partial<CashAdvance>;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

export default function CashAdvanceForm({ initial, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initial?.amount?.toString() ?? "",
      dateGranted: initial?.dateGranted ? toInputDate(initial.dateGranted) : new Date().toISOString().split("T")[0],
      purpose: initial?.purpose ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Input
        type="number" step="0.01" label="Amount Granted (₱)" {...register("amount")}
        error={errors.amount?.message} required placeholder="70000"
      />
      <Input type="date" label="Date Granted" {...register("dateGranted")} error={errors.dateGranted?.message} required />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Purpose <span className="text-red-500">*</span></label>
        <textarea
          {...register("purpose")}
          rows={3}
          placeholder="e.g. Fuel cash advance for official use of provincial government vehicles - 1st Quarter 2024"
          className="rounded-lg border px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
        />
        {errors.purpose && <p className="text-xs text-red-600">{errors.purpose.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initial ? "Update" : "Create Cash Advance"}
        </Button>
      </div>
    </form>
  );
}
