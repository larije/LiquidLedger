import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const entry = await prisma.fuelEntry.findUnique({
      where: { id },
      include: { vehicle: true, cashAdvance: true },
    });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const quantity = parseFloat(body.quantity);
    const unitPrice = parseFloat(body.unitPrice);
    const newAmount = parseFloat((quantity * unitPrice).toFixed(2));

    const updated = await prisma.$transaction(async (tx: any) => {
      const old = await tx.fuelEntry.findUnique({ where: { id } });
      if (!old) throw new Error("Not found");

      const entry = await tx.fuelEntry.update({
        where: { id },
        data: {
          date: new Date(body.date),
          vehicleId: body.vehicleId,
          cashAdvanceId: body.cashAdvanceId,
          odometer: parseFloat(body.odometer),
          fuelType: body.fuelType,
          hasEngineOil: body.hasEngineOil ?? false,
          quantity,
          unitPrice,
          amount: newAmount,
          invoiceNumber: body.invoiceNumber,
          remarks: body.remarks ?? null,
        },
        include: { vehicle: true, cashAdvance: true },
      });

      // Recalculate balance: restore old amount, deduct new amount
      const diff = old.amount - newAmount;
      await tx.cashAdvance.update({
        where: { id: body.cashAdvanceId },
        data: { balance: { increment: diff } },
      });

      return entry;
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx: any) => {
      const entry = await tx.fuelEntry.findUnique({ where: { id } });
      if (!entry) throw new Error("Not found");
      await tx.fuelEntry.delete({ where: { id } });
      await tx.cashAdvance.update({
        where: { id: entry.cashAdvanceId },
        data: { balance: { increment: entry.amount } },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
