-- Admin-managed affiliate program setup records.
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "defaultDomain" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "AffiliateProgram_active_idx" ON "AffiliateProgram"("active");
