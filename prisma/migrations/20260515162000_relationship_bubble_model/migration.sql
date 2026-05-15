ALTER TABLE "Connection" ADD COLUMN "realName" TEXT;
ALTER TABLE "Connection" ADD COLUMN "displayName" TEXT;
ALTER TABLE "Connection" ADD COLUMN "relationshipType" TEXT;

CREATE TABLE "WishlistShareExclusion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistShareExclusion_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "WishlistShare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WishlistShareExclusion_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WishlistShareExclusion_shareId_idx" ON "WishlistShareExclusion"("shareId");
CREATE INDEX "WishlistShareExclusion_connectionId_idx" ON "WishlistShareExclusion"("connectionId");
CREATE UNIQUE INDEX "WishlistShareExclusion_shareId_connectionId_key" ON "WishlistShareExclusion"("shareId", "connectionId");
