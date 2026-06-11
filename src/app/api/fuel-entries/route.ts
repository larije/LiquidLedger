import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driver = searchParams.get("driver");
    const plate = searchParams.get("plate");
    const fuelType = searchParams.get("fuelType");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const cashAdvanceId = searchParams.get("cashAdvanceId");

    const where: Record<string, unknown> = {};
    if (driver) where.vehicle = { assignedDriver: { contains: driver } };
    if (plate) where.vehicle = { ...(where.vehicle as object), plateNumber: { contains: plate } };
    if (fuelType) where.fuelType = fuelType;
    if (cashAdvanceId) where.cashAdvanceId = cashAdvanceId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const entries = await prisma.fuelEntry.findMany({
      where,
      include: { vehicle: true, cashAdvance: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quantity = parseFloat(body.quantity);
    const unitPrice = parseFloat(body.unitPrice);
    const amount = parseFloat((quantity * unitPrice).toFixed(2));

    const entry = await prisma.$transaction(async (tx: any) => {
      const newEntry = await tx.fuelEntry.create({
        data: {
          date: new Date(body.date),
          vehicleId: body.vehicleId,
          cashAdvanceId: body.cashAdvanceId,
          odometer: parseFloat(body.odometer),
          fuelType: body.fuelType,
          hasEngineOil: body.hasEngineOil ?? false,
          quantity,
          unitPrice,
          amount,
          invoiceNumber: body.invoiceNumber,
          remarks: body.remarks ?? null,
        },
        include: { vehicle: true, cashAdvance: true },
      });

      await tx.cashAdvance.update({
        where: { id: body.cashAdvanceId },
        data: { balance: { decrement: amount } },
      });

      return newEntry;
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
