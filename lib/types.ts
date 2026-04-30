export type Visibility = "private" | "shared" | "public";
export type EventTag =
  | "Birthday"
  | "Christmas"
  | "Wedding"
  | "Baby Shower"
  | "Housewarming"
  | "Graduation"
  | "General Wishlist"
  | "Custom";
export type ReservationStatus = "available" | "reserved";
export type GroupLabel = "FAMILY" | "FRIENDS" | "PARTNER" | "GUESTS" | "CUSTOM";
export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type PrimaryEventType = "BIRTHDAY" | "WEDDING" | "BABY" | "GENERAL";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  id: string;
  ownerUserId: string;
  linkedUserId?: string;
  displayName: string;
  slug: string;
  relationship: string;
  photoUrl?: string;
  bio: string;
  birthday?: string;
  anniversary?: string;
  primaryEventType?: PrimaryEventType;
  isPrimary: boolean;
  isManagedProfile: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Connection = {
  id: string;
  requesterUserId: string;
  targetUserId?: string;
  managedProfileId?: string;
  emailOrPhone?: string;
  status: ConnectionStatus;
  groupLabel: GroupLabel;
  customGroupLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type GiftItem = {
  id: string;
  profileId: string;
  createdByUserId: string;
  title: string;
  productUrl: string;
  originalUrl: string;
  affiliateUrl?: string;
  monetizedUrl: string;
  affiliateStatus: "not_checked" | "not_available" | "available" | "converted";
  storeName: string;
  imageUrl: string;
  price: number;
  currency: string;
  notes: string;
  eventTag: EventTag;
  customEventTag?: string;
  wantRating: 1 | 2 | 3 | 4 | 5;
  visibility: Visibility;
  hiddenFromRecipient: boolean;
  allowContributions: boolean;
  fundingGoalAmount: number;
  currentContributionAmount: number;
  reservedStatus: ReservationStatus;
  reservedBy?: string;
  purchasedStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Reservation = {
  id: string;
  giftItemId: string;
  reserverName: string;
  reserverEmail?: string;
  status: "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type Contribution = {
  id: string;
  giftItemId: string;
  contributorName: string;
  contributorEmail?: string;
  amount: number;
  status: "placeholder";
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
};

export const eventTags: EventTag[] = [
  "Birthday",
  "Christmas",
  "Wedding",
  "Baby Shower",
  "Housewarming",
  "Graduation",
  "General Wishlist",
  "Custom"
];
