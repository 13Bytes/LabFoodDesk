/*
  Warnings:

  - You are about to drop the column `repeatWeeks` on the `GroupOrderTemplate` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupOrderTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "ordersCloseAt" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_GroupOrderTemplate" ("active", "id", "name", "ordersCloseAt", "weekday") SELECT "active", "id", "name", "ordersCloseAt", "weekday" FROM "GroupOrderTemplate";
DROP TABLE "GroupOrderTemplate";
ALTER TABLE "new_GroupOrderTemplate" RENAME TO "GroupOrderTemplate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
