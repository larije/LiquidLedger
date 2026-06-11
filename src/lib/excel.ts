import ExcelJS from "exceljs";
import { format, parseISO, isDate } from "date-fns";
import { PROVINCE_HEADER } from "./utils";
import type { FuelEntryWithRelations, ConsumptionRow } from "@/types";
import { FUEL_TYPE_LABELS } from "@/types";

function headerStyle(): Partial<ExcelJS.Style> {
  return {
    font: { bold: true, size: 11 },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    },
  };
}

function cellBorder(): Partial<ExcelJS.Style> {
  return {
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
    alignment: { vertical: "middle", wrapText: true },
  };
}

export async function generateMasterLogExcel(
  entries: FuelEntryWithRelations[],
  cashAdvanceAmount: number,
  period?: { from: string; to: string }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Master Consumption Log");

  ws.mergeCells("A1:K1");
  ws.getCell("A1").value = PROVINCE_HEADER.province.toUpperCase();
  ws.getCell("A1").style = { font: { bold: true, size: 13 }, alignment: { horizontal: "center" } };

  ws.mergeCells("A2:K2");
  ws.getCell("A2").value = PROVINCE_HEADER.address;
  ws.getCell("A2").style = { font: { size: 11 }, alignment: { horizontal: "center" } };

  ws.mergeCells("A3:K3");
  ws.getCell("A3").value = PROVINCE_HEADER.office.toUpperCase();
  ws.getCell("A3").style = { font: { bold: true, size: 12 }, alignment: { horizontal: "center" } };

  ws.addRow([]);

  ws.mergeCells("A5:K5");
  ws.getCell("A5").value = "MASTER FUEL CONSUMPTION LOG";
  ws.getCell("A5").style = { font: { bold: true, size: 12 }, alignment: { horizontal: "center" } };

  if (period) {
    ws.mergeCells("A6:K6");
    ws.getCell("A6").value = `Period: ${format(parseISO(period.from), "MMMM d, yyyy")} to ${format(parseISO(period.to), "MMMM d, yyyy")}`;
    ws.getCell("A6").style = { alignment: { horizontal: "center" } };
    ws.addRow([]);
  } else {
    ws.addRow([]);
  }

  const headerRow = ws.addRow([
    "No.", "Date", "Driver", "Plate No.", "Odometer", "Fuel Type",
    "Qty (L)", "Unit Price (₱)", "Amount (₱)", "Invoice No.", "Remarks",
  ]);
  headerRow.eachCell((cell) => { cell.style = headerStyle(); });
  headerRow.height = 30;

  ws.columns = [
    { key: "no", width: 5 },
    { key: "date", width: 14 },
    { key: "driver", width: 20 },
    { key: "plate", width: 12 },
    { key: "odometer", width: 12 },
    { key: "fuelType", width: 16 },
    { key: "qty", width: 10 },
    { key: "price", width: 14 },
    { key: "amount", width: 14 },
    { key: "invoice", width: 18 },
    { key: "remarks", width: 20 },
  ];

  let total = 0;
  const fmtDate = (d: string | Date) => format(isDate(d) ? (d as Date) : parseISO(d as string), "MM/dd/yyyy");
  entries.forEach((e, i) => {
    total += e.amount;
    const row = ws.addRow([
      i + 1,
      fmtDate(e.date),
      e.vehicle.assignedDriver,
      e.vehicle.plateNumber,
      e.odometer,
      FUEL_TYPE_LABELS[e.fuelType],
      e.quantity,
      e.unitPrice,
      e.amount,
      e.invoiceNumber,
      e.remarks ?? "",
    ]);
    row.eachCell((cell) => { cell.style = cellBorder(); });
  });

  const totalsRow = ws.addRow(["", "", "", "", "", "TOTAL", "", "", total, "", ""]);
  totalsRow.eachCell((cell) => {
    cell.style = {
      ...cellBorder(),
      font: { bold: true },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } },
    };
  });

  ws.addRow([]);
  ws.addRow(["", "", "", "", "", "Total Cash Advance:", "", "", cashAdvanceAmount]);
  ws.addRow(["", "", "", "", "", "Total Consumed:", "", "", total]);
  ws.addRow(["", "", "", "", "", "Remaining Balance:", "", "", cashAdvanceAmount - total]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function generateAIRExcel(
  entries: FuelEntryWithRelations[],
  airNumber: string,
  payee: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("AIR");

  ws.mergeCells("A1:G1");
  ws.getCell("A1").value = PROVINCE_HEADER.province.toUpperCase();
  ws.getCell("A1").style = { font: { bold: true, size: 13 }, alignment: { horizontal: "center" } };
  ws.mergeCells("A2:G2");
  ws.getCell("A2").value = PROVINCE_HEADER.address;
  ws.getCell("A2").style = { font: { size: 11 }, alignment: { horizontal: "center" } };
  ws.mergeCells("A3:G3");
  ws.getCell("A3").value = PROVINCE_HEADER.office.toUpperCase();
  ws.getCell("A3").style = { font: { bold: true, size: 11 }, alignment: { horizontal: "center" } };

  ws.addRow([]);
  ws.mergeCells("A5:G5");
  ws.getCell("A5").value = "ACCEPTANCE AND INSPECTION REPORT";
  ws.getCell("A5").style = { font: { bold: true, size: 13 }, alignment: { horizontal: "center" } };

  ws.addRow([]);
  ws.getCell("A7").value = "AIR No.:";
  ws.getCell("B7").value = airNumber;
  ws.getCell("E7").value = "Date:";
  ws.getCell("F7").value = format(new Date(), "MMMM d, yyyy");

  ws.addRow([]);
  ws.getCell("A9").value = "Payee/Supplier:";
  ws.getCell("B9").value = payee;
  ws.getCell("E9").value = "Requisitioning Office:";
  ws.getCell("F9").value = PROVINCE_HEADER.office;

  ws.addRow([]);
  const h = ws.addRow(["Qty", "Unit", "Description", "", "Unit Cost (₱)", "Amount (₱)", "Invoice No."]);
  h.eachCell((c) => { c.style = headerStyle(); });
  ws.mergeCells(`C${h.number}:D${h.number}`);

  ws.columns = [
    { width: 10 }, { width: 8 }, { width: 20 }, { width: 16 },
    { width: 14 }, { width: 14 }, { width: 18 },
  ];

  let total = 0;
  entries.forEach((e) => {
    total += e.amount;
    const r = ws.addRow([
      e.quantity, "LTR", FUEL_TYPE_LABELS[e.fuelType], "", e.unitPrice, e.amount, e.invoiceNumber,
    ]);
    ws.mergeCells(`C${r.number}:D${r.number}`);
    r.eachCell((c) => { c.style = cellBorder(); });
  });

  const totRow = ws.addRow(["", "", "TOTAL", "", "", total, ""]);
  ws.mergeCells(`C${totRow.number}:D${totRow.number}`);
  totRow.eachCell((c) => {
    c.style = { ...cellBorder(), font: { bold: true }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } } };
  });

  ws.addRow([]);
  ws.addRow([]);
  ws.getCell(`A${ws.rowCount + 1}`).value = "ACCEPTANCE:";
  ws.addRow(["Received complete and in good condition:"]);
  ws.addRow([]);
  ws.addRow(["___________________________", "", "", "", "___________________________"]);
  ws.addRow(["Supply Officer / Authorized Rep.", "", "", "", "Date"]);
  ws.addRow([]);
  ws.getCell(`A${ws.rowCount + 1}`).value = "INSPECTION:";
  ws.addRow(["Inspected, tested and/or examined in accordance with standards:"]);
  ws.addRow([]);
  ws.addRow(["___________________________", "", "", "", "___________________________"]);
  ws.addRow(["R.O./PGSO/Technical Inspector", "", "", "", "Date"]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function generateConsumptionExcel(
  rows: ConsumptionRow[],
  period: { from: string; to: string }
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Consumption Report");

  ws.mergeCells("A1:I1");
  ws.getCell("A1").value = PROVINCE_HEADER.province.toUpperCase();
  ws.getCell("A1").style = { font: { bold: true, size: 13 }, alignment: { horizontal: "center" } };
  ws.mergeCells("A2:I2");
  ws.getCell("A2").value = PROVINCE_HEADER.address;
  ws.getCell("A2").style = { font: { size: 11 }, alignment: { horizontal: "center" } };
  ws.mergeCells("A3:I3");
  ws.getCell("A3").value = PROVINCE_HEADER.office.toUpperCase();
  ws.getCell("A3").style = { font: { bold: true, size: 11 }, alignment: { horizontal: "center" } };

  ws.addRow([]);
  ws.mergeCells("A5:I5");
  ws.getCell("A5").value = "ACTUAL CONSUMPTION REPORT";
  ws.getCell("A5").style = { font: { bold: true, size: 13 }, alignment: { horizontal: "center" } };
  ws.mergeCells("A6:I6");
  ws.getCell("A6").value = `Period: ${format(parseISO(period.from), "MMMM d, yyyy")} to ${format(parseISO(period.to), "MMMM d, yyyy")}`;
  ws.getCell("A6").style = { alignment: { horizontal: "center" } };

  ws.addRow([]);
  const hRow = ws.addRow([
    "Plate No.", "Driver", "Description", "Diesel (L)", "Gasoline (L)", "Premium (L)",
    "Total Amount (₱)", "Invoice No.", "Remarks",
  ]);
  hRow.eachCell((c) => { c.style = headerStyle(); });
  hRow.height = 30;

  ws.columns = [
    { width: 13 }, { width: 22 }, { width: 22 }, { width: 13 },
    { width: 13 }, { width: 13 }, { width: 16 }, { width: 20 }, { width: 18 },
  ];

  let totDiesel = 0, totGas = 0, totPrem = 0, totAmt = 0;
  rows.forEach((r) => {
    totDiesel += r.dieselLiters;
    totGas += r.gasolineLiters;
    totPrem += r.premiumLiters;
    totAmt += r.totalAmount;
    const row = ws.addRow([
      r.plateNumber, r.driverName, r.description,
      r.dieselLiters || "", r.gasolineLiters || "", r.premiumLiters || "",
      r.totalAmount, r.invoiceNumbers.join(", "), "",
    ]);
    row.eachCell((c) => { c.style = cellBorder(); });
  });

  const totRow = ws.addRow(["TOTAL", "", "", totDiesel, totGas, totPrem, totAmt, "", ""]);
  totRow.eachCell((c) => {
    c.style = { ...cellBorder(), font: { bold: true }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } } };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
