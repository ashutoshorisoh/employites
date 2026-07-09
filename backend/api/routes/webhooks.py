from fastapi import APIRouter, Request, HTTPException, status
import logging
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_public_key

from backend.core.config import settings
from backend.models.pydantic_schemas import PaddleWebhookPayload

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

def verify_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Verifies a Paddle Billing v3 webhook signature using their RSA public key.
    Message format to sign/verify: timestamp + ":" + raw_request_body
    """
    public_key_pem = settings.PADDLE_PUBLIC_KEY
    
    # Guard against default placeholder
    if public_key_pem == "#reqd key":
        logger.warning("Paddle Public Key is placeholder (#reqd key). Signature verification bypassed.")
        return True

    try:
        # Paddle-Signature structure: t=1680512345;h1=abc...hex_sig
        parts = {}
        for item in signature_header.split(";"):
            k, v = item.split("=", 1)
            parts[k.strip()] = v.strip()

        ts = parts.get("t")
        h1 = parts.get("h1")

        if not ts or not h1:
            logger.error("Missing timestamp 't' or signature hash 'h1' in Paddle-Signature header.")
            return False

        # Formulate payload message
        message = f"{ts}:{raw_body.decode('utf-8')}".encode("utf-8")
        signature_bytes = bytes.fromhex(h1)

        # Parse the public key PEM
        public_key = load_pem_public_key(public_key_pem.encode("utf-8"))

        # Verify RSA PKCS1 v1.5 signature
        public_key.verify(
            signature_bytes,
            message,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception as e:
        logger.error(f"Paddle signature verification failed: {str(e)}")
        return False

@router.post("/paddle")
async def paddle_webhook(request: Request):
    """
    Endpoint for secure webhook events from Paddle.
    Checks signature and handles customer subscription/payment alerts.
    """
    raw_body = await request.body()
    signature_header = request.headers.get("Paddle-Signature")

    if not signature_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Paddle-Signature header"
        )

    is_valid = verify_signature(raw_body, signature_header)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature validation failed"
        )

    # Process JSON body
    try:
        payload_json = await request.json()
        # Verify schema
        payload = PaddleWebhookPayload(**payload_json)
    except Exception as e:
        logger.error(f"Failed parsing webhook payload schema: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed webhook payload format"
        )

    event_type = payload.event_type
    logger.info(f"Received Paddle event: {event_type}")

    # Handle subscription events
    if event_type == "subscription.created":
        # Handle new subscription (e.g. provision seat, unlock client credits)
        client_email = payload.data.get("customer", {}).get("email")
        logger.info(f"Subscription created for {client_email}")
    elif event_type == "subscription.canceled":
        # Handle subscription cancelation (revoke access, limit quotas)
        client_email = payload.data.get("customer", {}).get("email")
        logger.info(f"Subscription canceled for {client_email}")
    else:
        logger.info(f"Unhandled Paddle event type: {event_type}")

    return {"status": "ok"}
