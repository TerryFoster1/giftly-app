CREATE TYPE "Visibility" AS ENUM ('private', 'shared', 'public');
CREATE TYPE "EventTag" AS ENUM ('Birthday', 'Christmas', 'Wedding', 'Baby_Shower', 'Housewarming', 'Graduation', 'General_Wishlist', 'Custom');
CREATE TYPE "ReservationStatus" AS ENUM ('available', 'reserved');
CREATE TYPE "ReservationRecordStatus" AS ENUM ('active', 'cancelled');
CREATE TYPE "AffiliateStatus" AS ENUM ('not_checked', 'not_available', 'available', 'converted');
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "GroupLabel" AS ENUM ('FAMILY', 'FRIENDS', 'PARTNER', 'GUESTS', 'CUSTOM');
CREATE TYPE "PrimaryEventType" AS ENUM ('BIRTHDAY', 'WEDDING', 'BABY', 'GENERAL');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "linkedUserId" TEXT,
  "displayName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "photoUrl" TEXT,
  "bio" TEXT NOT NULL,
  "birthday" TIMESTAMP(3),
  "anniversary" TIMESTAMP(3),
  "primaryEventType" "PrimaryEventType",
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isManagedProfile" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Connection" (
  "id" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "managedProfileId" TEXT,
  "emailOrPhone" TEXT,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "groupLabel" "GroupLabel" NOT NULL DEFAULT 'FAMILY',
  "customGroupLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GiftItem" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "productUrl" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT,
  "monetizedUrl" TEXT NOT NULL,
  "affiliateStatus" "AffiliateStatus" NOT NULL DEFAULT 'not_checked',
  "storeName" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT NOT NULL,
  "eventTag" "EventTag" NOT NULL,
  "customEventTag" TEXT,
  "wantRating" INTEGER NOT NULL,
  "visibility" "Visibility" NOT NULL,
  "hiddenFromRecipient" BOOLEAN NOT NULL DEFAULT false,
  "allowContributions" BOOLEAN NOT NULL DEFAULT false,
  "fundingGoalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentContributionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reservedStatus" "ReservationStatus" NOT NULL DEFAULT 'available',
  "reservedBy" TEXT,
  "purchasedStatus" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL,
  "giftItemId" TEXT NOT NULL,
  "reserverName" TEXT NOT NULL,
  "reserverEmail" TEXT,
  "status" "ReservationRecordStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContributionPlaceholder" (
  "id" TEXT NOT NULL,
  "giftItemId" TEXT NOT NULL,
  "contributorName" TEXT NOT NULL,
  "contributorEmail" TEXT,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'placeholder',
  "stripePaymentIntentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContributionPlaceholder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");
CREATE INDEX "Profile_ownerUserId_idx" ON "Profile"("ownerUserId");
CREATE INDEX "Profile_linkedUserId_idx" ON "Profile"("linkedUserId");
CREATE INDEX "Connection_requesterUserId_idx" ON "Connection"("requesterUserId");
CREATE INDEX "Connection_targetUserId_idx" ON "Connection"("targetUserId");
CREATE INDEX "Connection_managedProfileId_idx" ON "Connection"("managedProfileId");
CREATE INDEX "GiftItem_profileId_idx" ON "GiftItem"("profileId");
CREATE INDEX "GiftItem_profileId_visibility_purchasedStatus_idx" ON "GiftItem"("profileId", "visibility", "purchasedStatus");
CREATE INDEX "Reservation_giftItemId_idx" ON "Reservation"("giftItemId");
CREATE INDEX "ContributionPlaceholder_giftItemId_idx" ON "ContributionPlaceholder"("giftItemId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContributionPlaceholder" ADD CONSTRAINT "ContributionPlaceholder_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
