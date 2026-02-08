/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `category_id` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `sub_category_id` on the `equipments` table. All the data in the column will be lost.
  - Added the required column `category` to the `equipments` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "categories";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_equipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sub_category" TEXT,
    "image_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "equipments_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_equipments" ("created_at", "description", "id", "image_id", "name", "updated_at") SELECT "created_at", "description", "id", "image_id", "name", "updated_at" FROM "equipments";
DROP TABLE "equipments";
ALTER TABLE "new_equipments" RENAME TO "equipments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
