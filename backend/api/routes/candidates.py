from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging

from backend.api.routes.auth import get_current_user
from backend.db.client import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Candidates"])

class CandidateProfileUpdate(BaseModel):
    email: str

@router.put("/profile")
async def update_profile(payload: CandidateProfileUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update candidate profile details such as email.
    """
    if current_user.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can access this endpoint.")

    new_email = payload.email.strip().lower()

    # Check for email uniqueness among candidates
    for candidate in db.candidates.values():
        if candidate.get("email", "").lower() == new_email and str(candidate.get("id")) != str(current_user["id"]):
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    # Update candidate in DB
    current_user["email"] = new_email
    db.candidates[current_user["id"]] = current_user

    return {"message": "Profile updated successfully", "candidate": {"id": current_user["id"], "email": current_user["email"]}}
