import { randomUUID } from "crypto";
import type { Prisma, SecretSantaGiftActionType, SecretSantaJoinStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { generateSecretSantaDraw } from "./secret-santa-draw";
import { toGift, toProfile } from "./db";
import type { GiftItem, SecretSantaAssignmentDetail, SecretSantaEvent, SecretSantaGiftAction, SecretSantaParticipant, User } from "./types";

type DbSecretSantaEvent = Prisma.SecretSantaEventGetPayload<{
  include: {
    participants: true;
    assignments: true;
    giftActions: true;
  };
}>;

type DbSecretSantaParticipant = Prisma.SecretSantaParticipantGetPayload<Record<string, never>>;
type DbSecretSantaAssignment = Prisma.SecretSantaAssignmentGetPayload<Record<string, never>>;
type DbSecretSantaGiftAction = Prisma.SecretSantaGiftActionGetPayload<Record<string, never>>;

function dateString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function publicBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "");
}

export function secretSantaInvitePath(token: string) {
  return `/secret-santa/invite/${token}`;
}

export function secretSantaInviteUrl(token: string) {
  const base = publicBaseUrl();
  return `${base}${secretSantaInvitePath(token)}`;
}

function toParticipant(participant: DbSecretSantaParticipant): SecretSantaParticipant {
  return {
    id: participant.id,
    eventId: participant.eventId,
    userId: participant.userId ?? undefined,
    profileId: participant.profileId ?? undefined,
    invitedEmail: participant.invitedEmail ?? undefined,
    displayName: participant.displayName,
    joinStatus: participant.joinStatus,
    inviteToken: participant.inviteToken,
    createdAt: dateString(participant.createdAt),
    updatedAt: dateString(participant.updatedAt)
  };
}

function toAssignment(assignment: DbSecretSantaAssignment) {
  return {
    id: assignment.id,
    eventId: assignment.eventId,
    giverParticipantId: assignment.giverParticipantId,
    recipientParticipantId: assignment.recipientParticipantId,
    privateNote: assignment.privateNote,
    createdAt: dateString(assignment.createdAt),
    updatedAt: dateString(assignment.updatedAt)
  };
}

function toGiftAction(action: DbSecretSantaGiftAction): SecretSantaGiftAction {
  return {
    id: action.id,
    eventId: action.eventId,
    assignmentId: action.assignmentId,
    giftItemId: action.giftItemId,
    action: action.action,
    privateNote: action.privateNote,
    createdAt: dateString(action.createdAt),
    updatedAt: dateString(action.updatedAt)
  };
}

function toEvent(event: DbSecretSantaEvent, includeAssignments: boolean): SecretSantaEvent {
  return {
    id: event.id,
    organizerUserId: event.organizerUserId,
    title: event.title,
    occasionDate: event.occasionDate ? dateString(event.occasionDate) : undefined,
    spendingLimit: event.spendingLimit ?? undefined,
    rulesMessage: event.rulesMessage,
    shippingNotes: event.shippingNotes,
    status: event.status,
    inviteToken: event.inviteToken,
    participants: event.participants.map(toParticipant),
    assignments: includeAssignments ? event.assignments.map(toAssignment) : undefined,
    giftActions: includeAssignments ? event.giftActions.map(toGiftAction) : undefined,
    createdAt: dateString(event.createdAt),
    updatedAt: dateString(event.updatedAt)
  };
}

function primaryProfileForUser(userId: string) {
  return prisma.profile.findFirst({
    where: { ownerUserId: userId, isPrimary: true },
    orderBy: { createdAt: "asc" }
  });
}

async function findParticipantForUser(eventId: string, user: User) {
  return prisma.secretSantaParticipant.findFirst({
    where: {
      eventId,
      OR: [{ userId: user.id }, { invitedEmail: user.email.toLowerCase() }]
    }
  });
}

async function assertOrganizer(user: User, eventId: string) {
  const event = await prisma.secretSantaEvent.findFirst({ where: { id: eventId, organizerUserId: user.id } });
  if (!event) throw new Error("FORBIDDEN");
  return event;
}

export async function listSecretSantaEvents(user: User) {
  const events = await prisma.secretSantaEvent.findMany({
    where: {
      OR: [
        { organizerUserId: user.id },
        { participants: { some: { OR: [{ userId: user.id }, { invitedEmail: user.email.toLowerCase() }] } } }
      ]
    },
    include: { participants: true, assignments: true, giftActions: true },
    orderBy: { updatedAt: "desc" }
  });

  return events.map((event) => toEvent(event, event.organizerUserId === user.id));
}

export async function createSecretSantaEvent(
  user: User,
  input: { title?: string; occasionDate?: string; spendingLimit?: number | string; rulesMessage?: string; shippingNotes?: string }
) {
  const title = input.title?.trim();
  if (!title) throw new Error("SECRET_SANTA_INVALID_EVENT");
  const profile = await primaryProfileForUser(user.id);
  const stamp = new Date();
  const event = await prisma.secretSantaEvent.create({
    data: {
      id: `secret_santa_${randomUUID()}`,
      organizerUserId: user.id,
      title,
      occasionDate: input.occasionDate ? new Date(input.occasionDate) : null,
      spendingLimit: input.spendingLimit === "" || input.spendingLimit == null ? null : Number(input.spendingLimit),
      rulesMessage: input.rulesMessage?.trim() || "",
      shippingNotes: input.shippingNotes?.trim() || "",
      status: "open",
      inviteToken: randomUUID(),
      createdAt: stamp,
      updatedAt: stamp,
      participants: {
        create: {
          id: `secret_participant_${randomUUID()}`,
          userId: user.id,
          profileId: profile?.id ?? null,
          displayName: user.name,
          joinStatus: "accepted",
          inviteToken: randomUUID(),
          createdAt: stamp,
          updatedAt: stamp
        }
      }
    },
    include: { participants: true, assignments: true, giftActions: true }
  });
  return toEvent(event, true);
}

export async function getSecretSantaEvent(user: User, eventId: string) {
  const event = await prisma.secretSantaEvent.findFirst({
    where: {
      id: eventId,
      OR: [
        { organizerUserId: user.id },
        { participants: { some: { OR: [{ userId: user.id }, { invitedEmail: user.email.toLowerCase() }] } } }
      ]
    },
    include: { participants: true, assignments: true, giftActions: true }
  });
  if (!event) throw new Error("FORBIDDEN");
  return toEvent(event, event.organizerUserId === user.id);
}

export async function addSecretSantaParticipant(
  user: User,
  eventId: string,
  input: { connectionId?: string; profileId?: string; invitedEmail?: string; displayName?: string }
) {
  const event = await assertOrganizer(user, eventId);
  if (event.status === "drawn") throw new Error("SECRET_SANTA_DRAW_LOCKED");

  let targetUserId: string | null = null;
  let profileId: string | null = null;
  let invitedEmail = input.invitedEmail?.trim().toLowerCase() || null;
  let displayName = input.displayName?.trim() || invitedEmail || "Invited guest";

  if (input.connectionId) {
    const connection = await prisma.connection.findFirst({ where: { id: input.connectionId, requesterUserId: user.id } });
    if (!connection) throw new Error("FORBIDDEN");
    targetUserId = connection.targetUserId;
    invitedEmail = connection.emailOrPhone?.includes("@") ? connection.emailOrPhone.toLowerCase() : invitedEmail;
    displayName = connection.displayName || connection.realName || invitedEmail || displayName;
    const targetProfile = targetUserId
      ? await prisma.profile.findFirst({ where: { ownerUserId: targetUserId, isPrimary: true }, orderBy: { createdAt: "asc" } })
      : connection.managedProfileId
        ? await prisma.profile.findUnique({ where: { id: connection.managedProfileId } })
        : null;
    profileId = targetProfile?.id ?? null;
  }

  if (input.profileId) {
    const profile = await prisma.profile.findFirst({ where: { id: input.profileId, ownerUserId: user.id } });
    if (!profile) throw new Error("FORBIDDEN");
    profileId = profile.id;
    displayName = input.displayName?.trim() || profile.displayName;
  }

  const participant = await prisma.secretSantaParticipant.create({
    data: {
      id: `secret_participant_${randomUUID()}`,
      eventId,
      userId: targetUserId,
      profileId,
      invitedEmail,
      displayName,
      joinStatus: targetUserId ? "invited" : "invited",
      inviteToken: randomUUID()
    }
  });
  return toParticipant(participant);
}

export async function removeSecretSantaParticipant(user: User, eventId: string, participantId: string) {
  const event = await assertOrganizer(user, eventId);
  if (event.status === "drawn") throw new Error("SECRET_SANTA_DRAW_LOCKED");
  await prisma.secretSantaParticipant.deleteMany({ where: { id: participantId, eventId } });
  return { ok: true };
}

export async function respondToSecretSanta(user: User, eventId: string, participantId: string, status: SecretSantaJoinStatus) {
  if (status !== "accepted" && status !== "declined") throw new Error("SECRET_SANTA_INVALID_STATUS");
  const participant = await prisma.secretSantaParticipant.findFirst({
    where: { id: participantId, eventId, OR: [{ userId: user.id }, { invitedEmail: user.email.toLowerCase() }] }
  });
  if (!participant) throw new Error("FORBIDDEN");

  const profile = await primaryProfileForUser(user.id);
  const updated = await prisma.secretSantaParticipant.update({
    where: { id: participant.id },
    data: {
      userId: user.id,
      profileId: participant.profileId ?? profile?.id ?? null,
      joinStatus: status,
      updatedAt: new Date()
    }
  });
  return toParticipant(updated);
}

export async function joinSecretSantaByToken(user: User, token: string, status: SecretSantaJoinStatus = "accepted") {
  const participant = await prisma.secretSantaParticipant.findUnique({ where: { inviteToken: token } });
  if (!participant) throw new Error("SECRET_SANTA_INVITE_NOT_FOUND");
  return respondToSecretSanta(user, participant.eventId, participant.id, status);
}

export async function getSecretSantaInvite(user: User, token: string) {
  const participant = await prisma.secretSantaParticipant.findUnique({
    where: { inviteToken: token },
    include: { event: { include: { participants: true, assignments: true, giftActions: true } } }
  });
  if (!participant) throw new Error("SECRET_SANTA_INVITE_NOT_FOUND");
  return {
    participant: toParticipant(participant),
    event: toEvent(participant.event, participant.event.organizerUserId === user.id)
  };
}

export async function runSecretSantaDraw(user: User, eventId: string) {
  await assertOrganizer(user, eventId);
  const event = await prisma.secretSantaEvent.findUnique({
    where: { id: eventId },
    include: { participants: true, exclusions: true, assignments: true }
  });
  if (!event) throw new Error("FORBIDDEN");
  if (event.status === "drawn" || event.assignments.length) throw new Error("SECRET_SANTA_DRAW_LOCKED");
  const accepted = event.participants.filter((participant) => participant.joinStatus === "accepted");
  if (accepted.length < 3) throw new Error("SECRET_SANTA_MIN_PARTICIPANTS");

  const pairs = generateSecretSantaDraw({
    participantIds: accepted.map((participant) => participant.id),
    exclusions: event.exclusions.map((exclusion) => ({
      participantAId: exclusion.participantAId,
      participantBId: exclusion.participantBId
    }))
  });

  await prisma.$transaction(async (tx) => {
    await tx.secretSantaAssignment.deleteMany({ where: { eventId } });
    await tx.secretSantaAssignment.createMany({
      data: pairs.map((pair) => ({
        id: `secret_assignment_${randomUUID()}`,
        eventId,
        giverParticipantId: pair.giverParticipantId,
        recipientParticipantId: pair.recipientParticipantId,
        privateNote: ""
      }))
    });
    await tx.secretSantaEvent.update({ where: { id: eventId }, data: { status: "drawn", updatedAt: new Date() } });
  });
  return getSecretSantaEvent(user, eventId);
}

export async function resetSecretSantaDraw(user: User, eventId: string) {
  await assertOrganizer(user, eventId);
  await prisma.$transaction([
    prisma.secretSantaGiftAction.deleteMany({ where: { eventId } }),
    prisma.secretSantaAssignment.deleteMany({ where: { eventId } }),
    prisma.secretSantaEvent.update({ where: { id: eventId }, data: { status: "open", updatedAt: new Date() } })
  ]);
  return getSecretSantaEvent(user, eventId);
}

export async function getMySecretSantaAssignment(user: User, eventId: string): Promise<SecretSantaAssignmentDetail> {
  const participant = await findParticipantForUser(eventId, user);
  if (!participant || participant.joinStatus !== "accepted") throw new Error("FORBIDDEN");

  const assignment = await prisma.secretSantaAssignment.findUnique({
    where: { giverParticipantId: participant.id },
    include: {
      event: { include: { participants: true, assignments: true, giftActions: true } },
      recipientParticipant: { include: { profile: true } },
      giftActions: true
    }
  });
  if (!assignment) throw new Error("SECRET_SANTA_ASSIGNMENT_NOT_READY");

  const gifts: GiftItem[] = assignment.recipientParticipant.profileId
    ? (
        await prisma.giftItem.findMany({
          where: {
            profileId: assignment.recipientParticipant.profileId,
            hiddenFromRecipient: false,
            visibility: { in: ["public", "shared"] }
          },
          orderBy: [{ wantRating: "desc" }, { createdAt: "desc" }]
        })
      ).map(toGift)
    : [];

  return {
    event: toEvent(assignment.event, false),
    assignment: toAssignment(assignment),
    giver: toParticipant(participant),
    recipient: toParticipant(assignment.recipientParticipant),
    recipientProfile: assignment.recipientParticipant.profile ? toProfile(assignment.recipientParticipant.profile) : undefined,
    gifts,
    giftActions: assignment.giftActions.map(toGiftAction)
  };
}

export async function saveSecretSantaGiftAction(
  user: User,
  eventId: string,
  input: { giftItemId?: string; action?: SecretSantaGiftActionType; privateNote?: string; assignmentNote?: string }
) {
  const detail = await getMySecretSantaAssignment(user, eventId);
  if (input.assignmentNote !== undefined) {
    const updated = await prisma.secretSantaAssignment.update({
      where: { id: detail.assignment.id },
      data: { privateNote: input.assignmentNote, updatedAt: new Date() }
    });
    return { ...detail, assignment: toAssignment(updated) };
  }
  if (!input.giftItemId || (input.action !== "reserved" && input.action !== "purchased")) throw new Error("SECRET_SANTA_INVALID_GIFT_ACTION");
  const allowedGift = detail.gifts.some((gift) => gift.id === input.giftItemId);
  if (!allowedGift) throw new Error("FORBIDDEN");
  await prisma.secretSantaGiftAction.upsert({
    where: { assignmentId_giftItemId: { assignmentId: detail.assignment.id, giftItemId: input.giftItemId } },
    create: {
      id: `secret_gift_action_${randomUUID()}`,
      eventId,
      assignmentId: detail.assignment.id,
      giftItemId: input.giftItemId,
      action: input.action,
      privateNote: input.privateNote?.trim() || ""
    },
    update: {
      action: input.action,
      privateNote: input.privateNote?.trim() || "",
      updatedAt: new Date()
    }
  });
  return getMySecretSantaAssignment(user, eventId);
}
