import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const advance = await prisma.cashAdvance.findUnique({
      where: { id },
      include: {
        fuelEntries: {
          include: { vehicle: true },
          orderBy: { date: "asc" },
        },
      },
    });
    if (!advance) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(advance);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cash advance" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const amount = parseFloat(body.amount);
    const consumed = await prisma.fuelEntry.aggregate({
      where: { cashAdvanceId: id },
      _sum: { amount: true },
    });
    const totalConsumed = consumed._sum.amount ?? 0;
    const advance = await prisma.cashAdvance.update({
      where: { id },
      data: {
        amount,
        dateGranted: new Date(body.dateGranted),
        purpose: body.purpose,
        balance: amount - totalConsumed,
      },
    });
    return NextResponse.json(advance);
  } catch {
    return NextResponse.json({ error: "Failed to update cash advance" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.cashAdvance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete cash advance" }, { status: 500 });
  }
}
