/*
  Warnings:

  - You are about to drop the column `sub_category` on the `equipments` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_equipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "equipments_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_equipments" ("category", "created_at", "description", "id", "image_id", "name", "updated_at") SELECT "category", "created_at", "description", "id", "image_id", "name", "updated_at" FROM "equipments";
DROP TABLE "equipments";
ALTER TABLE "new_equipments" RENAME TO "equipments";
CREATE INDEX "equipments_category_idx" ON "equipments"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
