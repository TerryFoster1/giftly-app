# Giftly Commerce Prep Notes

Phase 1 keeps Giftly as a gift notepad and shared wishlist planner. These notes mark future product surfaces without building payments, carts, or affiliate automation yet.

## Affiliate URL Replacement

- Keep storing the original product URL on each gift item.
- Add affiliate matching later as a server-side step that can set `affiliateUrl` and `monetizedUrl`.
- Never replace the buyer-facing link with an affiliate URL if it creates a worse price or worse total landed cost.

## Admin Review Queue

- Add an admin view later for products/domains with `affiliateStatus = "not_checked"` or no affiliate match.
- Track store domains that appear frequently so outreach can be prioritized.
- Keep this separate from user-facing wishlist flows.

## Analytics Foundation

- Track product added, product viewed, buy button clicked, reserved, and marked purchased events later.
- Avoid showing surprise-sensitive purchase analytics to the list owner.
- Aggregate analytics should not expose gift giver identity without explicit surprise controls.

## Future Cart / Purchase Flow

- Product pages should keep store URLs behind a `Buy Now` action.
- A future cart can collect selected gifts, apply affiliate-safe links, and hand off to store checkout or a Giftly checkout.
- Co-pay and pooled payments should remain separate from this phase.

## Surprise Protection

- Purchased/reserved status should be configurable so gift givers can avoid spoiling the surprise.
- Future owner views may hide purchased details while still preventing duplicate buying for gift givers.

## Discovery and Buying-for-Others Foundation

- AI-assisted product recommendations should be an admin-reviewed discovery layer, not an automatic purchase flow.
- Recommended products should support curated collections such as birthdays, weddings, new parents, housewarming, and popular saves.
- Affiliate matching should happen after the product is saved or curated, with a clear fallback to the original merchant link.
- Popular product analytics should favor aggregate trends and avoid revealing surprise-sensitive activity to wishlist owners.
- Buy-for-others workflows should separate gift giver planning from recipient visibility, especially for reserved and purchased states.
- Shared events and gift groups should later support group-specific recommendations, but payments, carts, co-pay, and held funds remain out of this phase.

## Sharing and Growth Foundation

- Invites create pending connection records first; live email, SMS, and QR scanning can be added as delivery layers later.
- Group labels such as Wedding, Household, Kids, and Couples can use `customGroupLabel` until advanced group permissions need a richer model.
- Groups should eventually control wishlist visibility, event visibility, collaborative planning, and surprise-safe buying rules.
- Managed profiles should remain owned by the creator until a future claim/transfer flow verifies the joining person.
- Ownership transfer should be explicit, auditable, and reversible only through support/admin tools if a claim is disputed.
- Growth prompts should be placed where they help the user finish a gifting task, not as repeated referral banners.
