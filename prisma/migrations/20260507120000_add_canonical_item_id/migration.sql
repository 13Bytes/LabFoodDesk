-- Add canonical item IDs to preserve logical item identity across immutable item copies
-- Rebuild the tables directly so the migration also recovers from a failed
-- earlier attempt that already added nullable canonicalItemId columns.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "new_Item";
DROP TABLE IF EXISTS "new_ItemCategoryMapping";

CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "for_grouporders" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Item_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ClearingAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("id", "canonicalItemId", "name", "price", "is_active", "for_grouporders", "accountId")
SELECT "id", "id", "name", "price", "is_active", "for_grouporders", "accountId"
FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX IF NOT EXISTS "Item_canonicalItemId_idx" ON "Item"("canonicalItemId");

CREATE TABLE "new_ItemCategoryMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalItemId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "ItemCategoryMapping_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemCategoryMapping_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ItemCategoryMapping" ("id", "canonicalItemId", "itemId", "transactionId")
SELECT
    "ItemCategoryMapping"."id",
    (SELECT "Item"."canonicalItemId" FROM "Item" WHERE "Item"."id" = "ItemCategoryMapping"."itemId"),
    "ItemCategoryMapping"."itemId",
    "ItemCategoryMapping"."transactionId"
FROM "ItemCategoryMapping";
DROP TABLE "ItemCategoryMapping";
ALTER TABLE "new_ItemCategoryMapping" RENAME TO "ItemCategoryMapping";
CREATE INDEX IF NOT EXISTS "ItemCategoryMapping_canonicalItemId_idx" ON "ItemCategoryMapping"("canonicalItemId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
