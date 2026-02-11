-- CreateTable
CREATE TABLE "outfits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "prompt" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "outfit_equipments" (
    "outfit_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,

    PRIMARY KEY ("outfit_id", "equipment_id"),
    CONSTRAINT "outfit_equipments_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "outfits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outfit_equipments_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
