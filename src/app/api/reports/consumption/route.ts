import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateConsumptionExcel } from "@/lib/excel";
import type { ConsumptionRow, FuelEntryWithRelations } from "@/types";

function buildConsumptionRows(entries: FuelEntryWithRelations[]): ConsumptionRow[] {
  const map = new Map<string, ConsumptionRow>();

  for (const e of entries) {
    const key = e.vehicle.plateNumber;
    if (!map.has(key)) {
      map.set(key, {
        plateNumber: e.vehicle.plateNumber,
        driverName: e.vehicle.assignedDriver,
        description: e.vehicle.description,
        dieselLiters: 0,
        gasolineLiters: 0,
        premiumLiters: 0,
        totalAmount: 0,
        invoiceNumbers: [],
        entries: [],
      });
    }
    const row = map.get(key)!;
    if (e.fuelType === "DIESEL") row.dieselLiters += e.quantity;
    else if (e.fuelType === "GASOLINE") row.gasolineLiters += e.quantity;
    else if (e.fuelType === "PREMIUM_UNLEADED") row.premiumLiters += e.quantity;
    row.totalAmount += e.amount;
    if (!row.invoiceNumbers.includes(e.invoiceNumber)) row.invoiceNumbers.push(e.invoiceNumber);
    row.entries.push(e);
  }

  return Array.from(map.values()).sort((a, b) => a.plateNumber.localeCompare(b.plateNumber));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
  const to = searchParams.get("to") ?? new Date().toISOString().split("T")[0];
  const cashAdvanceId = searchParams.get("cashAdvanceId");
  const format = searchParams.get("format") ?? "json";

  const where: Record<string, unknown> = {
    date: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
  };
  if (cashAdvanceId) where.cashAdvanceId = cashAdvanceId;

  const entries = await prisma.fuelEntry.findMany({
    where,
    include: { vehicle: true, cashAdvance: true },
    orderBy: { date: "asc" },
  });

  const rows = buildConsumptionRows(entries as unknown as FuelEntryWithRelations[]);

  if (format === "excel") {
    const buf = await generateConsumptionExcel(rows, { from, to });
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="consumption-report.xlsx"`,
      },
    });
  }

  return NextResponse.json({ rows, period: { from, to } });
}
