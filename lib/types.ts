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
export type ConnectionSource = "QR" | "INVITE_LINK" | "EMAIL" | "MANUAL";
export type PrimaryEventType = "BIRTHDAY" | "WEDDING" | "BABY" | "GENERAL";
export type GiftEventType = "BIRTHDAY" | "ANNIVERSARY" | "WEDDING" | "BABY_SHOWER" | "HOLIDAY" | "CUSTOM";
export type RecommendedAffiliateStatus = "none" | "matched" | "needs_review" | "manual";
export type SecretSantaEventStatus = "draft" | "open" | "drawn" | "archived";
export type SecretSantaJoinStatus = "invited" | "accepted" | "declined";
export type SecretSantaGiftActionType = "reserved" | "purchased";

export type User = {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  onboardingCompleted?: boolean;
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
  listVisibility: "private" | "shared";
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
  realName?: string;
  displayName?: string;
  relationshipType?: string;
  emailOrPhone?: string;
  status: ConnectionStatus;
  source: ConnectionSource;
  groupLabel: GroupLabel;
  customGroupLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type GiftGroupMember = {
  id: string;
  groupId: string;
  connectionId?: string;
  connectedUserId?: string;
  pendingEmailOrPhone?: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

export type GiftGroup = {
  id: string;
  ownerUserId: string;
  name: string;
  members: GiftGroupMember[];
  createdAt: string;
  updatedAt: string;
};

export type WishlistShare = {
  id: string;
  ownerUserId: string;
  profileId: string;
  connectionId?: string;
  groupId?: string;
  accessLevel: string;
  excludedConnectionIds: string[];
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
  originalPrice?: number;
  currentPrice?: number;
  shippingCost?: number;
  estimatedTotalCost?: number;
  priceSourceUrl?: string;
  bestFoundPrice?: number;
  bestFoundTotalCost?: number;
  bestFoundStoreName?: string;
  priceLastCheckedAt?: string;
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
  reservedByUserId?: string;
  purchasedStatus: boolean;
  purchasedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type SharedWishlist = {
  shareId: string;
  ownerUserId: string;
  ownerName: string;
  profile: Profile;
  gifts: GiftItem[];
  eventDate?: string;
};

export type SecretSantaParticipant = {
  id: string;
  eventId: string;
  userId?: string;
  profileId?: string;
  invitedEmail?: string;
  displayName: string;
  joinStatus: SecretSantaJoinStatus;
  inviteToken: string;
  createdAt: string;
  updatedAt: string;
};

export type SecretSantaAssignment = {
  id: string;
  eventId: string;
  giverParticipantId: string;
  recipientParticipantId: string;
  privateNote: string;
  createdAt: string;
  updatedAt: string;
};

export type SecretSantaGiftAction = {
  id: string;
  eventId: string;
  assignmentId: string;
  giftItemId: string;
  action: SecretSantaGiftActionType;
  privateNote: string;
  createdAt: string;
  updatedAt: string;
};

export type SecretSantaEvent = {
  id: string;
  organizerUserId: string;
  title: string;
  occasionDate?: string;
  spendingLimit?: number;
  rulesMessage: string;
  shippingNotes: string;
  status: SecretSantaEventStatus;
  inviteToken: string;
  participants: SecretSantaParticipant[];
  assignments?: SecretSantaAssignment[];
  giftActions?: SecretSantaGiftAction[];
  createdAt: string;
  updatedAt: string;
};

export type SecretSantaAssignmentDetail = {
  event: SecretSantaEvent;
  assignment: SecretSantaAssignment;
  giver: SecretSantaParticipant;
  recipient: SecretSantaParticipant;
  recipientProfile?: Profile;
  gifts: GiftItem[];
  giftActions: SecretSantaGiftAction[];
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

export type GiftEvent = {
  id: string;
  ownerUserId: string;
  profileId?: string;
  title: string;
  eventType: GiftEventType;
  eventDate?: string;
  groupLabel?: GroupLabel;
  customGroupLabel?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RecommendedProduct = {
  id: string;
  createdByUserId?: string;
  title: string;
  description: string;
  imageUrl: string;
  originalUrl: string;
  affiliateUrl?: string;
  affiliateProgram?: string;
  affiliateStatus: RecommendedAffiliateStatus;
  affiliateNotes?: string;
  price: number;
  currency: string;
  storeName: string;
  category: string;
  tags: string;
  targetAudienceNotes: string;
  active: boolean;
  featured: boolean;
  hot: boolean;
  seasonal: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AffiliateProgram = {
  id: string;
  name: string;
  trackingId: string;
  defaultDomain: string;
  notes: string;
  active: boolean;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOverview = {
  currentUserId: string;
  metrics: {
    totalUsers: number;
    totalGifts: number;
    totalProfiles: number;
    recommendedProducts: number;
    productsWithAffiliateLinks: number;
    productsMissingAffiliateLinks: number;
    affiliatePrograms: number;
  };
  recommendedProducts: RecommendedProduct[];
  affiliatePrograms: AffiliateProgram[];
  unmatchedGifts: Array<Pick<GiftItem, "id" | "title" | "storeName" | "productUrl" | "affiliateUrl" | "affiliateStatus" | "createdAt">>;
  mostAddedProducts: Array<{ title: string; storeName: string; count: number }>;
  wishlists: Array<Pick<Profile, "id" | "displayName" | "slug" | "relationship" | "listVisibility" | "isPrimary" | "createdAt"> & {
    ownerName: string;
    ownerEmail: string;
    giftCount: number;
  }>;
  gifts: Array<Pick<GiftItem, "id" | "title" | "storeName" | "price" | "currency" | "visibility" | "affiliateUrl" | "affiliateStatus" | "createdAt"> & {
    wishlistTitle: string;
    ownerEmail: string;
  }>;
  users: Array<{
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    profileCount: number;
    giftCount: number;
    createdAt: string;
  }>;
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
