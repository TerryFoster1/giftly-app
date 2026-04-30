ALTER TABLE "Profile" ADD COLUMN "linkedUserId" TEXT;
ALTER TABLE "Profile" ADD COLUMN "isManagedProfile" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Profile"
SET "linkedUserId" = "ownerUserId",
    "isManagedProfile" = false
WHERE "isPrimary" = true;

CREATE INDEX "Profile_linkedUserId_idx" ON "Profile"("linkedUserId");

CREATE TABLE "Connection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requesterUserId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "managedProfileId" TEXT,
  "emailOrPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "groupLabel" TEXT NOT NULL DEFAULT 'FAMILY',
  "customGroupLabel" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Connection_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Connection_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Connection_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Connection_requesterUserId_idx" ON "Connection"("requesterUserId");
CREATE INDEX "Connection_targetUserId_idx" ON "Connection"("targetUserId");
CREATE INDEX "Connection_managedProfileId_idx" ON "Connection"("managedProfileId");
