CREATE TABLE "SecretSantaEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizerUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "occasionDate" DATETIME,
  "spendingLimit" REAL,
  "rulesMessage" TEXT NOT NULL,
  "shippingNotes" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "inviteToken" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SecretSantaEvent_organizerUserId_fkey" FOREIGN KEY ("organizerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SecretSantaParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "userId" TEXT,
  "profileId" TEXT,
  "invitedEmail" TEXT,
  "displayName" TEXT NOT NULL,
  "joinStatus" TEXT NOT NULL DEFAULT 'invited',
  "inviteToken" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SecretSantaParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SecretSantaEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SecretSantaAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "giverParticipantId" TEXT NOT NULL,
  "recipientParticipantId" TEXT NOT NULL,
  "privateNote" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SecretSantaAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SecretSantaEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaAssignment_giverParticipantId_fkey" FOREIGN KEY ("giverParticipantId") REFERENCES "SecretSantaParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaAssignment_recipientParticipantId_fkey" FOREIGN KEY ("recipientParticipantId") REFERENCES "SecretSantaParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SecretSantaExclusion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "participantAId" TEXT NOT NULL,
  "participantBId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecretSantaExclusion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SecretSantaEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaExclusion_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "SecretSantaParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaExclusion_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "SecretSantaParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SecretSantaGiftAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "giftItemId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "privateNote" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SecretSantaGiftAction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SecretSantaEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaGiftAction_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SecretSantaAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SecretSantaGiftAction_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SecretSantaEvent_inviteToken_key" ON "SecretSantaEvent"("inviteToken");
CREATE INDEX "SecretSantaEvent_organizerUserId_idx" ON "SecretSantaEvent"("organizerUserId");
CREATE INDEX "SecretSantaEvent_status_idx" ON "SecretSantaEvent"("status");
CREATE UNIQUE INDEX "SecretSantaParticipant_inviteToken_key" ON "SecretSantaParticipant"("inviteToken");
CREATE UNIQUE INDEX "SecretSantaParticipant_eventId_userId_key" ON "SecretSantaParticipant"("eventId", "userId");
CREATE UNIQUE INDEX "SecretSantaParticipant_eventId_invitedEmail_key" ON "SecretSantaParticipant"("eventId", "invitedEmail");
CREATE INDEX "SecretSantaParticipant_eventId_idx" ON "SecretSantaParticipant"("eventId");
CREATE INDEX "SecretSantaParticipant_userId_idx" ON "SecretSantaParticipant"("userId");
CREATE INDEX "SecretSantaParticipant_profileId_idx" ON "SecretSantaParticipant"("profileId");
CREATE INDEX "SecretSantaParticipant_invitedEmail_idx" ON "SecretSantaParticipant"("invitedEmail");
CREATE UNIQUE INDEX "SecretSantaAssignment_giverParticipantId_key" ON "SecretSantaAssignment"("giverParticipantId");
CREATE UNIQUE INDEX "SecretSantaAssignment_recipientParticipantId_key" ON "SecretSantaAssignment"("recipientParticipantId");
CREATE INDEX "SecretSantaAssignment_eventId_idx" ON "SecretSantaAssignment"("eventId");
CREATE INDEX "SecretSantaAssignment_recipientParticipantId_idx" ON "SecretSantaAssignment"("recipientParticipantId");
CREATE UNIQUE INDEX "SecretSantaExclusion_eventId_participantAId_participantBId_key" ON "SecretSantaExclusion"("eventId", "participantAId", "participantBId");
CREATE INDEX "SecretSantaExclusion_eventId_idx" ON "SecretSantaExclusion"("eventId");
CREATE INDEX "SecretSantaExclusion_participantAId_idx" ON "SecretSantaExclusion"("participantAId");
CREATE INDEX "SecretSantaExclusion_participantBId_idx" ON "SecretSantaExclusion"("participantBId");
CREATE UNIQUE INDEX "SecretSantaGiftAction_assignmentId_giftItemId_key" ON "SecretSantaGiftAction"("assignmentId", "giftItemId");
CREATE INDEX "SecretSantaGiftAction_eventId_idx" ON "SecretSantaGiftAction"("eventId");
CREATE INDEX "SecretSantaGiftAction_assignmentId_idx" ON "SecretSantaGiftAction"("assignmentId");
CREATE INDEX "SecretSantaGiftAction_giftItemId_idx" ON "SecretSantaGiftAction"("giftItemId");
