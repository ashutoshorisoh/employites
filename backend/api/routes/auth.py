from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
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
    OTPRequest, OTPVerify, TokenResponse, UserRegister, UserLogin, CandidateCheckin, RegisterOTPRequest,
    CandidateRegister, CandidateLogin
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> dict:
    """
    Dependency to authenticate and return the current user profile from JWT payload.
    Supports either an Authorization header (Bearer token) or a secure 'skreener_token' cookie.
    """
    token = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("skreener_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
        )
        
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
        
    # Check if user already exists in either users or candidates schema
    for u in db.users.values():
        if u["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
    for c in db.candidates.values():
        if c["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
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

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegister, response: Response):
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
    
    # 2. Check if user already exists in either users or candidates schema
    for u in db.users.values():
        if u["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
    for c in db.candidates.values():
        if c["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
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
    
    # Set secure HttpOnly cookie
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(user_id),
        "email": email,
        "role": role,
        "name": payload.name.strip(),
        "is_subscribed": False,
        "plan_name": "free",
        "subscription_status": "inactive",
        "subscription_ends_at": None
    }

@router.post("/login")
async def login_user(payload: UserLogin, response: Response):
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
    
    # Set secure HttpOnly cookie
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name"),
        "is_subscribed": user.get("is_subscribed", False),
        "plan_name": user.get("plan_name", "free"),
        "subscription_status": user.get("subscription_status", "inactive"),
        "subscription_ends_at": user.get("subscription_ends_at").isoformat() if user.get("subscription_ends_at") and hasattr(user.get("subscription_ends_at"), "isoformat") else user.get("subscription_ends_at")
    }

@router.post("/candidate/checkin")
async def checkin_candidate(payload: CandidateCheckin, response: Response):
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
    # Check if email is already registered as an employer (recruiter/admin)
    for u in db.users.values():
        if u["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

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
    
    # Set secure HttpOnly cookie
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(candidate_id),
        "email": email,
        "role": "candidate",
        "name": f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip() or "Candidate"
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

@router.post("/otp/verify")
async def verify_otp(payload: OTPVerify, response: Response):
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
        # Check if email is already registered as a candidate
        for c in db.candidates.values():
            if c["email"].strip().lower() == email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address already exists."
                )
            
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
    
    # Set secure HttpOnly cookie
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name"),
        "is_subscribed": user.get("is_subscribed", False),
        "plan_name": user.get("plan_name", "free"),
        "subscription_status": user.get("subscription_status", "inactive"),
        "subscription_ends_at": user.get("subscription_ends_at").isoformat() if user.get("subscription_ends_at") and hasattr(user.get("subscription_ends_at"), "isoformat") else user.get("subscription_ends_at")
    }

@router.post("/logout")
async def logout_user(response: Response):
    """
    Clear the secure authentication cookie to log out the user.
    """
    response.delete_cookie(key="skreener_token", path="/")
    return {"message": "Logged out successfully."}

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
        "subscription_ends_at": current_user.get("subscription_ends_at").isoformat() if current_user.get("subscription_ends_at") and hasattr(current_user.get("subscription_ends_at"), "isoformat") else current_user.get("subscription_ends_at"),
        "resume_url": current_user.get("resume_url")
    }

@router.get("/candidate/exists/{email}")
async def check_candidate_exists(email: str):
    email_clean = email.strip().lower()
    for c in db.candidates.values():
        if c["email"] == email_clean:
            return {"exists": True, "has_password": c.get("password_hash") is not None}
    return {"exists": False, "has_password": False}

@router.post("/candidate/otp/request")
async def candidate_otp_request(payload: OTPRequest):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
        
    # Check if registered as employer
    for u in db.users.values():
        if u["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
            
    # Check if candidate already registered with a password
    for c in db.candidates.values():
        if c["email"].strip().lower() == email and c.get("password_hash"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        
    otp = generate_otp()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    db.otp_store[email] = {
        "email": email,
        "otp_code": otp,
        "expires_at": expiry
    }
    
    await notification_service.send_otp_email(email, otp)
    return {"success": True, "message": "Verification code has been successfully emailed."}

@router.post("/candidate/register")
async def candidate_register(payload: CandidateRegister, response: Response):
    email = payload.email.strip().lower()
    otp_code = payload.otp.strip()
    
    otp_record = db.otp_store.get(email)
    if not otp_record:
        raise HTTPException(status_code=400, detail="No verification code requested for this email.")
        
    if datetime.now(timezone.utc) > otp_record["expires_at"]:
        db.otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    if otp_record["otp_code"] != otp_code:
        raise HTTPException(status_code=400, detail="Incorrect verification code.")
        
    db.otp_store.pop(email, None)
    
    # Check if registered as employer
    for u in db.users.values():
        if u["email"].strip().lower() == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

    # Check if candidate already registered with password
    candidate = None
    for c in db.candidates.values():
        if c["email"] == email:
            if c.get("password_hash"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address already exists."
                )
            candidate = c
            break
            
    hashed_pwd = hash_password(payload.password)
    
    if candidate:
        candidate["password_hash"] = hashed_pwd
        candidate["first_name"] = payload.first_name.strip()
        candidate["last_name"] = payload.last_name.strip()
        candidate["is_verified"] = True
        candidate["updated_at"] = datetime.now(timezone.utc)
        db.candidates[candidate["id"]] = candidate
        candidate_id = candidate["id"]
    else:
        candidate_id = uuid.uuid4()
        candidate = {
            "id": candidate_id,
            "email": email,
            "first_name": payload.first_name.strip(),
            "last_name": payload.last_name.strip(),
            "password_hash": hashed_pwd,
            "is_verified": True,
            "resume_url": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        db.candidates[candidate_id] = candidate

    access_token = create_access_token(
        data={"sub": str(candidate_id), "email": email, "role": "candidate"}
    )
    
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(candidate_id),
        "email": email,
        "role": "candidate",
        "name": f"{payload.first_name.strip()} {payload.last_name.strip()}"
    }

@router.post("/candidate/login")
async def candidate_login(payload: CandidateLogin, response: Response):
    email = payload.email.strip().lower()
    
    candidate = None
    for c in db.candidates.values():
        if c["email"] == email:
            candidate = c
            break
            
    if not candidate or not candidate.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(payload.password, candidate["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    access_token = create_access_token(
        data={"sub": str(candidate["id"]), "email": email, "role": "candidate"}
    )
    
    response.set_cookie(
        key="skreener_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": str(candidate["id"]),
        "email": email,
        "role": "candidate",
        "name": f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip() or "Candidate",
        "resume_url": candidate.get("resume_url")
    }

@router.get("/candidate/applications")
async def get_candidate_applications(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can access this resource.")
        
    candidate_id = str(current_user["id"])
    submissions = [
        s for s in db.submissions.values()
        if str(s["candidate_id"]) == candidate_id
    ]
    
    results = []
    for s in submissions:
        job = db.jobs.get(s["job_id"])
        if not job:
            continue
            
        is_active = job.get("is_active", True)
        
        status_text = "Pending"
        if not is_active:
            sub_list = [
                sub for sub in db.submissions.values()
                if str(sub["job_id"]) == str(job["id"]) and sub["status"] == "Completed"
            ]
            ranked = []
            for sub in sub_list:
                cand = db.candidates.get(sub["candidate_id"])
                if not cand:
                    continue
                comm = sub.get("score_communication") or 0
                tech = sub.get("score_technical") or 0
                avg = (comm + tech) / 2
                if sub.get("cheating_flagged", False):
                    avg = -1.0
                ranked.append({"cand_id": str(sub["candidate_id"]), "score": avg})
                
            ranked.sort(key=lambda x: x["score"], reverse=True)
            k = job.get("top_k_filter", 3)
            top_ids = [item["cand_id"] for item in ranked[:k]]
            
            if candidate_id in top_ids:
                if s.get("resume_requested", False):
                    status_text = "Shortlisted"
                else:
                    status_text = "Under Review"
            else:
                status_text = "Process Closed"
                
        results.append({
            "submission_id": str(s["id"]),
            "job_id": str(job["id"]),
            "job_title": job["title"],
            "job_description": job["description"],
            "questions": job.get("questions", []),
            "expires_at": job.get("expires_at").isoformat() if job.get("expires_at") and hasattr(job.get("expires_at"), "isoformat") else job.get("expires_at"),
            "is_active": is_active,
            "status": status_text,
            "resume_requested": s.get("resume_requested", False),
            "resume_url": current_user.get("resume_url"),
            "cheating_flagged": s.get("cheating_flagged", False)
        })
        
    return results

from pydantic import BaseModel

class ResumeUploadPayload(BaseModel):
    resume_url: str

@router.post("/candidate/upload-resume")
async def upload_resume(payload: ResumeUploadPayload, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can submit resumes.")
    
    cand = db.candidates.get(current_user["id"])
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")
        
    cand["resume_url"] = payload.resume_url
    cand["updated_at"] = datetime.now(timezone.utc)
    db.candidates[current_user["id"]] = cand
    
    return {"success": True, "resume_url": payload.resume_url}
