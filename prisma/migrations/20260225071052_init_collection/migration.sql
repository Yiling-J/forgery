-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT,
    "category_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "collections_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collection_items" (
    "collection_id" TEXT NOT NULL,
    "data_id" TEXT NOT NULL,

    PRIMARY KEY ("collection_id", "data_id"),
    CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_items_data_id_fkey" FOREIGN KEY ("data_id") REFERENCES "data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
