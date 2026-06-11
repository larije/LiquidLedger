import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch {
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        assignedDriver: body.assignedDriver,
        plateNumber: body.plateNumber,
        propertyNumber: body.propertyNumber,
        description: body.description,
        acquisitionDate: new Date(body.acquisitionDate),
        fuelType: body.fuelType,
        tankCapacity: parseFloat(body.tankCapacity),
      },
    });
    return NextResponse.json(vehicle);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Plate number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE vehicle error:", e);
    return NextResponse.json({ error: e?.message ?? "Failed to delete vehicle" }, { status: 500 });
  }
}
