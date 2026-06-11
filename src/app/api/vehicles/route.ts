import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { assignedDriver: "asc" },
    });
    return NextResponse.json(vehicles);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vehicle = await prisma.vehicle.create({
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
    return NextResponse.json(vehicle, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Plate number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}
