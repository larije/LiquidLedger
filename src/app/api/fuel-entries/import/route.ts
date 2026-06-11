import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined) return v.trim();
  }
  return "";
}

/**
 * Accepts both ISO (2026-04-22) and Excel short formats (4/22/26, 4/22/2026).
 * Uses local midnight to avoid timezone-shift issues.
 */
function parseDate(str: string): Date {
  str = str.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    // ISO: YYYY-MM-DD — append local midnight to avoid UTC offset shifting the day
    return new Date(str + "T00:00:00");
  }
  const parts = str.split("/");
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day   = parseInt(parts[1], 10);
    let year    = parseInt(parts[2], 10);
    if (year < 100) year += 2000; // "26" → 2026
    return new Date(year, month, day);
  }
  return new Date(str); // fallback for any other format
}

/** Safely parse a float — returns 0 for blank, "-", "Defective", NaN, etc. */
function safeFloat(str: string): number {
  const n = parseFloat(str);
  return isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: Record<string, string>[] = body.rows;
    const cashAdvanceId: string = (body.cashAdvanceId ?? "").trim();

    if (!cashAdvanceId) {
      return NextResponse.json({ error: "No cash advance selected" }, { status: 400 });
    }

    const advance = await prisma.cashAdvance.findUnique({ where: { id: cashAdvanceId } });
    if (!advance) {
      return NextResponse.json({ error: "Cash advance not found" }, { status: 404 });
    }

    const results = { created: 0, vehiclesCreated: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        // ── required fields ────────────────────────────────────────────────────
        const plateNumber = pick(row, "Plate Number", "plate_number");
        if (!plateNumber) {
          results.errors.push("Row skipped: Plate Number is empty");
          continue;
        }

        const dateRaw = pick(row, "Date", "date");
        if (!dateRaw) {
          results.errors.push(`Row skipped (${plateNumber}): Date is empty`);
          continue;
        }

        const quantity  = safeFloat(pick(row, "Quantity", "Qty", "quantity"));
        const unitPrice = safeFloat(
          pick(row, "Price (based on current market)", "Price", "Unit Price", "unit_price")
        );

        if (quantity <= 0) {
          results.errors.push(`Row skipped (${plateNumber} · ${dateRaw}): Quantity must be > 0`);
          continue;
        }
        if (unitPrice <= 0) {
          results.errors.push(`Row skipped (${plateNumber} · ${dateRaw}): Price must be > 0`);
          continue;
        }

        // Amount is always recalculated — the CSV "Amount" column is ignored
        const amount = parseFloat((quantity * unitPrice).toFixed(2));

        // ── fuel type — resolved early for vehicle auto-create ─────────────────
        const fuelTypeRaw  = pick(row, "Fuel Type", "fuel_type");
        const fuelTypeNorm =
          fuelTypeRaw && fuelTypeRaw !== "-"
            ? fuelTypeRaw.toUpperCase().replace(/\s+/g, "_")
            : null;

        // ── vehicle lookup / auto-create ───────────────────────────────────────
        let vehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });

        if (!vehicle) {
          const csvDriver = pick(row, "Assigned Driver", "assigned_driver");
          const csvDesc   = pick(row, "Vehicle Description", "vehicle_description");
          const csvTank   = safeFloat(
            pick(row, "Fuel Tank Capacity (in liters)", "Fuel Tank Capacity", "tank_capacity")
          );

          if (!csvDriver) {
            results.errors.push(
              `Row skipped: vehicle "${plateNumber}" not in system — ` +
              `provide an "Assigned Driver" column to auto-register it`
            );
            continue;
          }

          vehicle = await prisma.vehicle.create({
            data: {
              assignedDriver: csvDriver,
              plateNumber,
              description:    csvDesc || plateNumber,
              propertyNumber: "",
              acquisitionDate: new Date(),
              fuelType:       fuelTypeNorm ?? "GASOLINE",
              tankCapacity:   csvTank,
            },
          });
          results.vehiclesCreated++;
        }

        // ── optional fields ────────────────────────────────────────────────────
        const engineOilRaw = pick(row, "Engine Oil", "engine_oil");
        const hasEngineOil = engineOilRaw !== "" && engineOilRaw !== "-";

        const fuelType    = fuelTypeNorm ?? vehicle.fuelType;
        const odometerRaw = pick(row, "Odometer Reading", "Odometer", "odometer");
        const odometer    = safeFloat(odometerRaw); // "Defective", "-", blank → 0

        // ── persist ────────────────────────────────────────────────────────────
        await prisma.$transaction(async (tx: any) => {
          await tx.fuelEntry.create({
            data: {
              date:          parseDate(dateRaw),
              vehicleId:     vehicle!.id,
              cashAdvanceId: advance.id,
              odometer,
              fuelType,
              hasEngineOil,
              quantity,
              unitPrice,
              amount,
              invoiceNumber: pick(row, "Invoice No.", "invoice_number") || "",
              remarks:       pick(row, "Remarks", "remarks") || null,
            },
          });
          await tx.cashAdvance.update({
            where: { id: advance.id },
            data:  { balance: { decrement: amount } },
          });
        });

        results.created++;
      } catch (e: any) {
        results.errors.push(`Row error: ${e.message}`);
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
