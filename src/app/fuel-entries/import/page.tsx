"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Wallet,
  PlusCircle,
} from "lucide-react";
import Papa from "papaparse";
import { CashAdvance, Vehicle } from "@/types";

interface RawRow {
  [key: string]: string;
}

type VehicleStatus = "existing" | "new" | "mismatch";

interface EnrichedRow {
  date: string;
  assignedDriver: string;      // from system (existing) or CSV (new)
  vehicleDescription: string;  // from system (existing) or CSV (new)
  plateNumber: string;
  odometer: string;
  fuelType: string;
  engineOil: string;
  tankCapacity: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  invoiceNo: string;
  vehicleStatus: VehicleStatus;
  csvDriver?: string;           // stored when status=mismatch, for the tooltip
  raw: RawRow;
}

interface ImportResult {
  created: number;
  vehiclesCreated: number;
  errors: string[];
}

const TABLE_COLS = [
  "Date",
  "Assigned Driver",
  "Vehicle Description",
  "Plate Number",
  "Odometer Reading",
  "Fuel Type",
  "Engine Oil",
  "Fuel Tank Capacity (in liters)",
  "Quantity",
  "Price (based on current market)",
  "Amount",
] as const;

type TableCol = (typeof TABLE_COLS)[number];

const RIGHT_ALIGN = new Set<TableCol>([
  "Odometer Reading",
  "Fuel Tank Capacity (in liters)",
  "Quantity",
  "Price (based on current market)",
  "Amount",
]);

const fmt = (n: number) =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function r(raw: RawRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined) return v;
  }
  return "";
}

function buildVehicleMap(vehicles: Vehicle[]): Record<string, Vehicle> {
  const map: Record<string, Vehicle> = {};
  for (const v of vehicles) map[v.plateNumber] = v;
  return map;
}

function parseEnrichedRows(rows: RawRow[], vehicleMap: Record<string, Vehicle>): EnrichedRow[] {
  return rows.map((row) => {
    const plate = r(row, "Plate Number", "plate_number").trim();
    const vehicle = vehicleMap[plate];

    const qty = parseFloat(r(row, "Quantity", "Qty", "quantity")) || 0;
    const price =
      parseFloat(r(row, "Price (based on current market)", "Price", "Unit Price", "unit_price")) || 0;
    const engineOilRaw = r(row, "Engine Oil", "engine_oil").trim();
    const fuelTypeRaw = r(row, "Fuel Type", "fuel_type").trim();
    const odometerRaw = r(row, "Odometer Reading", "Odometer", "odometer").trim();
    const csvDriver = r(row, "Assigned Driver", "assigned_driver").trim();
    const csvDesc = r(row, "Vehicle Description", "vehicle_description").trim();
    const csvTank = r(row, "Fuel Tank Capacity (in liters)", "Fuel Tank Capacity", "tank_capacity").trim();

    let vehicleStatus: VehicleStatus;
    let assignedDriver: string;
    let vehicleDescription: string;
    let tankCapacity: string;

    if (vehicle) {
      const driverMismatch = csvDriver && csvDriver !== vehicle.assignedDriver;
      vehicleStatus = driverMismatch ? "mismatch" : "existing";
      assignedDriver = vehicle.assignedDriver;
      vehicleDescription = vehicle.description;
      tankCapacity = String(vehicle.tankCapacity);
    } else {
      vehicleStatus = "new";
      assignedDriver = csvDriver || "—";
      vehicleDescription = csvDesc || "—";
      tankCapacity = csvTank || "—";
    }

    return {
      date: r(row, "Date", "date") || "-",
      assignedDriver,
      vehicleDescription,
      plateNumber: plate,
      odometer: odometerRaw || "-",
      fuelType: fuelTypeRaw || "-",
      engineOil: engineOilRaw || "-",
      tankCapacity,
      quantity: qty,
      unitPrice: price,
      amount: parseFloat((qty * price).toFixed(2)),
      invoiceNo: r(row, "Invoice No.", "invoice_number").trim(),
      vehicleStatus,
      csvDriver: vehicleStatus === "mismatch" ? csvDriver : undefined,
      raw: row,
    };
  });
}

function getCellText(row: EnrichedRow, col: TableCol): string {
  switch (col) {
    case "Date": return row.date;
    case "Assigned Driver": return row.assignedDriver;
    case "Vehicle Description": return row.vehicleDescription;
    case "Plate Number": return row.plateNumber;
    case "Odometer Reading": return row.odometer;
    case "Fuel Type": return row.fuelType;
    case "Engine Oil": return row.engineOil;
    case "Fuel Tank Capacity (in liters)": return row.tankCapacity;
    case "Quantity": return fmt(row.quantity);
    case "Price (based on current market)": return fmt(row.unitPrice);
    case "Amount": return fmt(row.amount);
  }
}

const STATUS_BADGE: Record<VehicleStatus, React.ReactNode> = {
  existing: null,
  new: (
    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase leading-none">
      <PlusCircle size={9} /> NEW
    </span>
  ),
  mismatch: (
    <span className="ml-1.5 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase leading-none">
      DIFF
    </span>
  ),
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [enrichedRows, setEnrichedRows] = useState<EnrichedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/cash-advances").then((r) => r.json()).then(setCashAdvances).catch(() => {});
    fetch("/api/vehicles").then((r) => r.json()).then(setVehicles).catch(() => {});
  }, []);

  // Re-enrich whenever rawRows or vehicles list changes (handles load-order race condition)
  useEffect(() => {
    if (rawRows.length === 0) return;
    setEnrichedRows(parseEnrichedRows(rawRows, buildVehicleMap(vehicles)));
  }, [rawRows, vehicles]);

  const selectedAdvance = cashAdvances.find((a) => a.id === selectedAdvanceId);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    Papa.parse<RawRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setRawRows(res.data),
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  const totalAmount = enrichedRows.reduce((s, r) => s + r.amount, 0);
  const balanceAfterImport = selectedAdvance ? selectedAdvance.balance - totalAmount : null;
  const willExceed = balanceAfterImport !== null && balanceAfterImport < 0;
  const newVehicleRows = enrichedRows.filter((r) => r.vehicleStatus === "new");
  const mismatchRows = enrichedRows.filter((r) => r.vehicleStatus === "mismatch");
  const canImport = !!selectedAdvanceId && !willExceed && !importing && enrichedRows.length > 0;

  const handleImport = async () => {
    if (!file || !selectedAdvanceId) return;
    setImporting(true);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const response = await fetch("/api/fuel-entries/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: res.data, cashAdvanceId: selectedAdvanceId }),
          });
          const data: ImportResult = await response.json();
          setResult(data);
          if (data.created > 0) {
            const msg =
              data.vehiclesCreated > 0
                ? `Imported ${data.created} entries · ${data.vehiclesCreated} new vehicle(s) registered`
                : `Imported ${data.created} entries`;
            toast("success", msg);
            // Refresh both lists so cards + vehicle map stay accurate
            fetch("/api/cash-advances").then((r) => r.json()).then(setCashAdvances).catch(() => {});
            fetch("/api/vehicles").then((r) => r.json()).then(setVehicles).catch(() => {});
          }
          if (data.errors.length > 0)
            toast("error", `${data.errors.length} row(s) had errors`);
        } catch {
          toast("error", "Import failed");
        } finally {
          setImporting(false);
        }
      },
    });
  };

  const downloadTemplate = () => {
    // Columns match the Excel summary sheet exactly. Amount is included for reference — the
    // system recalculates it from Quantity × Price and never reads the Amount column.
    const cols = [
      "Date",
      "Assigned Driver",
      "Vehicle Description",
      "Plate Number",
      "Odometer Reading",
      "Fuel Type",
      "Engine Oil",
      "Fuel Tank Capacity (in liters)",
      "Quantity",
      "Price (based on current market)",
      "Amount",
    ];
    const rows = [
      // ── Existing vehicles: Assigned Driver / Vehicle Description / Tank Capacity are optional
      //    (pulled from system). Fill them in only if the plate is not yet registered.
      // regular gasoline fill
      ["2026-04-22", "Ramos",    "XR 150",       "1101-954652",  "59563.70", "Gasoline", "-",   "12.00", "5.23",  "82.30", "430.43"],
      // engine oil row — Odometer, Fuel Type, and Fuel Tank Capacity left as dash
      ["2026-04-22", "Ramos",    "XR 150",       "1101-954652",  "-",        "-",        "1 L", "-",     "1",     "260.00","260.00"],
      // diesel
      ["2026-04-23", "Lago",     "Isuzu Mu X",   "1101-1253970", "90729.00", "Diesel",   "-",   "80.00", "49.45", "94.00", "4648.30"],
      // small motorcycle
      ["2026-04-27", "Jamison",  "XRM 125",      "1101-1446473", "1816.00",  "Gasoline", "-",   "3.90",  "2.5",   "80.30", "200.75"],
      // engine oil for same motorcycle
      ["2026-04-27", "Jamison",  "XRM 125",      "1101-1446473", "-",        "-",        "1 L", "-",     "1",     "260.00","260.00"],
      // ── New vehicle example: fill all three vehicle columns so the record is auto-created ──
      ["2026-04-28", "Dela Cruz","Honda XRM 125", "1101-9999XX",  "-",        "Gasoline", "-",   "3.90",  "2.91",  "81.30", "236.58"],
    ];
    const csv = [cols, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fuel-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header
        title="Import Fuel Data"
        subtitle="Bulk migrate existing fuel logs via CSV"
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download size={14} /> Download Template
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ── Step 1: Cash Advance ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={16} />
              Step 1 — Select Cash Advance to Audit Against
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashAdvances.length === 0 ? (
              <p className="text-sm text-gray-400">
                No cash advances found. Create one first before importing.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cashAdvances.map((adv) => {
                  const pct = ((adv.amount - adv.balance) / adv.amount) * 100;
                  const isSelected = adv.id === selectedAdvanceId;
                  return (
                    <button
                      key={adv.id}
                      onClick={() => setSelectedAdvanceId(adv.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-800 truncate mb-1">
                        {adv.purpose}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(adv.dateGranted).toLocaleDateString("en-PH")} · ₱
                        {fmt(adv.amount)} total
                      </div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Available balance</span>
                        <span
                          className={`font-bold ${
                            adv.balance < adv.amount * 0.1 ? "text-red-600" : "text-green-700"
                          }`}
                        >
                          ₱{fmt(adv.balance)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-400" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Step 2: Upload ── */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-3" />
              <div className="font-medium text-gray-700">Drop CSV here or click to browse</div>
              <div className="text-sm text-gray-400 mt-1">Supports .csv files</div>
              {file && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-700">
                  <FileText size={14} />
                  {file.name}
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </CardContent>
        </Card>

        {/* ── Preview table ── */}
        {enrichedRows.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="mb-1">
                    Preview — {enrichedRows.length} row{enrichedRows.length !== 1 ? "s" : ""}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {newVehicleRows.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <PlusCircle size={10} />
                        {newVehicleRows.length} vehicle{newVehicleRows.length > 1 ? "s" : ""} will be auto-registered
                      </span>
                    )}
                    {mismatchRows.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} />
                        {mismatchRows.length} driver name{mismatchRows.length > 1 ? "s" : ""} differ from system record
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-right space-y-0.5">
                  <div className="text-gray-600">
                    Total import:{" "}
                    <span className="font-bold text-gray-800">₱{fmt(totalAmount)}</span>
                  </div>
                  {selectedAdvance && (
                    <div
                      className={`font-semibold ${willExceed ? "text-red-600" : "text-green-700"}`}
                    >
                      Balance after import: ₱{fmt(balanceAfterImport!)}
                      {willExceed && " — exceeds balance!"}
                    </div>
                  )}
                  {!selectedAdvance && (
                    <div className="text-amber-600 text-xs">
                      Select a cash advance above to see balance impact
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {TABLE_COLS.map((h) => (
                        <th
                          key={h}
                          className={`px-3 py-2 font-semibold text-gray-600 whitespace-nowrap ${
                            RIGHT_ALIGN.has(h) ? "text-right" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enrichedRows.map((row, i) => {
                      const rowBg =
                        row.vehicleStatus === "new"
                          ? "bg-blue-50/40 hover:bg-blue-50"
                          : row.vehicleStatus === "mismatch"
                          ? "bg-amber-50/40 hover:bg-amber-50"
                          : "hover:bg-gray-50/50";
                      return (
                        <tr key={i} className={rowBg}>
                          {TABLE_COLS.map((col) => {
                            const isPlate = col === "Plate Number";
                            const isDriver = col === "Assigned Driver";
                            return (
                              <td
                                key={col}
                                className={`px-3 py-1.5 ${RIGHT_ALIGN.has(col) ? "text-right" : ""} ${
                                  col === "Amount" ? "font-semibold" : ""
                                }`}
                              >
                                {isPlate ? (
                                  <span className="flex items-center">
                                    <span className="font-mono">{row.plateNumber}</span>
                                    {STATUS_BADGE[row.vehicleStatus]}
                                  </span>
                                ) : isDriver && row.vehicleStatus === "mismatch" ? (
                                  <span
                                    title={`CSV value: "${row.csvDriver}" — system record kept`}
                                    className="cursor-help"
                                  >
                                    {row.assignedDriver}
                                    <span className="ml-1 text-[10px] text-amber-500 font-semibold">
                                      ≠ CSV
                                    </span>
                                  </span>
                                ) : (
                                  getCellText(row, col)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-50 font-bold text-xs">
                      <td colSpan={TABLE_COLS.length - 1} className="px-3 py-2 text-right text-gray-700">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right">₱{fmt(totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Import action bar ── */}
        {enrichedRows.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-gray-50 rounded-xl border">
            <div className="text-sm space-y-0.5">
              {!selectedAdvanceId && (
                <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <AlertTriangle size={14} /> Select a cash advance above to continue
                </div>
              )}
              {willExceed && (
                <div className="flex items-center gap-1.5 text-red-600 font-medium">
                  <XCircle size={14} /> Import total exceeds available balance
                </div>
              )}
              {selectedAdvance && !willExceed && (
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle size={14} />
                  Ready — {enrichedRows.length} entries will be charged against &ldquo;
                  {selectedAdvance.purpose}&rdquo;
                  {newVehicleRows.length > 0 &&
                    ` · ${newVehicleRows.length} new vehicle(s) will be registered`}
                </div>
              )}
            </div>
            <Button onClick={handleImport} disabled={!canImport}>
              {importing ? "Importing…" : `Import ${enrichedRows.length} Rows`}
            </Button>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                {result.created > 0 ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
                <span className="font-semibold">
                  {result.created} fuel entr{result.created !== 1 ? "ies" : "y"} imported
                  {result.vehiclesCreated > 0 &&
                    ` · ${result.vehiclesCreated} new vehicle${result.vehiclesCreated !== 1 ? "s" : ""} registered`}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-amber-700">
                    <AlertTriangle size={13} /> {result.errors.length} error(s):
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Column reference ── */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Column Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { col: "Date",                              desc: "YYYY-MM-DD or M/D/YY — both accepted (e.g. 2026-04-22 or 4/22/26)", req: true },
                { col: "Assigned Driver",                   desc: "Driver name — required only when the plate is not yet registered; used to auto-create the vehicle record", req: false },
                { col: "Vehicle Description",               desc: "e.g. XR 150, Isuzu Mu X — required only for new vehicles", req: false },
                { col: "Plate Number",                      desc: "Vehicle plate number — if not found, the vehicle is auto-registered using the columns above", req: true },
                { col: "Odometer Reading",                  desc: "Numeric value, or - if not recorded or defective", req: false },
                { col: "Fuel Type",                         desc: "Gasoline, Diesel, or Premium Unleaded — use - for engine oil-only rows", req: false },
                { col: "Engine Oil",                        desc: 'Amount purchased, e.g. "1 L" — leave - if none', req: false },
                { col: "Fuel Tank Capacity (in liters)",   desc: "e.g. 12, 80, 3.90 — required only for new vehicles", req: false },
                { col: "Quantity",                          desc: "Liters of fuel purchased (decimal, must be > 0)", req: true },
                { col: "Price (based on current market)",   desc: "Price per liter at the time of purchase (must be > 0)", req: true },
                { col: "Amount",                            desc: "For reference only — the system always recalculates this as Quantity × Price", req: false },
              ].map((r) => (
                <div key={r.col} className="flex gap-2 items-baseline">
                  <span className="font-mono text-blue-700 shrink-0 w-56 text-xs">{r.col}</span>
                  <span className="text-gray-600 text-xs flex-1">{r.desc}</span>
                  {r.req ? (
                    <span className="text-red-500 text-xs shrink-0">required</span>
                  ) : (
                    <span className="text-gray-300 text-xs shrink-0">optional</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <strong>Existing vehicles:</strong> Only Plate Number + fuel data are needed. Driver,
                description, and tank capacity are pulled automatically from the system.
              </div>
              <div className="p-3 bg-violet-50 rounded-lg text-xs text-violet-700">
                <strong>New vehicles:</strong> Fill in Assigned Driver, Vehicle Description, and Fuel
                Tank Capacity — the vehicle will be created automatically during import.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
