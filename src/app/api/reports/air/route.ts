import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAIRExcel } from "@/lib/excel";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cashAdvanceId = searchParams.get("cashAdvanceId");
  const airNumber = searchParams.get("airNumber") ?? "AIR-001";
  const payee = searchParams.get("payee") ?? "";
  const format = searchParams.get("format") ?? "json";

  const where: Record<string, unknown> = {};
  if (cashAdvanceId) where.cashAdvanceId = cashAdvanceId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to + "T23:59:59");
  }

  const entries = await prisma.fuelEntry.findMany({
    where,
    include: { vehicle: true, cashAdvance: true },
    orderBy: { date: "asc" },
  });

  if (format === "excel") {
    const buf = await generateAIRExcel(entries as any, airNumber, payee);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="air-${airNumber}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ entries, airNumber, payee });
}
