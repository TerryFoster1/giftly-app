-- Admin-managed affiliate program setup records.
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "defaultDomain" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateProgram_active_idx" ON "AffiliateProgram"("active");
