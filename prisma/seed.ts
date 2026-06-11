import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plateNumber: "DAV-1234" },
      update: {},
      create: {
        assignedDriver: "Juan dela Cruz",
        plateNumber: "DAV-1234",
        propertyNumber: "PR-2023-001",
        description: "Toyota Hilux Pick-up Truck 4x4",
        acquisitionDate: new Date("2023-01-15"),
        fuelType: "DIESEL",
        tankCapacity: 80,
      },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: "DAV-5678" },
      update: {},
      create: {
        assignedDriver: "Maria Santos",
        plateNumber: "DAV-5678",
        propertyNumber: "PR-2023-002",
        description: "Mitsubishi L300 FB Van",
        acquisitionDate: new Date("2022-06-20"),
        fuelType: "DIESEL",
        tankCapacity: 60,
      },
    }),
    prisma.vehicle.upsert({
      where: { plateNumber: "DAV-9012" },
      update: {},
      create: {
        assignedDriver: "Pedro Reyes",
        plateNumber: "DAV-9012",
        propertyNumber: "PR-2022-015",
        description: "Toyota Innova MPV",
        acquisitionDate: new Date("2022-03-10"),
        fuelType: "GASOLINE",
        tankCapacity: 55,
      },
    }),
  ]);

  console.log(`Seeded ${vehicles.length} vehicles`);

  // Seed cash advance
  const advance = await prisma.cashAdvance.upsert({
    where: { id: "demo-advance-001" },
    update: {},
    create: {
      id: "demo-advance-001",
      amount: 70000,
      dateGranted: new Date("2024-01-02"),
      purpose: "Fuel Cash Advance for Official Use of Provincial Government Vehicles — 1st Quarter 2024",
      balance: 70000,
    },
  });

  console.log(`Seeded cash advance: ${advance.purpose}`);

  // Seed fuel entries
  const entries = [
    { date: "2024-01-05", vehicleId: vehicles[0].id, odometer: 45230, qty: 60, price: 72.50, invoice: "CS-2024-00101" },
    { date: "2024-01-08", vehicleId: vehicles[1].id, odometer: 23100, qty: 45, price: 72.50, invoice: "CS-2024-00102" },
    { date: "2024-01-12", vehicleId: vehicles[2].id, odometer: 18500, qty: 40, price: 74.00, invoice: "CS-2024-00103", fuelType: "GASOLINE" },
    { date: "2024-01-15", vehicleId: vehicles[0].id, odometer: 45890, qty: 55, price: 72.50, invoice: "CS-2024-00104" },
    { date: "2024-01-20", vehicleId: vehicles[1].id, odometer: 23600, qty: 50, price: 73.00, invoice: "CS-2024-00105" },
    { date: "2024-01-25", vehicleId: vehicles[2].id, odometer: 19100, qty: 42, price: 74.00, invoice: "CS-2024-00106", fuelType: "GASOLINE" },
  ];

  for (const e of entries) {
    const fuelType = (e as any).fuelType ?? "DIESEL";
    const amount = +(e.qty * e.price).toFixed(2);
    await prisma.fuelEntry.create({
      data: {
        date: new Date(e.date),
        vehicleId: e.vehicleId,
        cashAdvanceId: advance.id,
        odometer: e.odometer,
        fuelType,
        hasEngineOil: false,
        quantity: e.qty,
        unitPrice: e.price,
        amount,
        invoiceNumber: e.invoice,
      },
    });
    await prisma.cashAdvance.update({
      where: { id: advance.id },
      data: { balance: { decrement: amount } },
    });
  }

  console.log(`Seeded ${entries.length} fuel entries`);

  const finalAdvance = await prisma.cashAdvance.findUnique({ where: { id: advance.id } });
  console.log(`Cash advance balance: ₱${finalAdvance!.balance.toFixed(2)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
