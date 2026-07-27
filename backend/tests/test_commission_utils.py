from commission_utils import calculate_marketplace_commission


def test_minimum_sale_price_enforced():
    result = calculate_marketplace_commission(0.25, is_pro=False)
    assert result["sale_price"] == 1.00
    assert result["platform_fee"] == 0.25
    assert result["seller_payout"] == 0.75


def test_standard_tiers():
    # Tier 1: under $15 -> 10% + $0.15
    t1 = calculate_marketplace_commission(12.00, is_pro=False)
    assert t1["tier"] == "tier_1"
    assert t1["platform_fee"] == 1.35
    assert t1["seller_payout"] == 10.65

    # Tier 2: $15 to $100 -> 5%
    t2 = calculate_marketplace_commission(50.00, is_pro=False)
    assert t2["tier"] == "tier_2"
    assert t2["platform_fee"] == 2.50
    assert t2["seller_payout"] == 47.50

    # Tier 3: over $100 -> 3.5%
    t3 = calculate_marketplace_commission(120.00, is_pro=False)
    assert t3["tier"] == "tier_3"
    assert t3["platform_fee"] == 4.20
    assert t3["seller_payout"] == 115.80


def test_pro_tiers():
    # Tier 1: under $15 -> 4% + $0.05
    t1 = calculate_marketplace_commission(12.00, is_pro=True)
    assert t1["tier"] == "tier_1"
    assert t1["platform_fee"] == 0.53
    assert t1["seller_payout"] == 11.47

    # Tier 2: $15 to $100 -> 2.5%
    t2 = calculate_marketplace_commission(50.00, is_pro=True)
    assert t2["tier"] == "tier_2"
    assert t2["platform_fee"] == 1.25
    assert t2["seller_payout"] == 48.75

    # Tier 3: over $100 -> 2.0%
    t3 = calculate_marketplace_commission(120.00, is_pro=True)
    assert t3["tier"] == "tier_3"
    assert t3["platform_fee"] == 2.40
    assert t3["seller_payout"] == 117.60
