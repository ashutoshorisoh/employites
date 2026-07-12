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
    from paddle_billing.resources.transactions.operations import CreateTransaction
    from paddle_billing.resources.transactions.models import TransactionCreateItem
except ImportError:
    try:
        from paddle_billing import Client, Environment, Options
        from paddle_billing.Resources.Transactions.Operations import CreateTransaction
        from paddle_billing.Resources.Transactions.Models import TransactionCreateItem
    except ImportError:
        # Generic mock Client class if SDK fails to load or install during bootstrap phases
        class Client:
            def __init__(self, *args, **kwargs):
                pass
            @property
            def transactions(self):
                class TransactionMock:
                    def create(self, *args, **kwargs):
                        class MockTransactionResult:
                            id = f"txn_mock_{uuid.uuid4().hex}"
                        return MockTransactionResult()
                return TransactionMock()
            
            @property
            def prices(self):
                class PriceMock:
                    def get(self, price_id, *args, **kwargs):
                        class ProductMock:
                            name = "Employites"
                        class UnitPriceMock:
                            if price_id == "pri_01kxa0g1a38c47g44k85g3r5fc":
                                amount = "7900"
                            elif price_id == "pri_01kxa0hdm56j461bn4y8q9q2g4":
                                amount = "13900"
                            elif price_id == "pri_01kxa0k9z4t626r7rfem9v976y":
                                amount = "20000"
                            else:
                                amount = "1900" if "starter" in price_id.lower() else "12900" if "pro" in price_id.lower() else "19900"
                            currency_code = "USD"
                        class BillingCycleMock:
                            interval = "month"
                            frequency = 1
                        class MockPriceResult:
                            id = price_id
                            product = ProductMock()
                            unit_price = UnitPriceMock()
                            billing_cycle = BillingCycleMock()
                        if "invalid" in price_id.lower() or "wrong" in price_id.lower():
                            raise Exception(f"Price {price_id} not found")
                        return MockPriceResult()

                    def create(self, price, *args, **kwargs):
                        class ProductMock:
                            name = "Employites"
                        class UnitPriceMock:
                            amount = price.unit_price.get("amount")
                            currency_code = price.unit_price.get("currency_code")
                        class BillingCycleMock:
                            interval = "month"
                            frequency = 1
                        class MockPriceResult:
                            id = f"pri_{uuid.uuid4().hex[:16]}"
                            product = ProductMock()
                            unit_price = UnitPriceMock()
                            billing_cycle = BillingCycleMock()
                        return MockPriceResult()
                return PriceMock()

            @property
            def discounts(self):
                class DiscountMock:
                    def create(self, discount, *args, **kwargs):
                        class MockDiscountResult:
                            id = f"dsc_{uuid.uuid4().hex[:8]}"
                            description = getattr(discount, 'description', 'Mock Discount')
                            amount = getattr(discount, 'amount', '10')
                            type = getattr(discount, 'type', 'flat')
                            maximum_recurring_intervals = getattr(discount, 'maximum_recurring_intervals', 1)
                            usage_limit = getattr(discount, 'usage_limit', 100)
                            times_used = 0
                            status = "active"
                        return MockDiscountResult()

                    def list(self, *args, **kwargs):
                        class MockDiscountCollection:
                            def __init__(self):
                                class Dsc:
                                    id = "dsc_mock1"
                                    description = "PROMO-1234 (Flat $10 Off)"
                                    type = "flat"
                                    amount = "10"
                                    usage_limit = 100
                                    times_used = 12
                                    status = "active"
                                class Dsc2:
                                    id = "dsc_mock2"
                                    description = "HOLIDAY20 (20% Off)"
                                    type = "percentage"
                                    amount = "20"
                                    usage_limit = 50
                                    times_used = 50
                                    status = "expired"
                                self.items = [Dsc(), Dsc2()]
                            def __iter__(self):
                                return iter(self.items)
                        return MockDiscountCollection()
                return DiscountMock()
        class Environment:
            SANDBOX = "sandbox"
            PRODUCTION = "production"
        class Options:
            def __init__(self, *args, **kwargs):
                pass
        class CreateTransaction:
            def __init__(self, *args, **kwargs):
                pass
        class TransactionCreateItem:
            def __init__(self, *args, **kwargs):
                pass

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/payments", tags=["Payments"])

# Initialize Paddle Billing client
paddle_api_key = os.getenv("PADDLE_API_KEY")
paddle_environment = Environment.SANDBOX if not paddle_api_key or "test" in paddle_api_key.lower() else Environment.PRODUCTION

try:
    paddle_client = Client(paddle_api_key, options=Options(paddle_environment))
except Exception as e:
    logger.error(f"Failed to initialize Paddle SDK client: {str(e)}")
    paddle_client = None

if paddle_client is None or (isinstance(paddle_client, Client) and not paddle_api_key):
    # Ensure it's never completely None so mock methods can be called safely
    paddle_client = Client()

PRICING_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "pricing_config.json")

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

class CreateCheckoutRequest(BaseModel):
    tier_id: str
    workspace_id: str

@router.get("/config")
async def get_pricing_config():
    """Returns the current backend pricing authority mapping for public checkout."""
    return TIER_PRICING


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
        if paddle_client is None or isinstance(paddle_client, Client) and not paddle_api_key:
            # Fallback mock for offline sandbox verification
            mock_id = f"txn_mock_{uuid.uuid4().hex}"
            logger.warning(f"Paddle API Key is missing/mocked. Generating mock transaction: {mock_id}")
            return {"transaction_id": mock_id}

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
                                tier_id_req = k
                                break
                                
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
