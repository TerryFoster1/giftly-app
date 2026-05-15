import { EventTag as DbEventTag, GroupLabel as DbGroupLabel, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { userHasAdminAccess } from "./auth";
import { prisma } from "./prisma";
import type { AdminOverview, Connection, EventTag, GiftItem, GroupLabel, Profile, RecommendedProduct, Reservation, User } from "./types";

type DbGift = Awaited<ReturnType<typeof prisma.giftItem.findFirst>>;
type DbProfile = Awaited<ReturnType<typeof prisma.profile.findFirst>>;
type DbReservation = Awaited<ReturnType<typeof prisma.reservation.findFirst>>;
type DbConnection = Awaited<ReturnType<typeof prisma.connection.findFirst>>;
type DbRecommendedProduct = Awaited<ReturnType<typeof prisma.recommendedProduct.findFirst>>;

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
    emailOrPhone: connection.emailOrPhone ?? undefined,
    status: connection.status as Connection["status"],
    groupLabel: connection.groupLabel as GroupLabel,
    customGroupLabel: connection.customGroupLabel ?? undefined,
    createdAt: dateString(connection.createdAt),
    updatedAt: dateString(connection.updatedAt)
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
    purchasedStatus: gift.purchasedStatus,
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
    purchasedStatus: gift.purchasedStatus,
    createdAt: new Date(gift.createdAt),
    updatedAt: new Date(gift.updatedAt)
  };
}

export function toSafeUser(user: { id: string; email: string; name: string; isAdmin?: boolean; createdAt: Date | string; updatedAt: Date | string }): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
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

export async function ownsProfile(userId: string, profileId: string) {
  const count = await prisma.profile.count({ where: { id: profileId, ownerUserId: userId } });
  return count === 1;
}

export async function ownsGift(userId: string, giftId: string) {
  const count = await prisma.giftItem.count({ where: { id: giftId, profile: { ownerUserId: userId } } });
  return count === 1;
}

export async function getOwnerStore(user: User) {
  const [profiles, gifts, reservations, connections] = await Promise.all([
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
    })
  ]);

  return {
    user,
    profiles: profiles.map(toProfile),
    gifts: gifts.map(toGift),
    reservations: reservations.map(toReservation),
    connections: connections.map(toConnection)
  };
}

export async function createManagedProfile(
  user: User,
  input: Pick<Profile, "displayName" | "relationship" | "bio" | "photoUrl" | "birthday" | "anniversary"> & {
    groupLabel?: GroupLabel;
    customGroupLabel?: string;
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
  input: { emailOrPhone?: string; groupLabel?: GroupLabel; customGroupLabel?: string }
) {
  const stamp = new Date();
  const targetUser = input.emailOrPhone?.includes("@")
    ? await prisma.user.findUnique({ where: { email: input.emailOrPhone.trim().toLowerCase() } })
    : null;

  const connection = await prisma.connection.create({
    data: {
      id: `connection_${randomUUID()}`,
      requesterUserId: user.id,
      targetUserId: targetUser?.id ?? null,
      emailOrPhone: input.emailOrPhone?.trim() || null,
      status: "PENDING",
      groupLabel: (input.groupLabel ?? "FAMILY") as DbGroupLabel,
      customGroupLabel: input.customGroupLabel || null,
      createdAt: stamp,
      updatedAt: stamp
    }
  });

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

  const data = giftToDb(gift, user.id);
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
    gift: toGift(gift),
    profile: toProfile(gift.profile)
  };
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
      hiddenFromRecipient: false,
      purchasedStatus: false
    },
    orderBy: [{ wantRating: "desc" }, { createdAt: "desc" }]
  });

  return {
    profile: toProfile(profile),
    gifts: gifts.map(toGift)
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
    recommendedProducts,
    allGifts,
    users
  ] = await Promise.all([
    prisma.user.count(),
    prisma.giftItem.count(),
    prisma.profile.count(),
    prisma.recommendedProduct.count(),
    prisma.recommendedProduct.findMany({
      orderBy: [{ active: "desc" }, { featured: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.giftItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
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
    metrics: {
      totalUsers,
      totalGifts,
      totalProfiles,
      recommendedProducts: recommendedProductCount,
      productsWithAffiliateLinks,
      productsMissingAffiliateLinks
    },
    recommendedProducts: recommended,
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
