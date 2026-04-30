CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "photoUrl" TEXT,
  "bio" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Profile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");
CREATE INDEX "Profile_ownerUserId_idx" ON "Profile"("ownerUserId");

CREATE TABLE "GiftItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "profileId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "productUrl" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT,
  "monetizedUrl" TEXT NOT NULL,
  "affiliateStatus" TEXT NOT NULL DEFAULT 'not_checked',
  "storeName" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "price" REAL NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT NOT NULL,
  "eventTag" TEXT NOT NULL,
  "customEventTag" TEXT,
  "wantRating" INTEGER NOT NULL,
  "visibility" TEXT NOT NULL,
  "hiddenFromRecipient" BOOLEAN NOT NULL DEFAULT false,
  "allowContributions" BOOLEAN NOT NULL DEFAULT false,
  "fundingGoalAmount" REAL NOT NULL DEFAULT 0,
  "currentContributionAmount" REAL NOT NULL DEFAULT 0,
  "reservedStatus" TEXT NOT NULL DEFAULT 'available',
  "reservedBy" TEXT,
  "purchasedStatus" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GiftItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GiftItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "GiftItem_profileId_idx" ON "GiftItem"("profileId");
CREATE INDEX "GiftItem_profileId_visibility_purchasedStatus_idx" ON "GiftItem"("profileId", "visibility", "purchasedStatus");

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "giftItemId" TEXT NOT NULL,
  "reserverName" TEXT NOT NULL,
  "reserverEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Reservation_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Reservation_giftItemId_idx" ON "Reservation"("giftItemId");

CREATE TABLE "ContributionPlaceholder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "giftItemId" TEXT NOT NULL,
  "contributorName" TEXT NOT NULL,
  "contributorEmail" TEXT,
  "amount" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'placeholder',
  "stripePaymentIntentId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ContributionPlaceholder_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContributionPlaceholder_giftItemId_idx" ON "ContributionPlaceholder"("giftItemId");
