ALTER TABLE "Connection" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';

CREATE TABLE "GiftGroup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GiftGroup_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GiftGroupMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "connectionId" TEXT,
  "connectedUserId" TEXT,
  "pendingEmailOrPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GiftGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GiftGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GiftGroupMember_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "GiftGroupMember_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "WishlistShare" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "connectionId" TEXT,
  "groupId" TEXT,
  "accessLevel" TEXT NOT NULL DEFAULT 'view',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "WishlistShare_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WishlistShare_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WishlistShare_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WishlistShare_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GiftGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GiftGroup_ownerUserId_idx" ON "GiftGroup"("ownerUserId");
CREATE UNIQUE INDEX "GiftGroup_ownerUserId_name_key" ON "GiftGroup"("ownerUserId", "name");
CREATE INDEX "GiftGroupMember_groupId_idx" ON "GiftGroupMember"("groupId");
CREATE INDEX "GiftGroupMember_connectionId_idx" ON "GiftGroupMember"("connectionId");
CREATE INDEX "GiftGroupMember_connectedUserId_idx" ON "GiftGroupMember"("connectedUserId");
CREATE INDEX "WishlistShare_ownerUserId_idx" ON "WishlistShare"("ownerUserId");
CREATE INDEX "WishlistShare_profileId_idx" ON "WishlistShare"("profileId");
CREATE INDEX "WishlistShare_connectionId_idx" ON "WishlistShare"("connectionId");
CREATE INDEX "WishlistShare_groupId_idx" ON "WishlistShare"("groupId");
