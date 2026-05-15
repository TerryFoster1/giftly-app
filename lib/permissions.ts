import type { GiftItem, Profile, User } from "./types";

export function canManageProfile(user: User, profile: Profile) {
  return profile.ownerUserId === user.id;
}

export function giftsVisibleToOwner(user: User, profile: Profile, gifts: GiftItem[]) {
  if (!canManageProfile(user, profile)) return [];
  return gifts.filter((gift) => gift.profileId === profile.id);
}

export function giftsVisibleToPublic(profile: Profile, gifts: GiftItem[]) {
  return gifts.filter(
    (gift) =>
      gift.profileId === profile.id &&
      gift.visibility === "public" &&
      !gift.hiddenFromRecipient
  );
}

export function publicGiftView(gift: GiftItem) {
  return {
    id: gift.id,
    title: gift.title,
    productUrl: gift.affiliateUrl || gift.monetizedUrl || gift.productUrl,
    affiliateUrl: gift.affiliateUrl,
    monetizedUrl: gift.monetizedUrl,
    storeName: gift.storeName,
    imageUrl: gift.imageUrl,
    price: gift.price,
    currency: gift.currency,
    eventTag: gift.eventTag,
    wantRating: gift.wantRating,
    allowContributions: gift.allowContributions,
    fundingGoalAmount: gift.fundingGoalAmount,
    currentContributionAmount: gift.currentContributionAmount,
    reservedStatus: gift.reservedStatus,
    purchasedStatus: gift.purchasedStatus
  };
}
