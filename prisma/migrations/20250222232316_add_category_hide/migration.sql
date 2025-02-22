-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "defaultUnfoldedDisplay" BOOLEAN NOT NULL DEFAULT true,
    "markupDescription" TEXT,
    "markupPercentage" INTEGER,
    "markupFixed" REAL,
    "markupDestinationId" TEXT,
    "itemPurchaseId" TEXT,
    CONSTRAINT "Category_markupDestinationId_fkey" FOREIGN KEY ("markupDestinationId") REFERENCES "ClearingAccount" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Category_itemPurchaseId_fkey" FOREIGN KEY ("itemPurchaseId") REFERENCES "ItemCategoryMapping" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "is_active", "itemPurchaseId", "markupDescription", "markupDestinationId", "markupFixed", "markupPercentage", "name") SELECT "id", "is_active", "itemPurchaseId", "markupDescription", "markupDestinationId", "markupFixed", "markupPercentage", "name" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
