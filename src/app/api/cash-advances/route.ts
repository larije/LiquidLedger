import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const advances = await prisma.cashAdvance.findMany({
      orderBy: { dateGranted: "desc" },
      include: { _count: { select: { fuelEntries: true } } },
    });
    return NextResponse.json(advances);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cash advances" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = parseFloat(body.amount);
    const advance = await prisma.cashAdvance.create({
      data: {
        amount,
        dateGranted: new Date(body.dateGranted),
        purpose: body.purpose,
        balance: amount,
      },
    });
    return NextResponse.json(advance, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create cash advance" }, { status: 500 });
  }
}
