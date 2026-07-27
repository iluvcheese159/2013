from typing import Dict


def round_money(value: float) -> float:
    return round(float(value), 2)


def calculate_marketplace_commission(sale_price: float, is_pro: bool) -> Dict[str, float | str | bool]:
    """
    Commission engine for marketplace listings.

    Rules:
    - Sale price is rounded to 2 decimals and clamped to a minimum of $1.00.
    - Standard tiers:
      - < $15.00: 10% + $0.15
      - $15.00 to $100.00: 5%
      - > $100.00: 3.5%
    - Pro tiers:
      - < $15.00: 4% + $0.05
      - $15.00 to $100.00: 2.5%
      - > $100.00: 2.0%
    """
    normalized_sale_price = round_money(max(float(sale_price), 1.00))

    if normalized_sale_price < 15.00:
        if is_pro:
            tier = "tier_1"
            rate = 0.04
            fixed_fee = 0.05
        else:
            tier = "tier_1"
            rate = 0.10
            fixed_fee = 0.15
    elif normalized_sale_price <= 100.00:
        if is_pro:
            tier = "tier_2"
            rate = 0.025
            fixed_fee = 0.0
        else:
            tier = "tier_2"
            rate = 0.05
            fixed_fee = 0.0
    else:
        if is_pro:
            tier = "tier_3"
            rate = 0.02
            fixed_fee = 0.0
        else:
            tier = "tier_3"
            rate = 0.035
            fixed_fee = 0.0

    platform_fee = round_money((normalized_sale_price * rate) + fixed_fee)
    seller_payout = round_money(max(normalized_sale_price - platform_fee, 0.0))

    return {
        "sale_price": normalized_sale_price,
        "platform_fee": platform_fee,
        "seller_payout": seller_payout,
        "tier": tier,
        "rate": rate,
        "fixed_fee": fixed_fee,
        "is_pro": bool(is_pro),
    }
