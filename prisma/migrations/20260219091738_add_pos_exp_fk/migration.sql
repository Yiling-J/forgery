-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character_id" TEXT NOT NULL,
    "image_id" TEXT NOT NULL,
    "user_prompt" TEXT,
    "pose" TEXT,
    "expression" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "generations_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "generations_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "generations_pose_fkey" FOREIGN KEY ("pose") REFERENCES "poses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "generations_expression_fkey" FOREIGN KEY ("expression") REFERENCES "expressions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_generations" ("character_id", "created_at", "expression", "id", "image_id", "pose", "updated_at", "user_prompt") SELECT "character_id", "created_at", "expression", "id", "image_id", "pose", "updated_at", "user_prompt" FROM "generations";
DROP TABLE "generations";
ALTER TABLE "new_generations" RENAME TO "generations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
