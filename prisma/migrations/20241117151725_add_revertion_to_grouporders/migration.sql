-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "ordersCloseAt" DATETIME NOT NULL,
    "ordersClosedAt" DATETIME,
    "closedById" TEXT,
    "revertedById" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "groupOrderTemplateId" TEXT,
    CONSTRAINT "GroupOrder_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_revertedById_fkey" FOREIGN KEY ("revertedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_groupOrderTemplateId_fkey" FOREIGN KEY ("groupOrderTemplateId") REFERENCES "GroupOrderTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupOrder" ("closedById", "groupOrderTemplateId", "id", "name", "ordersCloseAt", "ordersClosedAt", "status") SELECT "closedById", "groupOrderTemplateId", "id", "name", "ordersCloseAt", "ordersClosedAt", "status" FROM "GroupOrder";
DROP TABLE "GroupOrder";
ALTER TABLE "new_GroupOrder" RENAME TO "GroupOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
