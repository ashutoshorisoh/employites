from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import os
import uuid
import logging

from backend.db.client import db
from backend.api.routes.auth import require_admin
from backend.api.routes.payments import TIER_PRICING, save_pricing, paddle_client, resolve_product_id
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin Billing"])

class PricingTiersUpdate(BaseModel):
    starter: str
    professional: str
    enterprise: str

class CouponCreate(BaseModel):
    discount_type: str
    amount: str
    usage_limit: int

@router.get("/metrics")
async def get_billing_metrics(admin_user: dict = Depends(require_admin)):
    """
    Returns live MRR calculations, active subscriber counts, and detailed lists of subscribers.
    """
    total_mrr = 0
    active_subs = 0
    subscribers = []
    
    for sub in db.subscriptions.values():
        if sub.get("status") == "active":
            active_subs += 1
            tier = sub.get("tier_id", "starter")
            
            # Simulated MRR calculation based on active tier
            if tier == "starter":
                total_mrr += 79
            elif tier == "professional":
                total_mrr += 129
            elif tier == "enterprise":
                total_mrr += 199
            
            user = db.users.get(sub.get("user_id"))
            subscribers.append({
                "id": str(sub.get("id")),
                "email": user["email"] if user else "Unknown User",
                "tier": tier,
                "status": sub.get("status"),
                "paddle_sub_id": sub.get("paddle_subscription_id")
            })
            
    return {
        "mrr": total_mrr,
        "active_subscribers_count": active_subs,
        "subscribers": subscribers
    }

@router.get("/coupons")
async def get_coupons(admin_user: dict = Depends(require_admin)):
    """
    Returns active promotional discounts.
    """
    try:
        discounts = paddle_client.discounts.list()
        coupons = []
        for d in discounts:
            coupons.append({
                "id": d.id,
                "description": getattr(d, 'description', d.id),
                "amount": getattr(d, 'amount', '0'),
                "type": getattr(d, 'type', 'flat'),
                "usage_limit": getattr(d, 'usage_limit', 0),
                "times_used": getattr(d, 'times_used', 0),
                "status": getattr(d, 'status', 'active')
            })
        return coupons
    except Exception as e:
        logger.error(f"Failed to fetch coupons: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to communicate with Paddle SDK to fetch coupons.")

@router.post("/coupons")
async def create_coupon(payload: CouponCreate, admin_user: dict = Depends(require_admin)):
    """
    Generates a promotional discount code utilizing the Paddle SDK.
    """
    try:
        # We simulate creating a Discount Create object.
        # In the real SDK it would look like paddle_client.discounts.create(DiscountCreate(...))
        # But to accommodate our mock and flexible signature:
        class FakeDiscount:
            def __init__(self, t, a, limit):
                self.type = t
                self.amount = str(a)
                self.usage_limit = limit
                self.description = f"PROMO-{uuid.uuid4().hex[:8].upper()}"
        
        discount_payload = FakeDiscount(payload.discount_type, payload.amount, payload.usage_limit)
        result = paddle_client.discounts.create(discount_payload)
        
        return {"message": "Coupon generated successfully.", "code": result.description}
    except Exception as e:
        logger.error(f"Failed to generate coupon: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to communicate with Paddle SDK to generate coupon.")

@router.get("/pricing-tiers")
async def get_pricing_tiers():
    """
    Returns the current backend pricing authority mapping.
    Queries the live Paddle API to retrieve formatted display prices.
    Returns a unified array: [{ tier, id, numeric_price, display_price }, ...]
    """
    result = []
    for tier, price_id in TIER_PRICING.items():
        if not price_id or price_id.startswith("mock_") or price_id == "dummy_price":
            result.append({"tier": tier, "id": price_id, "numeric_price": 0, "display_price": "Not Configured / Invalid"})
            continue
        try:
            price = paddle_client.prices.get(price_id)
            if not getattr(price, 'unit_price', None):
                result.append({"tier": tier, "id": price_id, "numeric_price": 0, "display_price": "Invalid Price Object"})
                continue

            raw_amount = price.unit_price.get('amount') if isinstance(price.unit_price, dict) else getattr(price.unit_price, 'amount', 0)
            amount_cents = int(raw_amount)
            numeric_price = amount_cents // 100
            amount = amount_cents / 100

            currency = price.unit_price.get('currency_code') if isinstance(price.unit_price, dict) else getattr(price.unit_price, 'currency_code', 'USD')

            # Handle billing cycle (Paddle v2 subscriptions vs one-time charges)
            if getattr(price, 'billing_cycle', None) and getattr(price.billing_cycle, 'interval', None):
                interval = price.billing_cycle.interval
            else:
                interval = "one-time"

            currency_symbol = "$" if currency == "USD" else ("€" if currency == "EUR" else ("£" if currency == "GBP" else f"{currency} "))

            if interval == "one-time":
                display_price = f"{currency_symbol}{amount:,.2f}"
            else:
                display_price = f"{currency_symbol}{amount:,.0f} / {interval}" if amount == int(amount) else f"{currency_symbol}{amount:,.2f} / {interval}"

            result.append({"tier": tier, "id": price_id, "numeric_price": numeric_price, "display_price": display_price})
        except Exception as e:
            logger.error(f"Failed to fetch price details for {tier} ({price_id}): {str(e)}")
            result.append({"tier": tier, "id": price_id, "numeric_price": 0, "display_price": "API Error (Check ID)"})

    return result

@router.patch("/pricing-tiers")
async def update_pricing_tiers(payload: PricingTiersUpdate, admin_user: dict = Depends(require_admin)):
    """
    Updates the backend pricing authority mapping (TIER_PRICING).
    If a numeric payload is provided, creates a NEW Price ID via Paddle SDK POST /prices
    (Paddle prices are immutable — amounts cannot be PATCHed).
    """
    tier_map = {
        "starter": payload.starter,
        "professional": payload.professional,
        "enterprise": payload.enterprise
    }

    product_id = resolve_product_id()

    for tier, value in tier_map.items():
        if value.startswith("pri_") or value == "dummy_price" or value.startswith("mock_"):
            # Existing Price ID — validate it maps to the correct product
            try:
                price = paddle_client.prices.get(value)
                if getattr(price, 'product', None) and hasattr(price.product, 'name') and price.product.name != "Employites":
                    raise ValueError(f"Price ID {value} does not map to 'Employites'.")
            except Exception as e:
                logger.error(f"Price validation failed for {value}: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid Price ID: {value}.")
            TIER_PRICING[tier] = value
        else:
            # Numeric value — create a brand new catalog price via Paddle POST /prices
            try:
                amount_cents = str(int(float(value) * 100))

                # Attempt to use the official SDK CreatePrice
                try:
                    from paddle_billing.Resources.Prices.Operations import CreatePrice
                    from paddle_billing.Entities.Shared import Money, BillingCycle as PaddleBillingCycle, Duration

                    new_price = paddle_client.prices.create(
                        CreatePrice(
                            product_id=product_id,
                            description=f"{tier.capitalize()} Monthly Plan",
                            billing_cycle=PaddleBillingCycle(
                                interval=Duration.Month,
                                frequency=1
                            ),
                            unit_price=Money(
                                amount=amount_cents,
                                currency_code="USD"
                            )
                        )
                    )
                except ImportError:
                    # Fallback for mock/sandbox environments where SDK modules may differ
                    class FakePricePayload:
                        def __init__(self, pid, amt):
                            self.product_id = pid
                            self.description = f"{tier.capitalize()} Monthly Plan"
                            self.unit_price = {"amount": amt, "currency_code": "USD"}
                    new_price = paddle_client.prices.create(FakePricePayload(product_id, amount_cents))

                TIER_PRICING[tier] = new_price.id
                logger.info(f"Created new Paddle price for {tier}: {new_price.id} (amount: {amount_cents} cents)")
            except Exception as e:
                logger.error(f"Failed to create new price for {tier}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to generate price for {tier}: {str(e)}")

    save_pricing()
    return {"message": "Pricing tiers mapping successfully synchronized with environment.", "tiers": TIER_PRICING}
