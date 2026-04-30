-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT NOT NULL,
    "linkedUserId" TEXT,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT NOT NULL,
    "birthday" DATETIME,
    "anniversary" DATETIME,
    "primaryEventType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isManagedProfile" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Profile_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("anniversary", "bio", "birthday", "createdAt", "displayName", "id", "isManagedProfile", "isPrimary", "linkedUserId", "ownerUserId", "photoUrl", "primaryEventType", "relationship", "slug", "updatedAt") SELECT "anniversary", "bio", "birthday", "createdAt", "displayName", "id", "isManagedProfile", "isPrimary", "linkedUserId", "ownerUserId", "photoUrl", "primaryEventType", "relationship", "slug", "updatedAt" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");
CREATE INDEX "Profile_ownerUserId_idx" ON "Profile"("ownerUserId");
CREATE INDEX "Profile_linkedUserId_idx" ON "Profile"("linkedUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
