-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FuelEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "cashAdvanceId" TEXT NOT NULL,
    "odometer" REAL NOT NULL,
    "fuelType" TEXT NOT NULL,
    "hasEngineOil" BOOLEAN NOT NULL DEFAULT false,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FuelEntry_cashAdvanceId_fkey" FOREIGN KEY ("cashAdvanceId") REFERENCES "CashAdvance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FuelEntry" ("amount", "cashAdvanceId", "createdAt", "date", "fuelType", "hasEngineOil", "id", "invoiceNumber", "odometer", "quantity", "remarks", "unitPrice", "updatedAt", "vehicleId") SELECT "amount", "cashAdvanceId", "createdAt", "date", "fuelType", "hasEngineOil", "id", "invoiceNumber", "odometer", "quantity", "remarks", "unitPrice", "updatedAt", "vehicleId" FROM "FuelEntry";
DROP TABLE "FuelEntry";
ALTER TABLE "new_FuelEntry" RENAME TO "FuelEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
