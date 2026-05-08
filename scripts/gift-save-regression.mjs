import { randomUUID } from "node:crypto";

const baseUrl = process.env.GIFTLY_BASE_URL || "http://localhost:3000";
const email = process.env.GIFTLY_TEST_EMAIL;
const password = process.env.GIFTLY_TEST_PASSWORD;

if (!email || !password) {
  console.error("Set GIFTLY_TEST_EMAIL and GIFTLY_TEST_PASSWORD before running this check.");
  process.exit(1);
}

function cookieFrom(response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
  const sessionCookie = setCookies.find((cookie) => cookie.startsWith("giftly_session="));
  if (!sessionCookie) return "";
  return sessionCookie.split(";")[0];
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${path} failed: ${response.status} ${body?.message ?? ""}`.trim());
  }
  return { response, body };
}

const login = await request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
const cookie = cookieFrom(login.response);
if (!cookie) throw new Error("Login succeeded but no Giftly session cookie was returned.");

const store = await request("/api/store", { headers: { cookie } });
const profile = store.body.profiles?.[0];
if (!store.body.user || !profile) throw new Error("Logged-in store did not include a user and profile.");

const id = `gift_${randomUUID()}`;
const stamp = new Date().toISOString();
const gift = {
  id,
  profileId: profile.id,
  createdByUserId: store.body.user.id,
  title: `Giftly regression gift ${stamp}`,
  productUrl: "https://example.com/giftly-regression-gift",
  originalUrl: "https://example.com/giftly-regression-gift",
  monetizedUrl: "https://example.com/giftly-regression-gift",
  affiliateStatus: "not_checked",
  storeName: "Example",
  imageUrl: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
  price: 1,
  originalPrice: 1,
  currentPrice: 1,
  estimatedTotalCost: 1,
  currency: "",
  notes: "Regression check gift.",
  eventTag: "General Wishlist",
  wantRating: 3,
  visibility: "private",
  hiddenFromRecipient: false,
  allowContributions: false,
  fundingGoalAmount: 0,
  currentContributionAmount: 0,
  reservedStatus: "available",
  purchasedStatus: false,
  createdAt: stamp,
  updatedAt: stamp
};

await request("/api/gifts", {
  method: "POST",
  headers: { cookie },
  body: JSON.stringify(gift)
});

const refreshed = await request("/api/store", { headers: { cookie } });
if (!refreshed.body.user) throw new Error("Session was lost after saving a gift.");
if (!refreshed.body.gifts?.some((item) => item.id === id)) throw new Error("Saved gift was not returned by the dashboard store.");

if (process.env.GIFTLY_CLEANUP === "true") {
  await request(`/api/gifts/${id}`, {
    method: "DELETE",
    headers: { cookie }
  });
}

console.log("Gift save regression passed.");
