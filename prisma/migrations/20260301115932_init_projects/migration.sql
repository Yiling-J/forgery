/*
  Warnings:

  - You are about to drop the `characters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `equipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `expressions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `generation_equipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `outfit_equipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `outfits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `poses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `character_id` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `expression` on the `generations` table. All the data in the column will be lost.
  - You are about to drop the column `pose` on the `generations` table. All the data in the column will be lost.
  - Added the required column `project_id` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `collections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `generations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "equipments_category_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "characters";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "equipments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "expressions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "generation_equipments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "outfit_equipments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "outfits";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "poses";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cover_image_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_prompt" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT NOT NULL,
    "max_count" INTEGER NOT NULL,
    "with_image" BOOLEAN NOT NULL DEFAULT true,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_categories" ("created_at", "description", "enabled", "id", "image_prompt", "max_count", "name", "options", "updated_at", "with_image") SELECT "created_at", "description", "enabled", "id", "image_prompt", "max_count", "name", "options", "updated_at", "with_image" FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE TABLE "new_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "category_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "collections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collections_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_collections" ("category_id", "created_at", "description", "id", "name", "prompt", "updated_at") SELECT "category_id", "created_at", "description", "id", "name", "prompt", "updated_at" FROM "collections";
DROP TABLE "collections";
ALTER TABLE "new_collections" RENAME TO "collections";
CREATE TABLE "new_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "option" TEXT,
    "image_id" TEXT,
    "category_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "data_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "data_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_data" ("category_id", "created_at", "description", "id", "image_id", "name", "option", "updated_at") SELECT "category_id", "created_at", "description", "id", "image_id", "name", "option", "updated_at" FROM "data";
DROP TABLE "data";
ALTER TABLE "new_data" RENAME TO "data";
CREATE INDEX "data_option_idx" ON "data"("option");
CREATE TABLE "new_generation_data" (
    "generation_id" TEXT NOT NULL,
    "data_id" TEXT NOT NULL,

    PRIMARY KEY ("generation_id", "data_id"),
    CONSTRAINT "generation_data_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generation_data_data_id_fkey" FOREIGN KEY ("data_id") REFERENCES "data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_generation_data" ("data_id", "generation_id") SELECT "data_id", "generation_id" FROM "generation_data";
DROP TABLE "generation_data";
ALTER TABLE "new_generation_data" RENAME TO "generation_data";
CREATE TABLE "new_generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image_id" TEXT NOT NULL,
    "user_prompt" TEXT,
    "project_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generations_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_generations" ("created_at", "id", "image_id", "updated_at", "user_prompt") SELECT "created_at", "id", "image_id", "updated_at", "user_prompt" FROM "generations";
DROP TABLE "generations";
ALTER TABLE "new_generations" RENAME TO "generations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
