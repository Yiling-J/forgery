-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "imagePrompt" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxCount" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "data_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DataToGeneration" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DataToGeneration_A_fkey" FOREIGN KEY ("A") REFERENCES "data" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DataToGeneration_B_fkey" FOREIGN KEY ("B") REFERENCES "generations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_DataToGeneration_AB_unique" ON "_DataToGeneration"("A", "B");

-- CreateIndex
CREATE INDEX "_DataToGeneration_B_index" ON "_DataToGeneration"("B");
