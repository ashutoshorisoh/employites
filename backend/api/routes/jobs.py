from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timezone

from backend.db.client import db
from backend.models.pydantic_schemas import JobCreate, JobUpdate, JobResponse
from backend.api.routes.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
async def list_jobs(current_user: dict = Depends(get_current_user)):
    """
    List all jobs created by the current recruiter, or all jobs for administrators.
    """
    if current_user.get("role") == "admin":
        return list(db.jobs.values())
        
    # Convert created_by UUIDs safely to strings if required, or keep it strict
    user_id = str(current_user["id"])
    return [
        j for j in db.jobs.values() 
        if str(j.get("created_by")) == user_id
    ]

@router.get("/token/{token}", response_model=JobResponse)
async def get_job_by_token(token: str):
    """
    Retrieve details of a job by its invite token (public for candidates).
    """
    for job in db.jobs.values():
        if job.get("token") == token:
            return job
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Job listing not found for this invitation code."
    )

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID):
    """
    Get details of a specific job by ID.
    """
    job = db.jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )
    return job

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new job posting. Requires authentication.
    """
    job_id = uuid.uuid4()
    new_job = {
        "id": job_id,
        "title": payload.title,
        "description": payload.description,
        "requirements": payload.questions[0] if payload.questions else payload.requirements,
        "questions": payload.questions,
        "created_by": current_user["id"],
        "token": f"INV-{uuid.uuid4().hex[:8].upper()}",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    db.jobs[job_id] = new_job
    return new_job

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID, 
    payload: JobUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Update a job listing. Only creator or admin can update.
    """
    job = db.jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )

    # Check permission (creator or admin)
    if job["created_by"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this job listing"
        )

    # Update only defined fields
    if payload.title is not None:
        job["title"] = payload.title
    if payload.description is not None:
        job["description"] = payload.description
    if payload.requirements is not None:
        job["requirements"] = payload.requirements
    if payload.questions is not None:
        job["questions"] = payload.questions
        job["requirements"] = payload.questions[0] if payload.questions else None
    if payload.is_active is not None:
        job["is_active"] = payload.is_active
        
    job["updated_at"] = datetime.now(timezone.utc)
    db.jobs[job_id] = job
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    """
    Delete a job listing. Only creator or admin can delete.
    """
    job = db.jobs.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found"
        )

    # Check permission
    if job["created_by"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this job listing"
        )

    db.jobs.pop(job_id)
    return None
