import { EventTag as DbEventTag, GroupLabel as DbGroupLabel, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import type { Connection, EventTag, GiftItem, GroupLabel, Profile, Reservation, User } from "./types";

type DbGift = Awaited<ReturnType<typeof prisma.giftItem.findFirst>>;
type DbProfile = Awaited<ReturnType<typeof prisma.profile.findFirst>>;
type DbReservation = Awaited<ReturnType<typeof prisma.reservation.findFirst>>;
type DbConnection = Awaited<ReturnType<typeof prisma.connection.findFirst>>;

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

export function toSafeUser(user: { id: string; email: string; name: string; createdAt: Date | string; updatedAt: Date | string }): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: dateString(user.createdAt),
    updatedAt: dateString(user.updatedAt)
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
