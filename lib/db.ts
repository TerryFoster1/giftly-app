import { ConnectionSource as DbConnectionSource, ConnectionStatus as DbConnectionStatus, EventTag as DbEventTag, GiftEventType as DbGiftEventType, GroupLabel as DbGroupLabel, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { createAmazonAffiliateUrl, shouldPreserveManualAffiliateUrl } from "./affiliate";
import { userHasAdminAccess } from "./auth";
import { isAmazonUrl, normalizeAmazonProductUrl } from "./product-url";
import { prisma } from "./prisma";
import type { AdminOverview, AffiliateProgram, Connection, ConnectionSource, ConnectionStatus, EventTag, GiftEvent, GiftEventType, GiftGroup, GiftGroupMember, GiftItem, GroupLabel, Profile, RecommendedProduct, Reservation, SharedWishlist, User, WishlistShare } from "./types";

type DbGift = Awaited<ReturnType<typeof prisma.giftItem.findFirst>>;
type DbProfile = Awaited<ReturnType<typeof prisma.profile.findFirst>>;
type DbReservation = Awaited<ReturnType<typeof prisma.reservation.findFirst>>;
type DbConnection = Awaited<ReturnType<typeof prisma.connection.findFirst>>;
type DbGiftGroup = NonNullable<Awaited<ReturnType<typeof prisma.giftGroup.findFirst>>> & { members?: NonNullable<Awaited<ReturnType<typeof prisma.giftGroupMember.findFirst>>>[] };
type DbGiftGroupMember = Awaited<ReturnType<typeof prisma.giftGroupMember.findFirst>>;
type DbWishlistShare = NonNullable<Awaited<ReturnType<typeof prisma.wishlistShare.findFirst>>> & {
  exclusions?: { connectionId: string }[];
};
type DbGiftEvent = Awaited<ReturnType<typeof prisma.giftEvent.findFirst>>;
type DbRecommendedProduct = Awaited<ReturnType<typeof prisma.recommendedProduct.findFirst>>;
type DbAffiliateProgram = Awaited<ReturnType<typeof prisma.affiliateProgram.findFirst>>;

const eventToDb: Record<EventTag, string> = {
  Birthday: "Birthday",
  Christmas: "Christmas",
  Wedding: "Wedding",
  "Baby Shower": "Baby_Shower",
  Housewarming: "Housewarming",
  Graduation: "Graduation",
  "General Wishlist": "General_Wishlist",
  Custom: "Custom"
};

const eventFromDb: Record<string, EventTag> = {
  Birthday: "Birthday",
  Christmas: "Christmas",
  Wedding: "Wedding",
  Baby_Shower: "Baby Shower",
  Housewarming: "Housewarming",
  Graduation: "Graduation",
  General_Wishlist: "General Wishlist",
  Custom: "Custom"
};

function dateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "profile"
  );
}

function assertSafeSlug(value: string) {
  const slug = slugify(value);
  if (slug.length < 3 || slug.length > 48) throw new Error("INVALID_SLUG");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("INVALID_SLUG");
  return slug;
}

async function uniqueProfileSlug(base: string, userId: string) {
  const cleanBase = slugify(base);
  const suffix = userId.slice(-6).toLowerCase();
  let candidate = `${cleanBase}-${suffix}`;
  let index = 2;

  while (await prisma.profile.findUnique({ where: { slug: candidate } })) {
    candidate = `${cleanBase}-${suffix}-${index}`;
    index += 1;
  }

  return candidate;
}

export function toProfile(profile: NonNullable<DbProfile>): Profile {
  return {
    id: profile.id,
    ownerUserId: profile.ownerUserId,
    linkedUserId: profile.linkedUserId ?? undefined,
    displayName: profile.displayName,
    slug: profile.slug,
    relationship: profile.relationship,
    photoUrl: profile.photoUrl ?? undefined,
    bio: profile.bio,
    birthday: profile.birthday ? dateString(profile.birthday) : undefined,
    anniversary: profile.anniversary ? dateString(profile.anniversary) : undefined,
    primaryEventType: profile.primaryEventType ?? undefined,
    listVisibility: profile.listVisibility === "shared" ? "shared" : "private",
    isPrimary: profile.isPrimary,
    isManagedProfile: profile.isManagedProfile,
    createdAt: dateString(profile.createdAt),
    updatedAt: dateString(profile.updatedAt)
  };
}

export function toConnection(connection: NonNullable<DbConnection>): Connection {
  return {
    id: connection.id,
    requesterUserId: connection.requesterUserId,
    targetUserId: connection.targetUserId ?? undefined,
    managedProfileId: connection.managedProfileId ?? undefined,
    realName: connection.realName ?? undefined,
    displayName: connection.displayName ?? undefined,
    relationshipType: connection.relationshipType ?? undefined,
    emailOrPhone: connection.emailOrPhone ?? undefined,
    status: connection.status as Connection["status"],
    source: connection.source as ConnectionSource,
    groupLabel: connection.groupLabel as GroupLabel,
    customGroupLabel: connection.customGroupLabel ?? undefined,
    createdAt: dateString(connection.createdAt),
    updatedAt: dateString(connection.updatedAt)
  };
}

export function toGiftGroupMember(member: NonNullable<DbGiftGroupMember>): GiftGroupMember {
  return {
    id: member.id,
    groupId: member.groupId,
    connectionId: member.connectionId ?? undefined,
    connectedUserId: member.connectedUserId ?? undefined,
    pendingEmailOrPhone: member.pendingEmailOrPhone ?? undefined,
    status: member.status as GiftGroupMember["status"],
    createdAt: dateString(member.createdAt),
    updatedAt: dateString(member.updatedAt)
  };
}

export function toGiftGroup(group: DbGiftGroup): GiftGroup {
  return {
    id: group.id,
    ownerUserId: group.ownerUserId,
    name: group.name,
    members: (group.members ?? []).map(toGiftGroupMember),
    createdAt: dateString(group.createdAt),
    updatedAt: dateString(group.updatedAt)
  };
}

export function toWishlistShare(share: DbWishlistShare): WishlistShare {
  return {
    id: share.id,
    ownerUserId: share.ownerUserId,
    profileId: share.profileId,
    connectionId: share.connectionId ?? undefined,
    groupId: share.groupId ?? undefined,
    accessLevel: share.accessLevel,
    excludedConnectionIds: (share.exclusions ?? []).map((exclusion) => exclusion.connectionId),
    createdAt: dateString(share.createdAt),
    updatedAt: dateString(share.updatedAt)
  };
}

export function toGiftEvent(event: NonNullable<DbGiftEvent>): GiftEvent {
  return {
    id: event.id,
    ownerUserId: event.ownerUserId,
    profileId: event.profileId ?? undefined,
    title: event.title,
    eventType: event.eventType as GiftEventType,
    eventDate: event.eventDate ? dateString(event.eventDate) : undefined,
    groupLabel: event.groupLabel ? (event.groupLabel as GroupLabel) : undefined,
    customGroupLabel: event.customGroupLabel ?? undefined,
    notes: event.notes,
    createdAt: dateString(event.createdAt),
    updatedAt: dateString(event.updatedAt)
  };
}

export function toGift(gift: NonNullable<DbGift>): GiftItem {
  return {
    id: gift.id,
    profileId: gift.profileId,
    createdByUserId: gift.createdByUserId,
    title: gift.title,
    productUrl: gift.productUrl,
    originalUrl: gift.originalUrl,
    affiliateUrl: gift.affiliateUrl ?? undefined,
    monetizedUrl: gift.monetizedUrl,
    affiliateStatus: gift.affiliateStatus as GiftItem["affiliateStatus"],
    storeName: gift.storeName,
    imageUrl: gift.imageUrl,
    price: gift.price,
    originalPrice: gift.originalPrice ?? undefined,
    currentPrice: gift.currentPrice ?? undefined,
    shippingCost: gift.shippingCost ?? undefined,
    estimatedTotalCost: gift.estimatedTotalCost ?? undefined,
    priceSourceUrl: gift.priceSourceUrl ?? undefined,
    bestFoundPrice: gift.bestFoundPrice ?? undefined,
    bestFoundTotalCost: gift.bestFoundTotalCost ?? undefined,
    bestFoundStoreName: gift.bestFoundStoreName ?? undefined,
    priceLastCheckedAt: gift.priceLastCheckedAt ? dateString(gift.priceLastCheckedAt) : undefined,
    currency: gift.currency,
    notes: gift.notes,
    eventTag: eventFromDb[gift.eventTag] ?? "General Wishlist",
    customEventTag: gift.customEventTag ?? undefined,
    wantRating: Math.min(5, Math.max(1, gift.wantRating)) as GiftItem["wantRating"],
    visibility: gift.visibility as GiftItem["visibility"],
    hiddenFromRecipient: gift.hiddenFromRecipient,
    allowContributions: gift.allowContributions,
    fundingGoalAmount: gift.fundingGoalAmount,
    currentContributionAmount: gift.currentContributionAmount,
    reservedStatus: gift.reservedStatus as GiftItem["reservedStatus"],
    reservedBy: gift.reservedBy ?? undefined,
    reservedByUserId: gift.reservedByUserId ?? undefined,
    purchasedStatus: gift.purchasedStatus,
    purchasedByUserId: gift.purchasedByUserId ?? undefined,
    createdAt: dateString(gift.createdAt),
    updatedAt: dateString(gift.updatedAt)
  };
}

export function toReservation(reservation: NonNullable<DbReservation>): Reservation {
  return {
    id: reservation.id,
    giftItemId: reservation.giftItemId,
    reserverName: reservation.reserverName,
    reserverEmail: reservation.reserverEmail ?? undefined,
    status: reservation.status as Reservation["status"],
    createdAt: dateString(reservation.createdAt),
    updatedAt: dateString(reservation.updatedAt)
  };
}

export function toRecommendedProduct(product: NonNullable<DbRecommendedProduct>): RecommendedProduct {
  return {
    id: product.id,
    createdByUserId: product.createdByUserId ?? undefined,
    title: product.title,
    description: product.description,
    imageUrl: product.imageUrl,
    originalUrl: product.originalUrl,
    affiliateUrl: product.affiliateUrl ?? undefined,
    affiliateProgram: product.affiliateProgram ?? undefined,
    affiliateStatus: product.affiliateStatus as RecommendedProduct["affiliateStatus"],
    affiliateNotes: product.affiliateNotes ?? undefined,
    price: product.price,
    currency: product.currency,
    storeName: product.storeName,
    category: product.category,
    tags: product.tags,
    targetAudienceNotes: product.targetAudienceNotes,
    active: product.active,
    featured: product.featured,
    hot: product.hot,
    seasonal: product.seasonal,
    createdAt: dateString(product.createdAt),
    updatedAt: dateString(product.updatedAt)
  };
}

export function toAffiliateProgram(program: NonNullable<DbAffiliateProgram>): AffiliateProgram {
  return {
    id: program.id,
    name: program.name,
    trackingId: program.trackingId,
    defaultDomain: program.defaultDomain,
    notes: program.notes,
    active: program.active,
    createdByUserId: program.createdByUserId ?? undefined,
    createdAt: dateString(program.createdAt),
    updatedAt: dateString(program.updatedAt)
  };
}

function giftToDb(gift: GiftItem, userId: string): Prisma.GiftItemUncheckedCreateInput {
  return {
    id: gift.id,
    profileId: gift.profileId,
    createdByUserId: userId,
    title: gift.title,
    productUrl: gift.productUrl,
    originalUrl: gift.originalUrl,
    affiliateUrl: gift.affiliateUrl ?? null,
    monetizedUrl: gift.monetizedUrl,
    affiliateStatus: gift.affiliateStatus,
    storeName: gift.storeName,
    imageUrl: gift.imageUrl,
    price: gift.price,
    originalPrice: gift.originalPrice ?? null,
    currentPrice: gift.currentPrice ?? null,
    shippingCost: gift.shippingCost ?? null,
    estimatedTotalCost: gift.estimatedTotalCost ?? null,
    priceSourceUrl: gift.priceSourceUrl ?? null,
    bestFoundPrice: gift.bestFoundPrice ?? null,
    bestFoundTotalCost: gift.bestFoundTotalCost ?? null,
    bestFoundStoreName: gift.bestFoundStoreName ?? null,
    priceLastCheckedAt: gift.priceLastCheckedAt ? new Date(gift.priceLastCheckedAt) : null,
    currency: gift.currency,
    notes: gift.notes,
    eventTag: eventToDb[gift.eventTag] as DbEventTag,
    customEventTag: gift.customEventTag ?? null,
    wantRating: gift.wantRating,
    visibility: gift.visibility,
    hiddenFromRecipient: gift.hiddenFromRecipient,
    allowContributions: gift.allowContributions,
    fundingGoalAmount: gift.fundingGoalAmount,
    currentContributionAmount: gift.currentContributionAmount,
    reservedStatus: gift.reservedStatus,
    reservedBy: gift.reservedBy ?? null,
    reservedByUserId: gift.reservedByUserId ?? null,
    purchasedStatus: gift.purchasedStatus,
    purchasedByUserId: gift.purchasedByUserId ?? null,
    createdAt: new Date(gift.createdAt),
    updatedAt: new Date(gift.updatedAt)
  };
}

function spoilerSafeOwnerGift(gift: GiftItem, ownerUserId: string): GiftItem {
  const reservedByOtherUser = Boolean(gift.reservedByUserId && gift.reservedByUserId !== ownerUserId);
  const purchasedByOtherUser = Boolean(gift.purchasedByUserId && gift.purchasedByUserId !== ownerUserId);
  if (!reservedByOtherUser && !purchasedByOtherUser) return gift;
  return {
    ...gift,
    reservedStatus: reservedByOtherUser ? "available" : gift.reservedStatus,
    reservedBy: reservedByOtherUser ? undefined : gift.reservedBy,
    reservedByUserId: reservedByOtherUser ? undefined : gift.reservedByUserId,
    purchasedStatus: purchasedByOtherUser ? false : gift.purchasedStatus,
    purchasedByUserId: purchasedByOtherUser ? undefined : gift.purchasedByUserId
  };
}

function publicFacingGift(gift: GiftItem): GiftItem {
  return {
    ...gift,
    storeName: "",
    priceSourceUrl: undefined
  };
}

export function toSafeUser(user: { id: string; email: string; name: string; isAdmin?: boolean; onboardingCompleted?: boolean; createdAt: Date | string; updatedAt: Date | string }): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: dateString(user.createdAt),
    updatedAt: dateString(user.updatedAt)
  };
}

function normalizeRecommendedProductInput(input: Partial<RecommendedProduct>, userId: string): Prisma.RecommendedProductUncheckedCreateInput {
  const stamp = new Date();
  return {
    id: input.id || `recommended_${randomUUID()}`,
    createdByUserId: userId,
    title: input.title?.trim() || "Untitled gift idea",
    description: input.description?.trim() || "",
    imageUrl: input.imageUrl?.trim() || "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
    originalUrl: input.originalUrl?.trim() || "",
    affiliateUrl: input.affiliateUrl?.trim() || null,
    affiliateProgram: input.affiliateProgram?.trim() || null,
    affiliateStatus: input.affiliateStatus || "none",
    affiliateNotes: input.affiliateNotes?.trim() || null,
    price: Number.isFinite(Number(input.price)) ? Number(input.price) : 0,
    currency: input.currency?.trim().toUpperCase() || "",
    storeName: input.storeName?.trim() || "Curated source",
    category: input.category?.trim() || "General",
    tags: input.tags?.trim() || "",
    targetAudienceNotes: input.targetAudienceNotes?.trim() || "",
    active: input.active ?? true,
    featured: input.featured ?? false,
    hot: input.hot ?? false,
    seasonal: input.seasonal ?? false,
    createdAt: input.createdAt ? new Date(input.createdAt) : stamp,
    updatedAt: stamp
  };
}

async function getActiveAmazonTrackingTag() {
  const program = await prisma.affiliateProgram.findFirst({
    where: {
      active: true,
      name: { contains: "Amazon" },
      trackingId: { not: "" }
    },
    orderBy: { updatedAt: "desc" }
  });
  return program?.trackingId ?? "";
}

function normalizeAffiliateProgramInput(input: Partial<AffiliateProgram>, userId: string): Prisma.AffiliateProgramUncheckedCreateInput {
  const stamp = new Date();
  return {
    id: input.id || `affiliate_${randomUUID()}`,
    name: input.name?.trim() || "Amazon Associates",
    trackingId: input.trackingId?.trim() || "",
    defaultDomain: input.defaultDomain?.trim() || "amazon.com",
    notes: input.notes?.trim() || "",
    active: input.active ?? true,
    createdByUserId: userId,
    createdAt: input.createdAt ? new Date(input.createdAt) : stamp,
    updatedAt: stamp
  };
}

export async function ownsProfile(userId: string, profileId: string) {
  const count = await prisma.profile.count({ where: { id: profileId, ownerUserId: userId } });
  return count === 1;
}

export async function ownsGift(userId: string, giftId: string) {
  const count = await prisma.giftItem.count({ where: { id: giftId, profile: { ownerUserId: userId } } });
  return count === 1;
}

async function ensureDefaultGiftGroups(userId: string) {
  const stamp = new Date();
  await Promise.all(
    ["Family", "Friends"].map((name) =>
      prisma.giftGroup.upsert({
        where: { ownerUserId_name: { ownerUserId: userId, name } },
        create: {
          id: `group_${randomUUID()}`,
          ownerUserId: userId,
          name,
          createdAt: stamp,
          updatedAt: stamp
        },
        update: {}
      })
    )
  );
}

export async function getOwnerStore(user: User) {
  await ensureDefaultGiftGroups(user.id);

  const [profiles, gifts, reservations, connections, events, groups, wishlistShares, sharedWishlists] = await Promise.all([
    prisma.profile.findMany({ where: { ownerUserId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] }),
    prisma.giftItem.findMany({
      where: { profile: { ownerUserId: user.id } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.reservation.findMany({
      where: { giftItem: { profile: { ownerUserId: user.id } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.connection.findMany({
      where: {
        OR: [{ requesterUserId: user.id }, { targetUserId: user.id }]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.giftEvent.findMany({
      where: { ownerUserId: user.id },
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }]
    }),
    prisma.giftGroup.findMany({
      where: { ownerUserId: user.id },
      include: { members: true },
      orderBy: [{ name: "asc" }]
    }),
    prisma.wishlistShare.findMany({
      where: { ownerUserId: user.id },
      include: { exclusions: true },
      orderBy: { createdAt: "desc" }
    }),
    getSharedWishlistsForUser(user)
  ]);

  return {
    user,
    profiles: profiles.map(toProfile),
    gifts: gifts.map(toGift).map((gift) => spoilerSafeOwnerGift(gift, user.id)),
    reservations: reservations.map(toReservation),
    connections: connections.map(toConnection),
    events: events.map(toGiftEvent),
    groups: groups.map(toGiftGroup),
    wishlistShares: wishlistShares.map(toWishlistShare),
    sharedWishlists
  };
}

export async function getSharedWishlistsForUser(user: User): Promise<SharedWishlist[]> {
  const inboundConnections = await prisma.connection.findMany({
    where: {
      targetUserId: user.id,
      status: "ACCEPTED"
    },
    select: { id: true }
  });
  const connectionIds = inboundConnections.map((connection) => connection.id);

  const groupMembers = await prisma.giftGroupMember.findMany({
    where: {
      connectedUserId: user.id,
      status: "ACCEPTED"
    },
    select: { groupId: true, connectionId: true }
  });
  const groupIds = Array.from(new Set(groupMembers.map((member) => member.groupId)));
  const viewerConnectionIds = Array.from(new Set([...connectionIds, ...groupMembers.map((member) => member.connectionId).filter((id): id is string => Boolean(id))]));

  if (!viewerConnectionIds.length && !groupIds.length) return [];

  const shares = await prisma.wishlistShare.findMany({
    where: {
      OR: [
        viewerConnectionIds.length ? { connectionId: { in: viewerConnectionIds } } : undefined,
        groupIds.length ? { groupId: { in: groupIds } } : undefined
      ].filter(Boolean) as Prisma.WishlistShareWhereInput[],
      exclusions: viewerConnectionIds.length
        ? {
            none: {
              connectionId: { in: viewerConnectionIds }
            }
          }
        : undefined
    },
    include: {
      profile: {
        include: {
          owner: true,
          gifts: {
            where: { hiddenFromRecipient: false },
            orderBy: [{ wantRating: "desc" }, { createdAt: "desc" }]
          }
        }
      },
      exclusions: true
    },
    orderBy: { createdAt: "desc" }
  });

  const byProfile = new Map<string, SharedWishlist>();
  for (const share of shares) {
    if (share.profile.ownerUserId === user.id) continue;
    if (byProfile.has(share.profileId)) continue;
    byProfile.set(share.profileId, {
      shareId: share.id,
      ownerUserId: share.ownerUserId,
      ownerName: share.profile.owner.name,
      profile: toProfile(share.profile),
      gifts: share.profile.gifts.map(toGift).map(publicFacingGift)
    });
  }

  return Array.from(byProfile.values());
}

function normalizeGiftEventType(value?: GiftEventType | string): GiftEventType {
  if (value === "ANNIVERSARY" || value === "WEDDING" || value === "BABY_SHOWER" || value === "HOLIDAY" || value === "CUSTOM") return value;
  return "BIRTHDAY";
}

export async function createGiftEvent(
  user: User,
  input: {
    title: string;
    eventType?: GiftEventType;
    eventDate?: string;
    profileId?: string;
    groupLabel?: GroupLabel;
    customGroupLabel?: string;
    notes?: string;
  }
) {
  if (input.profileId && !(await ownsProfile(user.id, input.profileId))) throw new Error("FORBIDDEN");
  const stamp = new Date();
  const event = await prisma.giftEvent.create({
    data: {
      id: `event_${randomUUID()}`,
      ownerUserId: user.id,
      profileId: input.profileId || null,
      title: input.title.trim() || "Gift planning event",
      eventType: normalizeGiftEventType(input.eventType) as DbGiftEventType,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      groupLabel: input.groupLabel ? (input.groupLabel as DbGroupLabel) : null,
      customGroupLabel: input.customGroupLabel || null,
      notes: input.notes?.trim() || "",
      createdAt: stamp,
      updatedAt: stamp
    }
  });

  return toGiftEvent(event);
}

export async function completeOnboarding(user: User) {
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: true }
  });
  return toSafeUser(updated);
}

export async function createManagedProfile(
  user: User,
  input: Pick<Profile, "displayName" | "relationship" | "bio" | "photoUrl" | "birthday" | "anniversary"> & {
    groupLabel?: GroupLabel;
    customGroupLabel?: string;
    listVisibility?: "private" | "shared";
  }
) {
  const stamp = new Date();
  const slug = await uniqueProfileSlug(input.displayName, user.id);
  const profile = await prisma.profile.create({
    data: {
      id: `profile_${randomUUID()}`,
      ownerUserId: user.id,
      linkedUserId: null,
      displayName: input.displayName,
      slug,
      relationship: input.relationship,
      photoUrl: input.photoUrl || null,
      bio: input.bio,
      birthday: input.birthday ? new Date(input.birthday) : null,
      anniversary: input.anniversary ? new Date(input.anniversary) : null,
      primaryEventType: input.birthday ? "BIRTHDAY" : null,
      listVisibility: input.listVisibility === "shared" ? "shared" : "private",
      isPrimary: false,
      isManagedProfile: true,
      createdAt: stamp,
      updatedAt: stamp
    }
  });
  await prisma.connection.create({
    data: {
      id: `connection_${randomUUID()}`,
      requesterUserId: user.id,
      managedProfileId: profile.id,
      status: "ACCEPTED",
      groupLabel: (input.groupLabel ?? "FAMILY") as DbGroupLabel,
      customGroupLabel: input.customGroupLabel || null,
      createdAt: stamp,
      updatedAt: stamp
    }
  });
  return toProfile(profile);
}

export const createProfile = createManagedProfile;

export async function createPendingConnection(
  user: User,
  input: {
    realName?: string;
    displayName?: string;
    relationshipType?: string;
    emailOrPhone?: string;
    groupLabel?: GroupLabel;
    customGroupLabel?: string;
    groupId?: string;
    source?: ConnectionSource;
  }
) {
  const stamp = new Date();
  if (!input.emailOrPhone?.trim()) throw new Error("CONTACT_REQUIRED");
  const targetUser = input.emailOrPhone?.includes("@")
    ? await prisma.user.findUnique({ where: { email: input.emailOrPhone.trim().toLowerCase() } })
    : null;

  const connection = await prisma.connection.create({
    data: {
      id: `connection_${randomUUID()}`,
      requesterUserId: user.id,
      targetUserId: targetUser?.id ?? null,
      realName: input.realName?.trim() || null,
      displayName: input.displayName?.trim() || input.realName?.trim() || input.emailOrPhone?.trim() || null,
      relationshipType: input.relationshipType?.trim() || null,
      emailOrPhone: input.emailOrPhone?.trim() || null,
      status: targetUser ? "ACCEPTED" : "PENDING",
      source: (input.source ?? "MANUAL") as DbConnectionSource,
      groupLabel: (input.groupLabel ?? "FAMILY") as DbGroupLabel,
      customGroupLabel: input.customGroupLabel || null,
      createdAt: stamp,
      updatedAt: stamp
    }
  });

  if (input.groupId) {
    await addConnectionToGroup(user, {
      groupId: input.groupId,
      connectionId: connection.id,
      pendingEmailOrPhone: input.emailOrPhone,
      status: targetUser ? "ACCEPTED" : "PENDING"
    });
  }

  return toConnection(connection);
}

export async function createGiftGroup(user: User, input: { name: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("INVALID_GROUP");
  const stamp = new Date();
  const group = await prisma.giftGroup.upsert({
    where: { ownerUserId_name: { ownerUserId: user.id, name } },
    create: {
      id: `group_${randomUUID()}`,
      ownerUserId: user.id,
      name,
      createdAt: stamp,
      updatedAt: stamp
    },
    update: { updatedAt: stamp },
    include: { members: true }
  });
  return toGiftGroup(group);
}

export async function addConnectionToGroup(
  user: User,
  input: { groupId: string; connectionId?: string; pendingEmailOrPhone?: string; status?: ConnectionStatus }
) {
  const group = await prisma.giftGroup.findFirst({ where: { id: input.groupId, ownerUserId: user.id } });
  if (!group) throw new Error("FORBIDDEN");
  if (!input.connectionId && !input.pendingEmailOrPhone?.trim()) throw new Error("INVALID_GROUP_MEMBER");

  let connection: NonNullable<DbConnection> | null = null;
  if (input.connectionId) {
    connection = await prisma.connection.findFirst({
      where: {
        id: input.connectionId,
        requesterUserId: user.id
      }
    });
    if (!connection) throw new Error("FORBIDDEN");
  }

  const memberIdentityFilters = [
    input.connectionId ? { connectionId: input.connectionId } : undefined,
    input.pendingEmailOrPhone ? { pendingEmailOrPhone: input.pendingEmailOrPhone.trim() } : undefined
  ].filter(Boolean) as Prisma.GiftGroupMemberWhereInput[];

  const existing = await prisma.giftGroupMember.findFirst({
    where: {
      groupId: input.groupId,
      OR: memberIdentityFilters
    }
  });
  if (existing) return toGiftGroupMember(existing);

  const stamp = new Date();
  const member = await prisma.giftGroupMember.create({
    data: {
      id: `member_${randomUUID()}`,
      groupId: input.groupId,
      connectionId: connection?.id ?? null,
      connectedUserId: connection?.targetUserId ?? null,
      pendingEmailOrPhone: input.pendingEmailOrPhone?.trim() || connection?.emailOrPhone || null,
      status: (input.status ?? connection?.status ?? "PENDING") as DbConnectionStatus,
      createdAt: stamp,
      updatedAt: stamp
    }
  });
  return toGiftGroupMember(member);
}

export async function shareWishlist(user: User, input: { profileId: string; connectionId?: string; groupId?: string; excludedConnectionIds?: string[] }) {
  if (!(await ownsProfile(user.id, input.profileId))) throw new Error("FORBIDDEN");
  if (!input.connectionId && !input.groupId) throw new Error("INVALID_SHARE_TARGET");
  const excludedConnectionIds = Array.from(new Set((input.excludedConnectionIds ?? []).filter(Boolean)));

  if (input.connectionId) {
    const ownsConnection = await prisma.connection.count({ where: { id: input.connectionId, requesterUserId: user.id } });
    if (!ownsConnection) throw new Error("FORBIDDEN");
  }
  if (input.groupId) {
    const ownsGroup = await prisma.giftGroup.count({ where: { id: input.groupId, ownerUserId: user.id } });
    if (!ownsGroup) throw new Error("FORBIDDEN");
  }
  if (excludedConnectionIds.length) {
    const ownedExclusions = await prisma.connection.count({
      where: {
        requesterUserId: user.id,
        id: { in: excludedConnectionIds }
      }
    });
    if (ownedExclusions !== excludedConnectionIds.length) throw new Error("FORBIDDEN");
  }

  const existing = await prisma.wishlistShare.findFirst({
    where: {
      ownerUserId: user.id,
      profileId: input.profileId,
      connectionId: input.connectionId || null,
      groupId: input.groupId || null
    },
    include: { exclusions: true }
  });
  if (existing) {
    if (input.excludedConnectionIds) {
      await prisma.wishlistShareExclusion.deleteMany({ where: { shareId: existing.id } });
      if (excludedConnectionIds.length) {
        await prisma.wishlistShareExclusion.createMany({
          data: excludedConnectionIds.map((connectionId) => ({
            id: `share_exclusion_${randomUUID()}`,
            shareId: existing.id,
            connectionId
          }))
        });
      }
      const updated = await prisma.wishlistShare.findUnique({ where: { id: existing.id }, include: { exclusions: true } });
      if (updated) return toWishlistShare(updated);
    }
    return toWishlistShare(existing);
  }

  const stamp = new Date();
  const share = await prisma.wishlistShare.create({
    data: {
      id: `share_${randomUUID()}`,
      ownerUserId: user.id,
      profileId: input.profileId,
      connectionId: input.connectionId || null,
      groupId: input.groupId || null,
      accessLevel: "view",
      createdAt: stamp,
      updatedAt: stamp
    }
  });
  if (excludedConnectionIds.length) {
    await prisma.wishlistShareExclusion.createMany({
      data: excludedConnectionIds.map((connectionId) => ({
        id: `share_exclusion_${randomUUID()}`,
        shareId: share.id,
        connectionId
      }))
    });
    const shareWithExclusions = await prisma.wishlistShare.findUnique({ where: { id: share.id }, include: { exclusions: true } });
    if (shareWithExclusions) return toWishlistShare(shareWithExclusions);
  }
  return toWishlistShare({ ...share, exclusions: [] });
}

export async function deleteConnection(user: User, connectionId: string) {
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, requesterUserId: user.id }
  });
  if (!connection) throw new Error("FORBIDDEN");

  await prisma.$transaction([
    prisma.giftGroupMember.deleteMany({ where: { connectionId } }),
    prisma.connection.delete({ where: { id: connectionId } })
  ]);
}

export async function deleteGiftGroup(user: User, groupId: string) {
  const group = await prisma.giftGroup.findFirst({ where: { id: groupId, ownerUserId: user.id } });
  if (!group) throw new Error("FORBIDDEN");
  await prisma.giftGroup.delete({ where: { id: groupId } });
}

export async function removeConnectionFromGroup(user: User, groupId: string, memberId: string) {
  const member = await prisma.giftGroupMember.findFirst({
    where: {
      id: memberId,
      groupId,
      group: { ownerUserId: user.id }
    }
  });
  if (!member) throw new Error("FORBIDDEN");
  await prisma.giftGroupMember.delete({ where: { id: memberId } });
}

export async function updateMyProfile(
  user: User,
  profileId: string,
  input: { name?: string; birthday?: string; anniversary?: string; photoUrl?: string; slug?: string }
) {
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      ownerUserId: user.id,
      linkedUserId: user.id,
      isPrimary: true,
      isManagedProfile: false
    }
  });
  if (!profile) throw new Error("FORBIDDEN");

  const nextSlug = typeof input.slug === "string" && input.slug.trim() ? assertSafeSlug(input.slug) : profile.slug;
  if (nextSlug !== profile.slug) {
    const existing = await prisma.profile.findUnique({ where: { slug: nextSlug } });
    if (existing && existing.id !== profileId) throw new Error("SLUG_TAKEN");
  }

  const name = input.name?.trim() || profile.displayName;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { name }
    });
    return tx.profile.update({
      where: { id: profileId },
      data: {
        displayName: name,
        slug: nextSlug,
        photoUrl: input.photoUrl?.trim() || null,
        birthday: input.birthday ? new Date(input.birthday) : null,
        anniversary: input.anniversary ? new Date(input.anniversary) : null,
        primaryEventType: input.birthday ? "BIRTHDAY" : null
      }
    });
  });

  return toProfile(updated);
}

export async function acceptBubbleInvite(
  user: User,
  input: { ownerUserId: string; groupId?: string; wishlistId?: string }
) {
  if (!input.ownerUserId || input.ownerUserId === user.id) return null;

  const owner = await prisma.user.findUnique({ where: { id: input.ownerUserId } });
  if (!owner) throw new Error("INVITE_NOT_FOUND");

  const stamp = new Date();
  let connection = await prisma.connection.findFirst({
    where: {
      requesterUserId: input.ownerUserId,
      targetUserId: user.id
    }
  });

  if (!connection) {
    connection = await prisma.connection.create({
      data: {
        id: `connection_${randomUUID()}`,
        requesterUserId: input.ownerUserId,
        targetUserId: user.id,
        emailOrPhone: user.email,
        status: "ACCEPTED",
        source: "INVITE_LINK",
        groupLabel: "FRIENDS",
        createdAt: stamp,
        updatedAt: stamp
      }
    });
  } else if (connection.status !== "ACCEPTED") {
    connection = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        status: "ACCEPTED",
        targetUserId: user.id,
        updatedAt: stamp
      }
    });
  }

  if (input.groupId) {
    const group = await prisma.giftGroup.findFirst({
      where: { id: input.groupId, ownerUserId: input.ownerUserId }
    });
    if (group) {
      const existingMember = await prisma.giftGroupMember.findFirst({
        where: { groupId: group.id, connectionId: connection.id }
      });
      if (!existingMember) {
        await prisma.giftGroupMember.create({
          data: {
            id: `member_${randomUUID()}`,
            groupId: group.id,
            connectionId: connection.id,
            connectedUserId: user.id,
            pendingEmailOrPhone: user.email,
            status: "ACCEPTED",
            createdAt: stamp,
            updatedAt: stamp
          }
        });
      }
    }
  }

  if (input.wishlistId) {
    const wishlist = await prisma.profile.findFirst({
      where: { id: input.wishlistId, ownerUserId: input.ownerUserId }
    });
    if (wishlist) {
      const existingShare = await prisma.wishlistShare.findFirst({
        where: {
          ownerUserId: input.ownerUserId,
          profileId: wishlist.id,
          connectionId: connection.id
        }
      });
      if (!existingShare) {
        await prisma.wishlistShare.create({
          data: {
            id: `share_${randomUUID()}`,
            ownerUserId: input.ownerUserId,
            profileId: wishlist.id,
            connectionId: connection.id,
            accessLevel: "view",
            createdAt: stamp,
            updatedAt: stamp
          }
        });
      }
    }
  }

  return toConnection(connection);
}

export async function createDefaultProfile(user: User) {
  const stamp = new Date();
  const profile = await prisma.profile.create({
    data: {
      id: `profile_${randomUUID()}`,
      ownerUserId: user.id,
      linkedUserId: user.id,
      displayName: user.name,
      slug: await uniqueProfileSlug(user.name, user.id),
      relationship: "Me",
      photoUrl: null,
      bio: "",
      birthday: null,
      anniversary: null,
      primaryEventType: null,
      listVisibility: "shared",
      isPrimary: true,
      isManagedProfile: false,
      createdAt: stamp,
      updatedAt: stamp
    }
  });
  return toProfile(profile);
}

export async function updatePrimaryProfileVanitySlug(user: User, profileId: string, nextSlug: string) {
  const slug = assertSafeSlug(nextSlug);
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      ownerUserId: user.id,
      linkedUserId: user.id,
      isPrimary: true,
      isManagedProfile: false
    }
  });
  if (!profile) throw new Error("FORBIDDEN");

  const existing = await prisma.profile.findUnique({ where: { slug } });
  if (existing && existing.id !== profileId) throw new Error("SLUG_TAKEN");

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: { slug }
  });

  return toProfile(updated);
}

export async function updateProfileEvents(
  user: User,
  profileId: string,
  input: { birthday?: string; anniversary?: string }
) {
  if (!(await ownsProfile(user.id, profileId))) throw new Error("FORBIDDEN");

  const updated = await prisma.profile.update({
    where: { id: profileId },
    data: {
      birthday: input.birthday ? new Date(input.birthday) : null,
      anniversary: input.anniversary ? new Date(input.anniversary) : null,
      primaryEventType: input.birthday ? "BIRTHDAY" : null
    }
  });

  return toProfile(updated);
}

export async function upsertGift(user: User, gift: GiftItem) {
  if (!(await ownsProfile(user.id, gift.profileId))) throw new Error("FORBIDDEN");
  if (gift.id && (await prisma.giftItem.count({ where: { id: gift.id } })) > 0 && !(await ownsGift(user.id, gift.id))) {
    throw new Error("FORBIDDEN");
  }

  const sourceUrl = gift.productUrl || gift.originalUrl;
  const normalizedAmazonUrl = isAmazonUrl(sourceUrl) ? normalizeAmazonProductUrl(sourceUrl).url : undefined;
  const productUrl = normalizedAmazonUrl || gift.productUrl;
  const originalUrl = normalizedAmazonUrl || gift.originalUrl || productUrl;
  const conversion = normalizedAmazonUrl ? createAmazonAffiliateUrl(normalizedAmazonUrl, await getActiveAmazonTrackingTag()) : null;
  const affiliateUrl = conversion?.affiliateUrl || gift.affiliateUrl || undefined;
  const data = giftToDb(
    {
      ...gift,
      productUrl,
      originalUrl,
      affiliateUrl,
      monetizedUrl: affiliateUrl || gift.monetizedUrl || productUrl,
      affiliateStatus: conversion ? "converted" : gift.affiliateStatus
    },
    user.id
  );
  const { id: _id, profileId: _profileId, createdByUserId: _createdByUserId, createdAt: _createdAt, ...updateData } = data;
  const saved = await prisma.giftItem.upsert({
    where: { id: gift.id },
    create: data,
    update: updateData
  });
  return toGift(saved);
}

export async function deleteGift(user: User, id: string) {
  if (!(await ownsGift(user.id, id))) throw new Error("FORBIDDEN");
  await prisma.giftItem.delete({ where: { id } });
}

export async function getOwnedGiftDetail(user: User, id: string) {
  const gift = await prisma.giftItem.findFirst({
    where: {
      id,
      profile: { ownerUserId: user.id }
    },
    include: { profile: true }
  });
  if (!gift) return null;

  return {
    gift: spoilerSafeOwnerGift(toGift(gift), user.id),
    profile: toProfile(gift.profile)
  };
}

async function userCanAccessSharedProfile(user: User, profileId: string) {
  const inboundConnections = await prisma.connection.findMany({
    where: { targetUserId: user.id, status: "ACCEPTED" },
    select: { id: true }
  });
  const directConnectionIds = inboundConnections.map((connection) => connection.id);
  const groupMembers = await prisma.giftGroupMember.findMany({
    where: { connectedUserId: user.id, status: "ACCEPTED" },
    select: { groupId: true, connectionId: true }
  });
  const viewerConnectionIds = Array.from(new Set([...directConnectionIds, ...groupMembers.map((member) => member.connectionId).filter((id): id is string => Boolean(id))]));
  const groupIds = Array.from(new Set(groupMembers.map((member) => member.groupId)));

  if (!viewerConnectionIds.length && !groupIds.length) return false;

  const share = await prisma.wishlistShare.findFirst({
    where: {
      profileId,
      OR: [
        viewerConnectionIds.length ? { connectionId: { in: viewerConnectionIds } } : undefined,
        groupIds.length ? { groupId: { in: groupIds } } : undefined
      ].filter(Boolean) as Prisma.WishlistShareWhereInput[],
      exclusions: viewerConnectionIds.length
        ? {
            none: {
              connectionId: { in: viewerConnectionIds }
            }
          }
        : undefined
    }
  });

  return Boolean(share);
}

export async function getGiftDetailForViewer(user: User, id: string) {
  const gift = await prisma.giftItem.findFirst({
    where: { id },
    include: { profile: true }
  });
  if (!gift) return null;

  if (gift.profile.ownerUserId === user.id) {
    return {
      gift: spoilerSafeOwnerGift(toGift(gift), user.id),
      profile: toProfile(gift.profile),
      viewerRole: "owner" as const
    };
  }

  if (gift.hiddenFromRecipient || !(await userCanAccessSharedProfile(user, gift.profileId))) return null;

  return {
    gift: publicFacingGift(toGift(gift)),
    profile: toProfile(gift.profile),
    viewerRole: "shared" as const
  };
}

export async function updateSharedGiftPlan(user: User, giftId: string, action: "reserve" | "unreserve" | "purchase") {
  const gift = await prisma.giftItem.findFirst({
    where: { id: giftId },
    include: { profile: true }
  });
  if (!gift || gift.profile.ownerUserId === user.id || gift.hiddenFromRecipient) throw new Error("FORBIDDEN");
  if (!(await userCanAccessSharedProfile(user, gift.profileId))) throw new Error("FORBIDDEN");

  if (action === "reserve") {
    if (gift.purchasedStatus || (gift.reservedByUserId && gift.reservedByUserId !== user.id)) throw new Error("GIFT_UNAVAILABLE");
    const updated = await prisma.giftItem.update({
      where: { id: gift.id },
      data: {
        reservedStatus: "reserved",
        reservedBy: "Reserved",
        reservedByUserId: user.id,
        updatedAt: new Date()
      }
    });
    return publicFacingGift(toGift(updated));
  }

  if (action === "unreserve") {
    if (gift.reservedByUserId !== user.id) throw new Error("FORBIDDEN");
    const updated = await prisma.giftItem.update({
      where: { id: gift.id },
      data: {
        reservedStatus: "available",
        reservedBy: null,
        reservedByUserId: null,
        updatedAt: new Date()
      }
    });
    return publicFacingGift(toGift(updated));
  }

  if (gift.purchasedStatus || (gift.reservedByUserId && gift.reservedByUserId !== user.id)) throw new Error("GIFT_UNAVAILABLE");
  const updated = await prisma.giftItem.update({
    where: { id: gift.id },
    data: {
      reservedStatus: "reserved",
      reservedBy: "Reserved",
      reservedByUserId: user.id,
      purchasedStatus: true,
      purchasedByUserId: user.id,
      updatedAt: new Date()
    }
  });
  return publicFacingGift(toGift(updated));
}

export async function deleteProfile(user: User, profileId: string) {
  if (!(await ownsProfile(user.id, profileId))) throw new Error("FORBIDDEN");
  await prisma.profile.delete({ where: { id: profileId } });
}

export async function resetUserGiftlyData(user: User) {
  const ownedProfiles = await prisma.profile.findMany({
    where: { ownerUserId: user.id },
    select: { id: true }
  });
  const profileIds = ownedProfiles.map((profile) => profile.id);

  await prisma.$transaction([
    prisma.wishlistShare.deleteMany({
      where: { ownerUserId: user.id }
    }),
    prisma.giftGroupMember.deleteMany({
      where: { group: { ownerUserId: user.id } }
    }),
    prisma.giftGroup.deleteMany({
      where: { ownerUserId: user.id }
    }),
    prisma.giftEvent.deleteMany({
      where: { ownerUserId: user.id }
    }),
    prisma.contributionPlaceholder.deleteMany({
      where: { giftItem: { profileId: { in: profileIds } } }
    }),
    prisma.reservation.deleteMany({
      where: { giftItem: { profileId: { in: profileIds } } }
    }),
    prisma.giftItem.deleteMany({
      where: { profileId: { in: profileIds } }
    }),
    prisma.profile.deleteMany({
      where: { ownerUserId: user.id }
    })
  ]);

  await createDefaultProfile(user);
  return getOwnerStore(user);
}

export async function createReservation(giftId: string, reserverName: string, reserverEmail?: string) {
  const gift = await prisma.giftItem.findFirst({
    where: {
      id: giftId,
      visibility: "public",
      hiddenFromRecipient: false,
      purchasedStatus: false
    }
  });
  if (!gift) throw new Error("FORBIDDEN");

  const stamp = new Date();
  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: {
        id: `reservation_${crypto.randomUUID()}`,
        giftItemId: giftId,
        reserverName,
        reserverEmail: reserverEmail || null,
        status: "active",
        createdAt: stamp,
        updatedAt: stamp
      }
    }),
    prisma.giftItem.update({
      where: { id: giftId },
      data: { reservedStatus: "reserved", reservedBy: "Reserved", updatedAt: stamp }
    })
  ]);
  return toReservation(reservation);
}

export async function getPublicProfile(slug: string) {
  const profile = await prisma.profile.findUnique({ where: { slug } });
  if (!profile) return null;

  const gifts = await prisma.giftItem.findMany({
    where: {
      profileId: profile.id,
      visibility: "public",
      hiddenFromRecipient: false
    },
    orderBy: [{ wantRating: "desc" }, { createdAt: "desc" }]
  });

  return {
    profile: toProfile(profile),
    gifts: gifts.map(toGift).map(publicFacingGift)
  };
}

export async function listContributionPlaceholders(user: User, giftItemId?: string) {
  return prisma.contributionPlaceholder.findMany({
    where: giftItemId ? { giftItemId, giftItem: { profile: { ownerUserId: user.id } } } : { giftItem: { profile: { ownerUserId: user.id } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createContributionPlaceholder(user: User, input: {
  giftItemId: string;
  contributorName: string;
  contributorEmail?: string;
  amount: number;
}) {
  if (!(await ownsGift(user.id, input.giftItemId))) throw new Error("FORBIDDEN");
  return prisma.contributionPlaceholder.create({
    data: {
      id: `contribution_${crypto.randomUUID()}`,
      giftItemId: input.giftItemId,
      contributorName: input.contributorName,
      contributorEmail: input.contributorEmail || null,
      amount: input.amount,
      status: "placeholder"
    }
  });
}

export async function listActiveRecommendedProducts() {
  const products = await prisma.recommendedProduct.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { hot: "desc" }, { seasonal: "desc" }, { updatedAt: "desc" }],
    take: 9
  });
  return products.map(toRecommendedProduct);
}

export async function upsertRecommendedProduct(user: User, input: Partial<RecommendedProduct>) {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");
  const data = normalizeRecommendedProductInput(input, user.id);
  const normalizedAmazonUrl = isAmazonUrl(data.originalUrl) ? normalizeAmazonProductUrl(data.originalUrl).url : undefined;
  if (normalizedAmazonUrl) data.originalUrl = normalizedAmazonUrl;
  if (!shouldPreserveManualAffiliateUrl(data) && isAmazonUrl(data.originalUrl)) {
    const generated = createAmazonAffiliateUrl(data.originalUrl, await getActiveAmazonTrackingTag());
    if (generated) {
      data.originalUrl = generated.normalizedOriginalUrl;
      data.affiliateUrl = generated.affiliateUrl;
      data.affiliateProgram = data.affiliateProgram || "Amazon Associates";
      data.affiliateStatus = "matched";
    }
  }
  const { id, createdAt: _createdAt, createdByUserId: _createdByUserId, ...updateData } = data;
  const saved = await prisma.recommendedProduct.upsert({
    where: { id },
    create: data,
    update: updateData
  });
  return toRecommendedProduct(saved);
}

export async function deleteRecommendedProduct(user: User, id: string) {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");
  await prisma.recommendedProduct.delete({ where: { id } });
  return { ok: true };
}

export async function getAdminOverview(user: User): Promise<AdminOverview> {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");

  const [
    totalUsers,
    totalGifts,
    totalProfiles,
    recommendedProductCount,
    affiliateProgramCount,
    recommendedProducts,
    affiliatePrograms,
    allGifts,
    wishlists,
    users
  ] = await Promise.all([
    prisma.user.count(),
    prisma.giftItem.count(),
    prisma.profile.count(),
    prisma.recommendedProduct.count(),
    prisma.affiliateProgram.count(),
    prisma.recommendedProduct.findMany({
      orderBy: [{ active: "desc" }, { featured: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.affiliateProgram.findMany({
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.giftItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
      include: { profile: { include: { owner: true } } }
    }),
    prisma.profile.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 250,
      include: {
        owner: true,
        _count: { select: { gifts: true } }
      }
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            ownedProfiles: true,
            gifts: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const recommended = recommendedProducts.map(toRecommendedProduct);
  const missingAffiliateRecommended = recommended.filter((product) => !product.affiliateUrl);
  const giftsMissingAffiliate = allGifts.filter((gift) => !gift.affiliateUrl);
  const giftsWithAffiliate = allGifts.filter((gift) => gift.affiliateUrl).length;
  const productsWithAffiliateLinks = giftsWithAffiliate + recommended.filter((product) => Boolean(product.affiliateUrl)).length;
  const productsMissingAffiliateLinks = giftsMissingAffiliate.length + missingAffiliateRecommended.length;
  const addedMap = new Map<string, { title: string; storeName: string; count: number }>();

  for (const gift of allGifts) {
    const key = `${gift.title.toLowerCase()}|${gift.storeName.toLowerCase()}`;
    const current = addedMap.get(key) ?? { title: gift.title, storeName: gift.storeName, count: 0 };
    current.count += 1;
    addedMap.set(key, current);
  }

  return {
    currentUserId: user.id,
    metrics: {
      totalUsers,
      totalGifts,
      totalProfiles,
      recommendedProducts: recommendedProductCount,
      affiliatePrograms: affiliateProgramCount,
      productsWithAffiliateLinks,
      productsMissingAffiliateLinks
    },
    recommendedProducts: recommended,
    affiliatePrograms: affiliatePrograms.map(toAffiliateProgram),
    unmatchedGifts: giftsMissingAffiliate.slice(0, 20).map((gift) => ({
      id: gift.id,
      title: gift.title,
      storeName: gift.storeName,
      productUrl: gift.productUrl,
      affiliateUrl: gift.affiliateUrl ?? undefined,
      affiliateStatus: gift.affiliateStatus as GiftItem["affiliateStatus"],
      createdAt: dateString(gift.createdAt)
    })),
    mostAddedProducts: Array.from(addedMap.values()).sort((a, b) => b.count - a.count).slice(0, 8),
    wishlists: wishlists.map((profile) => ({
      id: profile.id,
      displayName: profile.displayName,
      slug: profile.slug,
      relationship: profile.relationship,
      listVisibility: profile.listVisibility === "shared" ? "shared" : "private",
      isPrimary: profile.isPrimary,
      createdAt: dateString(profile.createdAt),
      ownerName: profile.owner.name,
      ownerEmail: profile.owner.email,
      giftCount: profile._count.gifts
    })),
    gifts: allGifts.slice(0, 100).map((gift) => ({
      id: gift.id,
      title: gift.title,
      storeName: gift.storeName,
      price: gift.price,
      currency: gift.currency,
      visibility: gift.visibility as GiftItem["visibility"],
      affiliateUrl: gift.affiliateUrl ?? undefined,
      affiliateStatus: gift.affiliateStatus as GiftItem["affiliateStatus"],
      createdAt: dateString(gift.createdAt),
      wishlistTitle: gift.profile.displayName,
      ownerEmail: gift.profile.owner.email
    })),
    users: users.map((adminUser) => ({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      isAdmin: adminUser.isAdmin,
      profileCount: adminUser._count.ownedProfiles,
      giftCount: adminUser._count.gifts,
      createdAt: dateString(adminUser.createdAt)
    }))
  };
}

export async function upsertAffiliateProgram(user: User, input: Partial<AffiliateProgram>) {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");
  const data = normalizeAffiliateProgramInput(input, user.id);
  const { id, createdAt: _createdAt, createdByUserId: _createdByUserId, ...updateData } = data;
  const saved = await prisma.affiliateProgram.upsert({
    where: { id },
    create: data,
    update: updateData
  });
  return toAffiliateProgram(saved);
}

export async function deleteAffiliateProgram(user: User, id: string) {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");
  await prisma.affiliateProgram.delete({ where: { id } });
  return { ok: true };
}

export async function backfillAmazonAffiliateUrls(user: User) {
  if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");

  const trackingTag = await getActiveAmazonTrackingTag();
  if (!trackingTag) throw new Error("AFFILIATE_TAG_REQUIRED");

  const [gifts, recommendedProducts] = await Promise.all([
    prisma.giftItem.findMany({
      where: {
        affiliateUrl: null
      }
    }),
    prisma.recommendedProduct.findMany({
      where: {
        affiliateUrl: null
      }
    })
  ]);

  let giftsUpdated = 0;
  let recommendedUpdated = 0;

  for (const gift of gifts) {
    const sourceUrl = gift.originalUrl || gift.productUrl;
    if (!isAmazonUrl(sourceUrl)) continue;
    const conversion = createAmazonAffiliateUrl(sourceUrl, trackingTag);
    if (!conversion) continue;

    await prisma.giftItem.update({
      where: { id: gift.id },
      data: {
        productUrl: conversion.normalizedOriginalUrl,
        originalUrl: conversion.normalizedOriginalUrl,
        affiliateUrl: conversion.affiliateUrl,
        monetizedUrl: conversion.affiliateUrl,
        affiliateStatus: "converted"
      }
    });
    giftsUpdated += 1;
  }

  for (const product of recommendedProducts) {
    const sourceUrl = product.originalUrl;
    if (!isAmazonUrl(sourceUrl)) continue;
    const conversion = createAmazonAffiliateUrl(sourceUrl, trackingTag);
    if (!conversion) continue;

    await prisma.recommendedProduct.update({
      where: { id: product.id },
      data: {
        originalUrl: conversion.normalizedOriginalUrl,
        affiliateUrl: conversion.affiliateUrl,
        affiliateProgram: product.affiliateProgram || "Amazon Associates",
        affiliateStatus: "matched"
      }
    });
    recommendedUpdated += 1;
  }

  return {
    ok: true,
    giftsUpdated,
    recommendedUpdated,
    totalUpdated: giftsUpdated + recommendedUpdated
  };
}

export async function deleteAdminUser(admin: User, userId: string) {
  if (!userHasAdminAccess(admin)) throw new Error("FORBIDDEN");
  if (admin.id === userId) throw new Error("CANNOT_DELETE_SELF");
  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}
