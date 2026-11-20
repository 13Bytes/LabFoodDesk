-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupOrderTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "ordersCloseAt" DATETIME NOT NULL,
    "ordersStartsAt" INTEGER NOT NULL DEFAULT 72,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultCategoryId" TEXT,
    CONSTRAINT "GroupOrderTemplate_defaultCategoryId_fkey" FOREIGN KEY ("defaultCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupOrderTemplate" ("active", "id", "name", "ordersCloseAt", "ordersStartsAt", "weekday") SELECT "active", "id", "name", "ordersCloseAt", "ordersStartsAt", "weekday" FROM "GroupOrderTemplate";
DROP TABLE "GroupOrderTemplate";
ALTER TABLE "new_GroupOrderTemplate" RENAME TO "GroupOrderTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
