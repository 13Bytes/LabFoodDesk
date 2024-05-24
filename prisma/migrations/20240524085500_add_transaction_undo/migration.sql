-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "moneyDestinationUserId" TEXT,
    "note" TEXT,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Transaction_canceledByUserId_fkey" FOREIGN KEY ("canceledByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_moneyDestinationUserId_fkey" FOREIGN KEY ("moneyDestinationUserId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("createdAt", "groupOrderId", "id", "moneyDestinationUserId", "note", "totalAmount", "type", "userId") SELECT "createdAt", "groupOrderId", "id", "moneyDestinationUserId", "note", "totalAmount", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
