export type FuelType = "GASOLINE" | "DIESEL" | "PREMIUM_UNLEADED";

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  GASOLINE: "Gasoline",
  DIESEL: "Diesel",
  PREMIUM_UNLEADED: "Premium Unleaded",
};

export const FUEL_TYPES: FuelType[] = ["GASOLINE", "DIESEL", "PREMIUM_UNLEADED"];

export interface Vehicle {
  id: string;
  assignedDriver: string;
  plateNumber: string;
  propertyNumber: string;
  description: string;
  acquisitionDate: string | Date;
  fuelType: FuelType;
  tankCapacity: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CashAdvance {
  id: string;
  amount: number;
  dateGranted: string | Date;
  purpose: string;
  balance: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FuelEntry {
  id: string;
  date: string | Date;
  vehicleId: string;
  vehicle?: Vehicle;
  cashAdvanceId: string;
  cashAdvance?: CashAdvance;
  odometer: number;
  fuelType: FuelType;
  hasEngineOil: boolean;
  quantity: number;
  unitPrice: number;
  amount: number;
  invoiceNumber: string;
  remarks?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FuelEntryWithRelations extends FuelEntry {
  vehicle: Vehicle;
  cashAdvance: CashAdvance;
}

export interface DashboardStats {
  totalGranted: number;
  totalConsumed: number;
  remainingBalance: number;
  totalEntries: number;
  activeCashAdvances: number;
  totalVehicles: number;
}

export interface AIRData {
  airNumber: string;
  dateGenerated: string;
  payee: string;
  requisitioningOffice: string;
  invoiceNumber: string;
  invoiceDate: string;
  entries: FuelEntryWithRelations[];
}

export interface ConsumptionReportData {
  period: { from: string; to: string };
  rows: ConsumptionRow[];
}

export interface ConsumptionRow {
  plateNumber: string;
  driverName: string;
  description: string;
  dieselLiters: number;
  gasolineLiters: number;
  premiumLiters: number;
  totalAmount: number;
  invoiceNumbers: string[];
  entries: FuelEntryWithRelations[];
}
