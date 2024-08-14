/*
  Warnings:

  - Added the required column `accountId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "for_grouporders" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Item_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ClearingAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("for_grouporders", "id", "is_active", "name", "price") SELECT "for_grouporders", "id", "is_active", "name", "price" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "canceledDate" DATETIME,
    "canceledByUserId" TEXT,
    "amountWithoutFees" REAL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" INTEGER NOT NULL DEFAULT 0,
    "groupOrderId" TEXT,
    "clearingAccountId" TEXT,
    "moneyDestinationUserId" TEXT,
    "note" TEXT,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Transaction_canceledByUserId_fkey" FOREIGN KEY ("canceledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_clearingAccountId_fkey" FOREIGN KEY ("clearingAccountId") REFERENCES "ClearingAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_moneyDestinationUserId_fkey" FOREIGN KEY ("moneyDestinationUserId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amountWithoutFees", "canceled", "canceledByUserId", "canceledDate", "createdAt", "groupOrderId", "id", "moneyDestinationUserId", "note", "totalAmount", "type", "userId") SELECT "amountWithoutFees", "canceled", "canceledByUserId", "canceledDate", "createdAt", "groupOrderId", "id", "moneyDestinationUserId", "note", "totalAmount", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
