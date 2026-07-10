from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
import uuid
import logging

from backend.core.config import settings
from backend.core.security import (
    generate_otp, create_access_token, verify_access_token, 
    hash_password, verify_password
)
from backend.services.notification import notification_service
from backend.db.client import db
from backend.models.pydantic_schemas import (
    OTPRequest, OTPVerify, TokenResponse, UserRegister, UserLogin, CandidateCheckin, RegisterOTPRequest
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Dependency to authenticate and return the current user profile from JWT payload.
    Queries the database table (Supabase or local JSON fallback).
    """
    token = credentials.credentials
    payload = verify_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )
    
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: malformed subject ID",
        )

    # Fetch user details dynamically from the database proxy based on token role
    role = payload.get("role")
    if role == "candidate":
        user = db.candidates.get(user_uuid)
        if user:
            # Candidate structure has first_name / last_name, translate to name/role
            user["role"] = "candidate"
            user["name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Candidate"
    else:
        user = db.users.get(user_uuid)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist in database.",
        )
    
    return user

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to restrict endpoint access to Admin users only.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user

@router.post("/register/otp-request", status_code=status.HTTP_200_OK)
async def request_registration_otp(payload: RegisterOTPRequest):
    """
    Generate and send a 6-digit verification code to the recruiter's email prior to registration.
    """
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Check if user already exists
    for u in db.users.values():
        if u["email"] == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )
            
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    # Store in database otps table
    db.otp_store[email] = {
        "email": email,
        "otp_code": otp,
        "expires_at": expiry
    }
    
    # Dispatch OTP via Resend email service
    await notification_service.send_otp_email(email, otp)
    
    return {"message": "Verification code has been sent successfully to your email."}

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegister):
    """
    Registers a new recruiter or administrator after verifying email OTP.
    Hashes the password and generates a JWT.
    """
    email = payload.email.strip().lower()
    otp_code = payload.otp.strip()
    
    # 1. Verify OTP first
    otp_record = db.otp_store.get(email)
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code requested for this email."
        )
        
    if datetime.now(timezone.utc) > otp_record["expires_at"]:
        db.otp_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired."
        )
        
    if otp_record["otp_code"] != otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code."
        )
        
    # Clear OTP
    db.otp_store.pop(email, None)
    
    # 2. Check if user already exists
    for u in db.users.values():
        if u["email"] == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )

    user_id = uuid.uuid4()
    hashed_pwd = hash_password(payload.password)
    role = payload.role if payload.role in ["admin", "recruiter"] else "recruiter"
    
    new_user = {
        "id": user_id,
        "email": email,
        "password_hash": hashed_pwd,
        "role": role,
        "name": payload.name.strip(),
        "is_subscribed": False,
        "plan_name": "free",
        "subscription_status": "inactive",
        "subscription_ends_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    # Writes dynamically to PostgreSQL/Supabase table via dict proxy
    db.users[user_id] = new_user

    # Trigger welcome email notification
    await notification_service.send_welcome_email(email, payload.name.strip())

    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(user_id),
            "email": email,
            "role": role
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role
    }

@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLogin):
    """
    Normal login endpoint requiring email and password verification.
    """
    email = payload.email.strip().lower()
    password = payload.password
    
    user = None
    for u in db.users.values():
        if u["email"] == email:
            user = u
            break
            
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Verify password hash
    is_valid = verify_password(password, user["password_hash"])
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"]
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.post("/candidate/checkin", response_model=TokenResponse)
async def checkin_candidate(payload: CandidateCheckin):
    """
    Candidate access/check-in endpoint.
    Validates token, registers candidate, creates a submission record, and issues a JWT.
    """
    token = payload.token.strip()
    email = payload.email.strip().lower()
    
    # 1. Verify that job token is valid
    job = None
    for j in db.jobs.values():
        if j.get("token") == token:
            job = j
            break
            
    if not job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation code."
        )

    if not job.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job listing has been closed by the recruiter and is no longer accepting new submissions."
        )

    # 2. Find or register candidate in candidates table
    candidate = None
    for c in db.candidates.values():
        if c["email"] == email:
            candidate = c
            break
            
    if not candidate:
        candidate_id = uuid.uuid4()
        candidate = {
            "id": candidate_id,
            "email": email,
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
            "resume_url": payload.resume_url,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        db.candidates[candidate_id] = candidate
    else:
        candidate_id = candidate["id"]

    # 3. Reuse existing submission if present, or create a new one
    existing_sub = None
    for s in db.submissions.values():
        if str(s["job_id"]) == str(job["id"]) and str(s["candidate_id"]) == str(candidate_id):
            existing_sub = s
            break

    if existing_sub:
        submission_id = existing_sub["id"]
        logger.info(f"Reusing existing submission {submission_id} for candidate checkin.")
    else:
        # Create new submission entry
        submission_id = uuid.uuid4()
        submission = {
            "id": submission_id,
            "job_id": job["id"],
            "candidate_id": candidate_id,
            "video_url": None,
            "status": "Pending",
            "score_communication": None,
            "score_technical": None,
            "score_telemetry": None,
            "ai_feedback": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        db.submissions[submission_id] = submission

    # 4. Generate JWT access token for candidate
    access_token = create_access_token(
        data={
            "sub": str(candidate_id),
            "email": email,
            "role": "candidate"
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "candidate"
    }

@router.post("/otp/request", status_code=status.HTTP_200_OK)
async def request_otp(payload: OTPRequest):
    """
    Generate and send a 6-digit verification OTP (alternative login pathway).
    """
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    # Store OTP in database proxy (otps table in Supabase)
    db.otp_store[email] = {
        "email": email,
        "otp_code": otp,
        "expires_at": expiry
    }
    
    # Dispatch OTP via mock email notification
    await notification_service.send_otp_email(email, otp)
    
    return {"message": "OTP has been sent successfully to your email."}

@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(payload: OTPVerify):
    """
    Verify the 6-digit OTP code and generate a JWT access token.
    """
    email = payload.email.strip().lower()
    otp_code = payload.otp.strip()
    
    otp_record = db.otp_store.get(email)
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email address."
        )
        
    if datetime.now(timezone.utc) > otp_record["expires_at"]:
        db.otp_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired."
        )
        
    if otp_record["otp_code"] != otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP code."
        )
        
    # Clear OTP after successful verify
    db.otp_store.pop(email, None)
    
    # Find or auto-create the user
    user = None
    for u in db.users.values():
        if u["email"] == email:
            user = u
            break
            
    if not user:
        # Create new user, default role is 'recruiter' (unless admin in email)
        user_id = uuid.uuid4()
        role = "admin" if "admin" in email else "recruiter"
        user = {
            "id": user_id,
            "email": email,
            # Assign dummy password for OTP registrations
            "password_hash": hash_password(uuid.uuid4().hex[:12]),
            "role": role,
            "name": email.split('@')[0].toUpperCase() if hasattr(email.split('@')[0], 'toUpperCase') else email.split('@')[0].upper(),
            "is_subscribed": False,
            "plan_name": "free",
            "subscription_status": "inactive",
            "subscription_ends_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        db.users[user_id] = user
        
    # Generate JWT token
    access_token = create_access_token(
        data={
            "sub": str(user["id"]),
            "email": user["email"],
            "role": user["role"]
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the profile details of the authenticated user.
    """
    return {
        "id": str(current_user["id"]),
        "email": current_user["email"],
        "role": current_user["role"],
        "name": current_user.get("name"),
        "is_subscribed": current_user.get("is_subscribed", False),
        "plan_name": current_user.get("plan_name", "free"),
        "subscription_status": current_user.get("subscription_status", "inactive"),
        "subscription_ends_at": current_user.get("subscription_ends_at").isoformat() if current_user.get("subscription_ends_at") and hasattr(current_user.get("subscription_ends_at"), "isoformat") else current_user.get("subscription_ends_at")
    }
