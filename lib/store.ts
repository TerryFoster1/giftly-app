"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Connection, ConnectionSource, GiftEvent, GiftEventType, GiftGroup, GiftGroupMember, GiftItem, GroupLabel, Profile, Reservation, User, WishlistShare } from "./types";

type GiftlyStore = {
  user?: User;
  profiles: Profile[];
  gifts: GiftItem[];
  reservations: Reservation[];
  connections?: Connection[];
  groups?: GiftGroup[];
  wishlistShares?: WishlistShare[];
  events?: GiftEvent[];
};

export class SessionExpiredError extends Error {
  constructor(message = "Your session expired. Please log in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

const emptyStore: GiftlyStore = {
  profiles: [],
  gifts: [],
  reservations: []
};

function resolveClientApiUrl(url: string) {
  if (typeof window === "undefined") return url;

  const target = new URL(url, window.location.origin);
  if (target.origin !== window.location.origin) {
    throw new Error("Giftly tried to call an API route on a different domain. Please reload and try again.");
  }

  return `${target.pathname}${target.search}`;
}

function logClientApiRequest(url: string, credentials: RequestCredentials) {
  if (typeof window === "undefined") return;

  const target = new URL(url, window.location.origin);
  console.info("[client-api] request", {
    pageOrigin: window.location.origin,
    requestOrigin: target.origin,
    requestPath: target.pathname,
    credentials,
    visibleCookieNames: document.cookie
      .split(";")
      .map((part) => part.trim().split("=")[0])
      .filter(Boolean)
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const requestUrl = resolveClientApiUrl(url);
  logClientApiRequest(requestUrl, "include");

  const response = await fetch(requestUrl, {
    ...init,
    credentials: "include",
    mode: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const body = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new SessionExpiredError(body?.message ?? "Your session expired. Please log in again.");
  }
  if (!response.ok) throw new Error(body?.message ?? `Giftly request failed: ${response.status}`);
  return body as T;
}

export function useGiftlyStore() {
  const [store, setStore] = useState<GiftlyStore>(emptyStore);
  const [ready, setReady] = useState(false);
  const [actionError, setActionError] = useState("");

  async function runAction<T>(action: () => Promise<T>) {
    setActionError("");
    try {
      return await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setActionError(message);
      throw error;
    }
  }

  const refresh = useCallback(async () => {
    const nextStore = await requestJson<GiftlyStore>("/api/store");
    setStore(nextStore);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch((error) => {
      setActionError(error instanceof Error ? error.message : "Something went wrong.");
      setReady(true);
    });
  }, [refresh]);

  const actions = useMemo(
    () => ({
      async createProfile(profile: Pick<Profile, "displayName" | "relationship" | "bio" | "photoUrl" | "birthday" | "anniversary"> & { groupLabel?: GroupLabel; customGroupLabel?: string; listVisibility?: "private" | "shared" }) {
        return runAction(async () => {
          const created = await requestJson<Profile>("/api/profiles", {
            method: "POST",
            body: JSON.stringify(profile)
          });
          setStore((current) => ({ ...current, profiles: [...current.profiles, created] }));
          return created;
        });
      },
      async createConnection(input: { realName?: string; displayName?: string; relationshipType?: string; emailOrPhone?: string; groupLabel?: GroupLabel; customGroupLabel?: string; groupId?: string; source?: ConnectionSource }) {
        return runAction(async () => {
          const created = await requestJson<Connection>("/api/connections", {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({ ...current, connections: [created, ...(current.connections ?? [])] }));
          return created;
        });
      },
      async createGroup(input: { name: string }) {
        return runAction(async () => {
          const created = await requestJson<GiftGroup>("/api/groups", {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({ ...current, groups: [...(current.groups ?? []), created] }));
          return created;
        });
      },
      async addGroupMember(groupId: string, input: { connectionId?: string; pendingEmailOrPhone?: string }) {
        return runAction(async () => {
          const member = await requestJson<GiftGroupMember>(`/api/groups/${groupId}/members`, {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({
            ...current,
            groups: (current.groups ?? []).map((group) =>
              group.id === groupId ? { ...group, members: [member, ...group.members.filter((item) => item.id !== member.id)] } : group
            )
          }));
          return member;
        });
      },
      async removeGroupMember(groupId: string, memberId: string) {
        return runAction(async () => {
          await requestJson<{ ok: boolean }>(`/api/groups/${groupId}/members?memberId=${encodeURIComponent(memberId)}`, { method: "DELETE" });
          setStore((current) => ({
            ...current,
            groups: (current.groups ?? []).map((group) =>
              group.id === groupId ? { ...group, members: group.members.filter((member) => member.id !== memberId) } : group
            )
          }));
        });
      },
      async deleteGroup(groupId: string) {
        return runAction(async () => {
          await requestJson<{ ok: boolean }>(`/api/groups/${groupId}`, { method: "DELETE" });
          setStore((current) => ({
            ...current,
            groups: (current.groups ?? []).filter((group) => group.id !== groupId),
            wishlistShares: (current.wishlistShares ?? []).filter((share) => share.groupId !== groupId)
          }));
        });
      },
      async deleteConnection(connectionId: string) {
        return runAction(async () => {
          await requestJson<{ ok: boolean }>(`/api/connections/${connectionId}`, { method: "DELETE" });
          setStore((current) => ({
            ...current,
            connections: (current.connections ?? []).filter((connection) => connection.id !== connectionId),
            groups: (current.groups ?? []).map((group) => ({
              ...group,
              members: group.members.filter((member) => member.connectionId !== connectionId)
            })),
            wishlistShares: (current.wishlistShares ?? []).filter((share) => share.connectionId !== connectionId)
          }));
        });
      },
      async updateMyProfile(profileId: string, input: { name?: string; birthday?: string; anniversary?: string; photoUrl?: string; slug?: string }) {
        return runAction(async () => {
          const updated = await requestJson<Profile>(`/api/profiles/${profileId}`, {
            method: "PATCH",
            body: JSON.stringify({ ...input, mode: "my-profile" })
          });
          setStore((current) => ({
            ...current,
            user: current.user ? { ...current.user, name: updated.displayName } : current.user,
            profiles: current.profiles.map((profile) => (profile.id === updated.id ? updated : profile))
          }));
          return updated;
        });
      },
      async shareWishlist(input: { profileId: string; connectionId?: string; groupId?: string; excludedConnectionIds?: string[] }) {
        return runAction(async () => {
          const share = await requestJson<WishlistShare>("/api/wishlist-shares", {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({ ...current, wishlistShares: [share, ...(current.wishlistShares ?? []).filter((item) => item.id !== share.id)] }));
          return share;
        });
      },
      async updateVanityUrl(profileId: string, slug: string) {
        return runAction(async () => {
          const updated = await requestJson<Profile>(`/api/profiles/${profileId}`, {
            method: "PATCH",
            body: JSON.stringify({ slug })
          });
          setStore((current) => ({
            ...current,
            profiles: current.profiles.map((profile) => (profile.id === updated.id ? updated : profile))
          }));
          return updated;
        });
      },
      async updateProfileEvents(profileId: string, input: { birthday?: string; anniversary?: string }) {
        return runAction(async () => {
          const updated = await requestJson<Profile>(`/api/profiles/${profileId}`, {
            method: "PATCH",
            body: JSON.stringify(input)
          });
          setStore((current) => ({
            ...current,
            profiles: current.profiles.map((profile) => (profile.id === updated.id ? updated : profile))
          }));
          return updated;
        });
      },
      async saveGift(gift: GiftItem) {
        return runAction(async () => {
          const isExistingGift = store.gifts.some((item) => item.id === gift.id);
          const saved = await requestJson<GiftItem>(isExistingGift ? `/api/gifts/${gift.id}` : "/api/gifts", {
            method: isExistingGift ? "PUT" : "POST",
            body: JSON.stringify(gift)
          });
          setStore((current) => {
            const exists = current.gifts.some((item) => item.id === saved.id);
            return {
              ...current,
              gifts: exists
                ? current.gifts.map((item) => (item.id === saved.id ? saved : item))
                : [saved, ...current.gifts]
            };
          });
          return saved;
        });
      },
      async deleteGift(id: string) {
        return runAction(async () => {
          await requestJson<{ ok: boolean }>(`/api/gifts/${id}`, { method: "DELETE" });
          setStore((current) => ({
            ...current,
            gifts: current.gifts.filter((gift) => gift.id !== id),
            reservations: current.reservations.filter((reservation) => reservation.giftItemId !== id)
          }));
        });
      },
      async deleteProfile(id: string) {
        return runAction(async () => {
          await requestJson<{ ok: boolean }>(`/api/profiles/${id}`, { method: "DELETE" });
          setStore((current) => {
            const deletedGiftIds = new Set(current.gifts.filter((gift) => gift.profileId === id).map((gift) => gift.id));
            return {
              ...current,
              profiles: current.profiles.filter((profile) => profile.id !== id),
              gifts: current.gifts.filter((gift) => gift.profileId !== id),
              reservations: current.reservations.filter((reservation) => !deletedGiftIds.has(reservation.giftItemId)),
              wishlistShares: (current.wishlistShares ?? []).filter((share) => share.profileId !== id),
              events: (current.events ?? []).filter((event) => event.profileId !== id)
            };
          });
        });
      },
      async createEvent(input: { title: string; eventType?: GiftEventType; eventDate?: string; profileId?: string; groupLabel?: GroupLabel; customGroupLabel?: string; notes?: string }) {
        return runAction(async () => {
          const created = await requestJson<GiftEvent>("/api/events", {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({ ...current, events: [created, ...(current.events ?? [])] }));
          return created;
        });
      },
      async completeOnboarding() {
        return runAction(async () => {
          const updated = await requestJson<User>("/api/onboarding", { method: "POST" });
          setStore((current) => ({ ...current, user: updated }));
          return updated;
        });
      },
      async resetMyGiftlyData() {
        return runAction(async () => {
          const nextStore = await requestJson<GiftlyStore>("/api/account/reset", { method: "POST" });
          setStore(nextStore);
        });
      },
      async reserveGift(giftId: string, reserverName: string, reserverEmail?: string) {
        return runAction(async () => {
          const reservation = await requestJson<Reservation>("/api/reservations", {
            method: "POST",
            body: JSON.stringify({ giftId, reserverName, reserverEmail })
          });
          setStore((current) => ({
            ...current,
            gifts: current.gifts.map((gift) =>
              gift.id === giftId
                ? { ...gift, reservedStatus: "reserved", reservedBy: "Reserved", updatedAt: new Date().toISOString() }
                : gift
            ),
            reservations: [...current.reservations, reservation]
          }));
          return reservation;
        });
      },
      refresh
    }),
    [refresh, store.gifts]
  );

  return { ...store, ready, actionError, actions };
}
