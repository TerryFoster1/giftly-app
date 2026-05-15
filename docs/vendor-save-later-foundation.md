# Vendor QR and Save-Later Foundation

This is architecture planning only. Giftly is not building a vendor marketplace, payments, payouts, or checkout in this phase.

## Concept

Vendors could later create Giftly-linked product pages with QR codes. A shopper at a craft show, boutique, market, or local store could scan the QR code and save the product to a Giftly wishlist instead of buying immediately.

## Future Data Concepts

- `VendorAccount`: owner user, business name, public profile, support contact, active status.
- `VendorProduct`: vendor id, title, description, image, price, currency, source URL, QR slug, active status.
- `VendorProductSource`: source type such as craft show, store shelf, online catalog, or manual admin entry.
- `SaveLaterEvent`: user id, vendor product id, wishlist/profile id, saved timestamp, QR/source context.

## QR Flow

1. Vendor creates a product in Giftly.
2. Giftly generates a short QR URL.
3. Shopper scans QR.
4. Shopper can save the product to a wishlist, buy later, or share later.
5. Future analytics can show saves and downstream purchases without exposing private wishlist data.

## Boundaries

- Do not process payments yet.
- Do not build vendor payouts yet.
- Do not build marketplace checkout yet.
- Do not require vendors to connect store accounts yet.
- Do not expose a user's private wishlist saves to vendors.

## Future Integrations

- Marketplace checkout.
- Vendor inventory sync.
- Affiliate/network matching.
- QR campaign analytics.
- Local event or craft show collections.
