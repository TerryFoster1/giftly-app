CREATE TYPE "GiftEventType" AS ENUM ('BIRTHDAY', 'ANNIVERSARY', 'WEDDING', 'BABY_SHOWER', 'HOLIDAY', 'CUSTOM');

ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "GiftEvent" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "profileId" TEXT,
  "title" TEXT NOT NULL,
  "eventType" "GiftEventType" NOT NULL,
  "eventDate" TIMESTAMP(3),
  "groupLabel" "GroupLabel",
  "customGroupLabel" TEXT,
  "notes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GiftEvent_ownerUserId_idx" ON "GiftEvent"("ownerUserId");
CREATE INDEX "GiftEvent_ownerUserId_eventDate_idx" ON "GiftEvent"("ownerUserId", "eventDate");
CREATE INDEX "GiftEvent_profileId_idx" ON "GiftEvent"("profileId");

ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftEvent" ADD CONSTRAINT "GiftEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
