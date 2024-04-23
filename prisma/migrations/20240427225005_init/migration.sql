-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "for_grouporders" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ProcurementItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ProcurementWish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupOrderId" TEXT,
    CONSTRAINT "ProcurementWish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProcurementWish_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "ordersCloseAt" DATETIME NOT NULL,
    "ordersClosedAt" DATETIME,
    "closedById" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "groupOrderTemplateId" TEXT,
    CONSTRAINT "GroupOrder_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupOrder_groupOrderTemplateId_fkey" FOREIGN KEY ("groupOrderTemplateId") REFERENCES "GroupOrderTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupOrderTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "ordersCloseAt" DATETIME NOT NULL,
    "repeatWeeks" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "markupDescription" TEXT,
    "markupPercentage" INTEGER,
    "markupFixed" REAL,
    "markupDestinationId" TEXT,
    "itemPurchaseId" TEXT,
    CONSTRAINT "Category_markupDestinationId_fkey" FOREIGN KEY ("markupDestinationId") REFERENCES "ClearingAccount" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Category_itemPurchaseId_fkey" FOREIGN KEY ("itemPurchaseId") REFERENCES "ItemCategoryMapping" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClearingAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ItemCategoryMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "ItemCategoryMapping_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemCategoryMapping_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcurementItemBilling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cost" REAL NOT NULL,
    "procurementItemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "ProcurementItemBilling_procurementItemId_fkey" FOREIGN KEY ("procurementItemId") REFERENCES "ProcurementItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProcurementItemBilling_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" INTEGER NOT NULL DEFAULT 0,
    "groupOrderId" TEXT,
    "moneyDestinationUserId" TEXT,
    "note" TEXT,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Transaction_groupOrderId_fkey" FOREIGN KEY ("groupOrderId") REFERENCES "GroupOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_moneyDestinationUserId_fkey" FOREIGN KEY ("moneyDestinationUserId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "allowOverdraw" BOOLEAN NOT NULL DEFAULT false,
    "balance" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_ProcurementItemToProcurementWish" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProcurementItemToProcurementWish_A_fkey" FOREIGN KEY ("A") REFERENCES "ProcurementItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProcurementItemToProcurementWish_B_fkey" FOREIGN KEY ("B") REFERENCES "ProcurementWish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryToItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CategoryToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryToProcurementItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CategoryToProcurementItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryToProcurementItem_B_fkey" FOREIGN KEY ("B") REFERENCES "ProcurementItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_ProcurementItemToProcurementWish_AB_unique" ON "_ProcurementItemToProcurementWish"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcurementItemToProcurementWish_B_index" ON "_ProcurementItemToProcurementWish"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToItem_AB_unique" ON "_CategoryToItem"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToItem_B_index" ON "_CategoryToItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToProcurementItem_AB_unique" ON "_CategoryToProcurementItem"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToProcurementItem_B_index" ON "_CategoryToProcurementItem"("B");
