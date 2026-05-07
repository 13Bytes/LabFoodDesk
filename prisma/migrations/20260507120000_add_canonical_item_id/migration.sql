-- Add canonical item IDs to preserve logical item identity across immutable item copies
ALTER TABLE "Item" ADD COLUMN "canonicalItemId" TEXT;
ALTER TABLE "ItemCategoryMapping" ADD COLUMN "canonicalItemId" TEXT;

-- Backfill existing rows
UPDATE "Item" SET "canonicalItemId" = "id" WHERE "canonicalItemId" IS NULL;

UPDATE "ItemCategoryMapping"
SET "canonicalItemId" = (
  SELECT "Item"."canonicalItemId"
  FROM "Item"
  WHERE "Item"."id" = "ItemCategoryMapping"."itemId"
)
WHERE "canonicalItemId" IS NULL;

-- Enforce not-null after backfill
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
SELECT "id", "canonicalItemId", "name", "price", "is_active", "for_grouporders", "accountId"
FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_canonicalItemId_idx" ON "Item"("canonicalItemId");

CREATE TABLE "new_ItemCategoryMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalItemId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "ItemCategoryMapping_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemCategoryMapping_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ItemCategoryMapping" ("id", "canonicalItemId", "itemId", "transactionId")
SELECT "id", "canonicalItemId", "itemId", "transactionId"
FROM "ItemCategoryMapping";
DROP TABLE "ItemCategoryMapping";
ALTER TABLE "new_ItemCategoryMapping" RENAME TO "ItemCategoryMapping";
CREATE INDEX "ItemCategoryMapping_canonicalItemId_idx" ON "ItemCategoryMapping"("canonicalItemId");
