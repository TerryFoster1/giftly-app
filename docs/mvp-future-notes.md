# Giftly MVP Future Notes

These are intentionally future-facing notes. They are not part of the current MVP implementation.

## Notifications and Reminders

- Add birthday and event reminder jobs after event data is stable.
- Support email reminders first, then push notifications later.
- Keep reminder frequency user-controlled.

## Recommendation Engine

- Start with editorial/admin recommended products.
- Later add behavioral signals such as saved products, upcoming events, age ranges, and gift groups.
- Avoid claiming a recommendation is personalized until enough reliable data exists.

## AI Gifting Assistant

- Future assistant can help brainstorm gifts from recipient profile notes, event type, budget, and relationship.
- AI should never expose hidden/private wishlist data to unauthorized viewers.
- AI suggestions should link into admin-approved or affiliate-reviewed products when possible.

## Profile and Avatar Polish

- Add richer profile photos, avatars, color themes, and relationship context.
- Keep managed profiles clearly marked until ownership transfer/claiming exists.

## Secret Santa Fulfillment Workflow

- Future workflow can assign participants, hide buyers from recipients, and track purchased/reserved status surprise-safely.
- Do not build payment collection or fulfillment automation until core permissions are stronger.

## Auth Stabilization Checklist

- Verify `giftly_session` appears in browser cookies after login and signup.
- Verify authenticated API requests include cookies in Production and Preview.
- Keep `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and `ADMIN_EMAILS` environment-specific.
- Re-test gift save, profile save, admin access, and logout after auth changes.

## Affiliate Expansion

- Current MVP stores Amazon Associates tracking tags only and appends the `tag` query parameter for Amazon product URLs.
- Future support may include Amazon PA API, affiliate APIs, automated enrichment, AI affiliate matching, pricing sync, and multi-network support.
- Do not store affiliate account passwords or dashboard login credentials.
