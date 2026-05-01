export type PriceCandidate = {
  storeName: string;
  productPrice: number;
  shippingCost: number;
  url: string;
  affiliateUrl?: string;
};

export function calculateEstimatedTotalCost(productPrice: number, shippingCost = 0) {
  return Math.max(0, productPrice) + Math.max(0, shippingCost);
}

export function compareTotalCost(a: PriceCandidate, b: PriceCandidate) {
  return calculateEstimatedTotalCost(a.productPrice, a.shippingCost) - calculateEstimatedTotalCost(b.productPrice, b.shippingCost);
}

export function chooseBestTotalCost(candidates: PriceCandidate[]) {
  return [...candidates].sort(compareTotalCost)[0];
}

/*
  Future price comparison rules:
  - Compare the same item across stores only after product identity is reliable.
  - Include shipping cost and compare total landed cost, not just product price.
  - A product that is $27 + $8 shipping is not cheaper than $29 with free shipping.
  - Prefer an affiliate link only when it does not create a worse deal for the buyer.
  - Never claim a lower price unless total cost is lower.
*/
