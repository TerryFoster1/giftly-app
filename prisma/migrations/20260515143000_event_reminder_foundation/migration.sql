ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "GiftEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "profileId" TEXT,
  "title" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventDate" DATETIME,
  "groupLabel" TEXT,
  "customGroupLabel" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GiftEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GiftEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GiftEvent_ownerUserId_idx" ON "GiftEvent"("ownerUserId");
CREATE INDEX "GiftEvent_ownerUserId_eventDate_idx" ON "GiftEvent"("ownerUserId", "eventDate");
CREATE INDEX "GiftEvent_profileId_idx" ON "GiftEvent"("profileId");
