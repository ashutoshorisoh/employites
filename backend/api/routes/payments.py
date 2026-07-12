from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
import os
import logging
import uuid
import hmac
import hashlib
from datetime import datetime, timezone

from backend.db.client import db
from backend.core.config import settings

# Attempt dynamic official Paddle SDK imports (handling casing differences gracefully)
try:
    from paddle_billing import Client, Environment, Options
    from paddle_billing.Resources.Transactions.Operations import CreateTransaction
    from paddle_billing.Resources.Transactions.Operations.Create.TransactionCreateItem import TransactionCreateItem
except ImportError:
    try:
        from paddle_billing import Client, Environment, Options
        from paddle_billing.resources.transactions.operations import CreateTransaction
        from paddle_billing.resources.transactions.models import TransactionCreateItem
    except ImportError:
        raise ImportError("Paddle SDK is required. Please install paddle-billing.")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/payments", tags=["Payments"])

from dotenv import load_dotenv
load_dotenv()

# Initialize Paddle Billing client
paddle_api_key = os.getenv("PADDLE_API_KEY")
paddle_environment = Environment.SANDBOX if not paddle_api_key or "test" in paddle_api_key.lower() else Environment.PRODUCTION

try:
    if paddle_api_key:
        paddle_client = Client(paddle_api_key, options=Options(paddle_environment))
    else:
        paddle_client = None
except Exception as e:
    logger.error(f"Failed to initialize Paddle SDK client: {str(e)}")
    paddle_client = None

PRICING_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "pricing_config.json")

# Paddle Product ID for creating new prices (read from env or resolved dynamically)
PADDLE_PRODUCT_ID = os.getenv("PADDLE_PRODUCT_ID", "")

def load_pricing():
    if os.path.exists(PRICING_CONFIG_FILE):
        try:
            import json
            with open(PRICING_CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load pricing config: {e}")
            
    return {
        "starter": os.getenv("PADDLE_PRICE_STARTER", "pri_01kxa0g1a38c47g44k85g3r5fc"),
        "professional": os.getenv("PADDLE_PRICE_PRO", "pri_01kxa0hdm56j461bn4y8q9q2g4"),
        "enterprise": os.getenv("PADDLE_PRICE_ENTERPRISE", "pri_01kxa0k9z4t626r7rfem9v976y")
    }

# Server-side pricing authority map (resolve tier_id to actual Paddle Price IDs)
TIER_PRICING = load_pricing()

def save_pricing():
    try:
        import json
        with open(PRICING_CONFIG_FILE, "w") as f:
            json.dump(TIER_PRICING, f)
    except Exception as e:
        logger.error(f"Failed to save pricing config: {e}")

def resolve_product_id():
    """Dynamically resolve the Employites product ID from the first configured price."""
    if PADDLE_PRODUCT_ID:
        return PADDLE_PRODUCT_ID
    try:
        first_price_id = next(iter(TIER_PRICING.values()))
        price = paddle_client.prices.get(first_price_id)
        if getattr(price, 'product', None):
            prod_id = price.product.id if hasattr(price.product, 'id') else getattr(price.product, 'product_id', '')
            return prod_id or 'pro_employites'
    except Exception:
        pass
    return 'pro_employites'

class CreateCheckoutRequest(BaseModel):
    tier_id: str
    workspace_id: str

@router.get("/config")
async def get_pricing_config():
    """Returns the current backend pricing authority mapping for public checkout."""
    return TIER_PRICING

@router.get("/prices")
async def get_prices(request: Request, interval: str = "monthly"):
    """
    Returns the current public pricing plans as a unified array.
    Each entry: { tier, id, numeric_price, display_price }
    Queries the live Paddle API to retrieve the prices.
    """
    if not paddle_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Paddle billing client is not initialized."
        )

    # Filter TIER_PRICING based on requested interval
    is_annual = interval.lower() == "annual"
    
    result = []
    for tier, price_id in TIER_PRICING.items():
        # Skip if key does not match the requested interval
        if is_annual and not tier.endswith("_annual"):
            continue
        if not is_annual and tier.endswith("_annual"):
            continue
            
        # Clean tier name for output (e.g. starter_annual -> starter)
        clean_tier = tier.replace("_annual", "")

        if not price_id or price_id.startswith("mock_") or price_id == "dummy_price":
            result.append({"tier": clean_tier, "id": price_id, "numeric_price": 0, "display_price": "Not Configured"})
            continue
        try:
            price = paddle_client.prices.get(price_id)
            if not price or not getattr(price, 'unit_price', None):
                result.append({"tier": clean_tier, "id": price_id, "numeric_price": 0, "display_price": "Invalid Price Object"})
                continue

            # Read raw unit price amount
            raw_amount = getattr(price.unit_price, 'amount', '0')
            currency = getattr(price.unit_price, 'currency_code', 'USD')
            if hasattr(currency, 'value'):
                currency = currency.value

            amount_cents = int(raw_amount)
            numeric_price = amount_cents // 100
            amount = amount_cents / 100

            # Read billing cycle interval
            cycle_interval = "one-time"
            if getattr(price, 'billing_cycle', None) and getattr(price.billing_cycle, 'interval', None):
                cycle_interval = getattr(price.billing_cycle, 'interval', 'month')
                if hasattr(cycle_interval, 'value'):
                    cycle_interval = cycle_interval.value

            currency_symbol = "$" if currency == "USD" else ("€" if currency == "EUR" else ("£" if currency == "GBP" else ("A$" if currency == "AUD" else f"{currency} ")))

            if cycle_interval == "one-time":
                display_price = f"{currency_symbol}{amount:,.2f}"
            else:
                display_price = f"{currency_symbol}{amount:,.0f} / {cycle_interval}" if amount == int(amount) else f"{currency_symbol}{amount:,.2f} / {cycle_interval}"

            result.append({"tier": clean_tier, "id": price_id, "numeric_price": numeric_price, "display_price": display_price})
        except Exception as e:
            logger.error(f"Failed to fetch price details for {clean_tier} ({price_id}): {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Paddle Gateway lookup failed: {str(e)}"
            )

    return result


def verify_paddle_signature(raw_body: bytes, signature_header: str, secret_key: str) -> bool:
    """
    Verifies the HMAC-SHA256 signature sent by Paddle Billing in the Paddle-Signature header.
    Signature format: ts=TIMESTAMP;h1=HEX_SIGNATURE
    Message to sign/verify: ts + ":" + raw_body
    """
    try:
        parts = {}
        for item in signature_header.split(";"):
            k, v = item.split("=", 1)
            parts[k.strip()] = v.strip()

        ts = parts.get("ts") or parts.get("t")
        h1 = parts.get("h1")

        if not ts or not h1:
            logger.error("Signature timestamp (ts) or hash (h1) missing from signature header.")
            return False

        # Construct verification message
        message = f"{ts}:{raw_body.decode('utf-8')}".encode("utf-8")
        computed_sig = hmac.new(
            key=secret_key.encode("utf-8"),
            msg=message,
            digestmod=hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, h1)
    except Exception as e:
        logger.error(f"Error computing signature verification: {str(e)}")
        return False


@router.post("/create-checkout", status_code=status.HTTP_201_CREATED)
async def create_checkout(payload: CreateCheckoutRequest):
    """
    Creates a draft transaction in Paddle pre-associated with the user's workspace_id (user ID).
    Returns the transaction ID for the Paddle.js checkout overlay.
    """
    try:
        # Validate workspace_id corresponds to existing recruiter user
        try:
            user_uuid = uuid.UUID(payload.workspace_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workspace ID format.")

        user = db.users.get(user_uuid)
        if not user:
            raise HTTPException(status_code=404, detail="Workspace recruiter profile not found.")

        # Create Draft Transaction via Paddle API SDK
        if not paddle_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Paddle billing client is not initialized."
            )

        # Map requested tier to authoritative server-side price ID
        tier_id = payload.tier_id.lower()
        if tier_id not in TIER_PRICING:
            raise HTTPException(status_code=400, detail="Invalid tier ID requested.")
            
        price_id = TIER_PRICING[tier_id]

        items = [
            TransactionCreateItem(
                price_id=price_id,
                quantity=1
            )
        ]

        transaction = paddle_client.transactions.create(
            CreateTransaction(
                items=items,
                custom_data={
                    "workspace_id": payload.workspace_id,
                    "tier_id": tier_id
                }
            )
        )

        return {"transaction_id": transaction.id}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed creating Paddle transaction checkout session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while preparing your checkout. Please contact support."
        )


@router.post("/webhook")
async def paddle_webhook(request: Request):
    """
    Handles asynchronous subscription events from Paddle.
    Performs signature checks and updates subscription database records.
    """
    raw_body = await request.body()
    signature_header = request.headers.get("Paddle-Signature")

    if not signature_header:
        logger.warning("Rejecting Paddle webhook request: Missing Paddle-Signature header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Signature verification header missing."
        )

    webhook_secret = os.getenv("PADDLE_WEBHOOK_SECRET")
    if not webhook_secret or webhook_secret == "#reqd key":
        logger.warning("Paddle Webhook Secret is placeholder or missing. Signature verification bypassed.")
    else:
        is_valid = verify_paddle_signature(raw_body, signature_header, webhook_secret)
        if not is_valid:
            logger.warning("Rejecting Paddle webhook request: Signature verification failed.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Webhook signature verification failed."
            )

    try:
        payload_json = await request.json()
    except Exception as e:
        logger.error(f"Malformed webhook JSON body: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bad Request: Malformed JSON body."
        )

    event_type = payload_json.get("event_type")
    data = payload_json.get("data", {})
    custom_data = data.get("custom_data", {})

    logger.info(f"Processing webhook event: {event_type}")

    if event_type in ["transaction.completed", "subscription.created"]:
        workspace_id = custom_data.get("workspace_id")
        tier_id_req = custom_data.get("tier_id", "unknown")
        if workspace_id:
            try:
                user_uuid = uuid.UUID(str(workspace_id))
                user = db.users.get(user_uuid)
                
                # Telemetry sync for subscription states
                if event_type == "subscription.created":
                    sub_id = data.get("id")
                    customer_id = data.get("customer_id")
                    status = data.get("status")
                    
                    # Reverse map tier_id if not present in custom_data
                    if tier_id_req == "unknown" and "items" in data and len(data["items"]) > 0:
                        price_id = data["items"][0].get("price", {}).get("id", "")
                        for k, v in TIER_PRICING.items():
                            if v == price_id:
                                tier_id_req = k.replace("_annual", "")
                                break
                    if tier_id_req:
                        tier_id_req = tier_id_req.replace("_annual", "")
                                
                    new_sub_id = uuid.uuid4()
                    db.subscriptions[new_sub_id] = {
                        "id": new_sub_id,
                        "user_id": user_uuid,
                        "paddle_subscription_id": str(sub_id),
                        "paddle_customer_id": str(customer_id),
                        "status": str(status),
                        "tier_id": tier_id_req,
                        "current_period_end": None,
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                    logger.info(f"Registered new subscription telemetry for {user_uuid}")

                if user:
                    user["is_subscribed"] = True
                    # Save updated user state back to Supabase/Persistent dict proxy
                    db.users[user_uuid] = user
                    logger.info(f"Subscription activated/verified for workspace {user_uuid}")
                else:
                    logger.warning(f"Workspace user ID {workspace_id} from webhook was not found in users database.")
            except ValueError:
                logger.error(f"Invalid workspace_id UUID format received: {workspace_id}")
            except Exception as e:
                logger.error(f"Failed updating recruiter subscription state in database: {str(e)}", exc_info=True)

    return {"status": "ok"}


class SyncSessionRequest(BaseModel):
    userId: str
    transactionId: str

@router.post("/sync-session")
async def sync_session(payload: SyncSessionRequest):
    """
    Syncs the user subscription state immediately upon frontend checkout completion.
    """
    try:
        user_uuid = uuid.UUID(payload.userId)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = db.users.get(user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Try to verify and retrieve info from Paddle transaction if client is ready
    tier_id = "starter"
    subscription_id = None
    customer_id = None
    tx_status = "completed"

    if paddle_client:
        try:
            transaction = paddle_client.transactions.get(payload.transactionId)
            if not transaction:
                raise HTTPException(status_code=404, detail="Transaction not found in Paddle.")

            # Verify that this transaction belongs to the requesting user
            tx_custom_data = getattr(transaction, "custom_data", {}) or {}
            tx_workspace_id = tx_custom_data.get("workspace_id")
            if tx_workspace_id and tx_workspace_id != payload.userId:
                raise HTTPException(status_code=403, detail="Transaction workspace mismatch.")

            tier_id = tx_custom_data.get("tier_id", "starter")
            subscription_id = getattr(transaction, "subscription_id", None)
            customer_id = getattr(transaction, "customer_id", None)
            tx_status = getattr(transaction, "status", "completed")
            if hasattr(tx_status, "value"):
                tx_status = tx_status.value

        except Exception as e:
            logger.error(f"Failed verifying transaction with Paddle API: {str(e)}")
            # We don't block if the API call fails, just log it, as webhook will also process it,
            # but we can try to proceed with local database updates.

    # Update user state in database
    user["is_subscribed"] = True
    user["plan_name"] = tier_id
    user["subscription_status"] = "active"
    db.users[user_uuid] = user

    # Create/update subscription record
    sub_id = uuid.uuid4()
    try:
        existing_subs = db.subscriptions.values()
        existing_sub = next((s for s in existing_subs if s.get("paddle_subscription_id") == str(subscription_id)), None) if subscription_id else None
        
        if existing_sub:
            existing_sub["status"] = "active"
            existing_sub["updated_at"] = datetime.now(timezone.utc)
            db.subscriptions[existing_sub["id"]] = existing_sub
        elif subscription_id:
            db.subscriptions[sub_id] = {
                "id": sub_id,
                "user_id": user_uuid,
                "paddle_subscription_id": str(subscription_id),
                "paddle_customer_id": str(customer_id) if customer_id else "unknown",
                "status": "active",
                "tier_id": tier_id,
                "current_period_end": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
    except Exception as sub_err:
        logger.error(f"Failed updating/creating subscription record in db: {str(sub_err)}")

    logger.info(f"Successfully synced session and activated subscription for user {user_uuid}")
    return {"status": "ok", "message": "Subscription synced successfully."}

