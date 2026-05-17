"use client";

export class ClientSessionExpiredError extends Error {
  constructor(message = "Your session expired. Please log in again.") {
    super(message);
    this.name = "ClientSessionExpiredError";
  }
}

export async function clientRequestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
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
  if (response.status === 401) throw new ClientSessionExpiredError(body?.message);
  if (!response.ok) throw new Error(body?.message ?? `Giftly request failed: ${response.status}`);
  return body as T;
}
