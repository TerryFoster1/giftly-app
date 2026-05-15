-- Add persisted wishlist privacy for dashboard list cards.
ALTER TABLE "Profile" ADD COLUMN "listVisibility" "Visibility" NOT NULL DEFAULT 'private';
