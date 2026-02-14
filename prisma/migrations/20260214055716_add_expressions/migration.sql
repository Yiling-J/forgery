-- AlterTable
ALTER TABLE "generations" ADD COLUMN "expression" TEXT;

-- CreateTable
CREATE TABLE "expressions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "expressions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
