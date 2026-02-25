-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_prompt" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT NOT NULL,
    "max_count" INTEGER NOT NULL,
    "with_image" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "option" TEXT,
    "image_id" TEXT,
    "category_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "data_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "data_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generation_data" (
    "generation_id" TEXT NOT NULL,
    "data_id" TEXT NOT NULL,

    PRIMARY KEY ("generation_id", "data_id"),
    CONSTRAINT "generation_data_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "generation_data_data_id_fkey" FOREIGN KEY ("data_id") REFERENCES "data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "data_option_idx" ON "data"("option");
