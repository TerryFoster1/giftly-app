-- Add admin flag for MVP admin access.
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Curated recommended products managed by Giftly admins.
CREATE TABLE "RecommendedProduct" (
  "id" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "originalUrl" TEXT NOT NULL,
  "affiliateUrl" TEXT,
  "affiliateProgram" TEXT,
  "affiliateStatus" TEXT NOT NULL DEFAULT 'none',
  "affiliateNotes" TEXT,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT '',
  "storeName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "targetAudienceNotes" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "hot" BOOLEAN NOT NULL DEFAULT false,
  "seasonal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecommendedProduct_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RecommendedProduct" ADD CONSTRAINT "RecommendedProduct_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "RecommendedProduct_active_featured_hot_seasonal_idx" ON "RecommendedProduct"("active", "featured", "hot", "seasonal");
CREATE INDEX "RecommendedProduct_affiliateStatus_idx" ON "RecommendedProduct"("affiliateStatus");
CREATE INDEX "RecommendedProduct_createdByUserId_idx" ON "RecommendedProduct"("createdByUserId");
