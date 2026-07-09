import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from fastapi import HTTPException, status
from backend.core.config import settings

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-SHA256 with a secure salt.
    Format: pbkdf2_sha256$iterations$salt$hash_hex
    """
    salt = secrets.token_hex(16)
    iterations = 100000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${dk.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against its PBKDF2 hash.
    """
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = parts[2]
        original_hash = parts[3]
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
        return secrets.compare_digest(dk.hex(), original_hash)
    except Exception:
        return False

def generate_otp() -> str:
    """
    Generates a secure, random 6-digit numeric OTP.
    """
    return "".join(secrets.choice("0123456789") for _ in range(6))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    
    to_encode.update({"exp": expire})
    
    # If the key is still the placeholder, we handle it gracefully or raise a warning
    secret_key = settings.JWT_SECRET
    if secret_key == "#reqd key":
        # Fallback for dev purposes if key is not provided in env,
        # but keep standard jwt behavior working
        secret_key = "development_secret_key_placeholder"

    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verifies a JWT access token and returns its decoded payload.
    """
    secret_key = settings.JWT_SECRET
    if secret_key == "#reqd key":
        secret_key = "development_secret_key_placeholder"
        
    try:
        payload = jwt.decode(token, secret_key, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
