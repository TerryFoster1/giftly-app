-- Add persisted wishlist privacy for dashboard list cards.
ALTER TABLE "Profile" ADD COLUMN "listVisibility" TEXT NOT NULL DEFAULT 'private';
