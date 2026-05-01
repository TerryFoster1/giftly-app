"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Connection, GiftItem, GroupLabel, Profile, Reservation, User } from "./types";

type GiftlyStore = {
  user?: User;
  profiles: Profile[];
  gifts: GiftItem[];
  reservations: Reservation[];
  connections?: Connection[];
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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
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
      async createProfile(profile: Pick<Profile, "displayName" | "relationship" | "bio" | "photoUrl" | "birthday" | "anniversary"> & { groupLabel?: GroupLabel; customGroupLabel?: string }) {
        return runAction(async () => {
          const created = await requestJson<Profile>("/api/profiles", {
            method: "POST",
            body: JSON.stringify(profile)
          });
          setStore((current) => ({ ...current, profiles: [...current.profiles, created] }));
          return created;
        });
      },
      async createConnection(input: { emailOrPhone?: string; groupLabel?: GroupLabel; customGroupLabel?: string }) {
        return runAction(async () => {
          const created = await requestJson<Connection>("/api/connections", {
            method: "POST",
            body: JSON.stringify(input)
          });
          setStore((current) => ({ ...current, connections: [created, ...(current.connections ?? [])] }));
          return created;
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
              reservations: current.reservations.filter((reservation) => !deletedGiftIds.has(reservation.giftItemId))
            };
          });
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
