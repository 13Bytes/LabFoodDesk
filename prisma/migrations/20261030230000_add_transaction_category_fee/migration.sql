-- CreateTable
CREATE TABLE "TransactionCategoryFee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "markupPercentage" INTEGER,
    "markupFixed" REAL,
    "markupDestinationId" TEXT,
    CONSTRAINT "TransactionCategoryFee_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionCategoryFee_markupDestinationId_fkey" FOREIGN KEY ("markupDestinationId") REFERENCES "ClearingAccount" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TransactionCategoryFee_transactionId_idx" ON "TransactionCategoryFee"("transactionId");

-- existing single-item buys of group orders (reserved or already booked - revertClosed needs the fees as well):
-- take the current markup of the item's categories
INSERT INTO "TransactionCategoryFee" ("id", "transactionId", "categoryId", "markupPercentage", "markupFixed", "markupDestinationId")
SELECT lower(hex(randomblob(12))), t."id", c."id", c."markupPercentage", c."markupFixed", c."markupDestinationId"
FROM "Transaction" t
JOIN "ItemCategoryMapping" m ON m."transactionId" = t."id"
JOIN "_CategoryToItem" ci ON ci."B" = m."itemId"
JOIN "Category" c ON c."id" = ci."A"
WHERE t."groupOrderId" IS NOT NULL AND t."type" IN (0, 4) AND t."canceled" = false;
