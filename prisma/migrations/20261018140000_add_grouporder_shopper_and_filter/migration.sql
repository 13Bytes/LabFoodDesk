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
    "shopperId" TEXT,
    "filterCategoryId" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "groupOrderTemplateId" TEXT,
    CONSTRAINT "GroupOrder_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_revertedById_fkey" FOREIGN KEY ("revertedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_shopperId_fkey" FOREIGN KEY ("shopperId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_filterCategoryId_fkey" FOREIGN KEY ("filterCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_groupOrderTemplateId_fkey" FOREIGN KEY ("groupOrderTemplateId") REFERENCES "GroupOrderTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupOrder" ("closedById", "groupOrderTemplateId", "id", "name", "ordersCloseAt", "ordersClosedAt", "revertedById", "status") SELECT "closedById", "groupOrderTemplateId", "id", "name", "ordersCloseAt", "ordersClosedAt", "revertedById", "status" FROM "GroupOrder";
DROP TABLE "GroupOrder";
ALTER TABLE "new_GroupOrder" RENAME TO "GroupOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- closed group orders: the shopper is the user who got the compensation
UPDATE "GroupOrder" SET "shopperId" = (
    SELECT "moneyDestinationUserId" FROM "Transaction"
    WHERE "Transaction"."groupOrderId" = "GroupOrder"."id" AND "Transaction"."type" = 3 AND "Transaction"."canceled" = false
    LIMIT 1
) WHERE "status" = 6;
