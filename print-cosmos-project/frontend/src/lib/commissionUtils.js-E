/**
 * Frontend commission calculation engine.
 * Mirrors backend logic from commission_utils.py
 */

export function roundMoney(value) {
  // Match Python's round() behavior for consistency with backend
  // Python uses banker's rounding (round half to even)
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  const scaled = num * 100;
  const rounded = Math.round(scaled);
  // Handle banker's rounding for .5 cases
  const decimal = scaled - Math.floor(scaled);
  if (Math.abs(decimal) === 0.5) {
    const isEven = Math.floor(scaled) % 2 === 0;
    return isEven ? Math.floor(scaled) / 100 : Math.ceil(scaled) / 100;
  }
  return rounded / 100;
}

export function calculateMarketplaceCommission(salePrice, isPro) {
  /**
   * Commission engine for marketplace listings.
   *
   * Rules:
   * - Sale price is rounded to 2 decimals and clamped to a minimum of $1.00.
   * - Standard tiers:
   *   - < $15.00: 10% + $0.15
   *   - $15.00 to $100.00: 5%
   *   - > $100.00: 3.5%
   * - Pro tiers:
   *   - < $15.00: 4% + $0.05
   *   - $15.00 to $100.00: 2.5%
   *   - > $100.00: 2.0%
   */
  const normalizedSalePrice = roundMoney(Math.max(parseFloat(salePrice) || 0, 1.0));

  let tier, rate, fixedFee;

  if (normalizedSalePrice < 15.0) {
    if (isPro) {
      tier = "tier_1";
      rate = 0.04;
      fixedFee = 0.05;
    } else {
      tier = "tier_1";
      rate = 0.1;
      fixedFee = 0.15;
    }
  } else if (normalizedSalePrice <= 100.0) {
    if (isPro) {
      tier = "tier_2";
      rate = 0.025;
      fixedFee = 0.0;
    } else {
      tier = "tier_2";
      rate = 0.05;
      fixedFee = 0.0;
    }
  } else {
    if (isPro) {
      tier = "tier_3";
      rate = 0.02;
      fixedFee = 0.0;
    } else {
      tier = "tier_3";
      rate = 0.035;
      fixedFee = 0.0;
    }
  }

  const platformFee = roundMoney(normalizedSalePrice * rate + fixedFee);
  const sellerPayout = roundMoney(Math.max(normalizedSalePrice - platformFee, 0.0));

  return {
    salePrice: normalizedSalePrice,
    platformFee,
    sellerPayout,
    tier,
    rate,
    fixedFee,
    isPro: Boolean(isPro),
  };
}

export function getCommissionDisplayText(isPro) {
  /**
   * Returns human-readable commission tier breakdown text
   */
  if (isPro) {
    return "COSMIC PRO PLATFORM FEE (4% + $0.05 for items under $15, 2.5% for items $15–$100, or 2.0% for items over $100)";
  } else {
    return "PLATFORM FEE (10% + $0.15 for items under $15, 5% for items $15–$100, or 3.5% for items over $100)";
  }
}
