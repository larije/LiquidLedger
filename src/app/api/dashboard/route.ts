import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [advances, entries, vehicleCount] = await Promise.all([
      prisma.cashAdvance.findMany(),
      prisma.fuelEntry.findMany({
        include: { vehicle: true },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.vehicle.count(),
    ]);

    const totalGranted = advances.reduce((s: number, a: { amount: number; balance: number }) => s + a.amount, 0);
    const totalConsumed = advances.reduce((s: number, a: { amount: number; balance: number }) => s + (a.amount - a.balance), 0);
    const remainingBalance = advances.reduce((s: number, a: { amount: number; balance: number }) => s + a.balance, 0);

    return NextResponse.json({
      stats: {
        totalGranted,
        totalConsumed,
        remainingBalance,
        totalEntries: await prisma.fuelEntry.count(),
        activeCashAdvances: advances.length,
        totalVehicles: vehicleCount,
      },
      recentEntries: entries,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
