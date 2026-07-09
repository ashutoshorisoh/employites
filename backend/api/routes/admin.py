from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from backend.db.client import db
from backend.models.pydantic_schemas import AdminDashboardStats
from backend.api.routes.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_dashboard_stats(admin_user: dict = Depends(require_admin)):
    """
    Get aggregated dashboard stats for administrators.
    """
    total_users = len(db.users)
    total_jobs = len(db.jobs)
    total_candidates = len(db.candidates)
    total_submissions = len(db.submissions)
    
    # Compile submission statuses
    status_counts = {"Pending": 0, "Processing": 0, "Completed": 0, "Failed": 0}
    for sub in db.submissions.values():
        status_val = sub.get("status", "Pending")
        # Ensure status conforms to keys
        if status_val in status_counts:
            status_counts[status_val] += 1
        else:
            status_counts[str(status_val)] = 1
            
    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "total_submissions": total_submissions,
        "submissions_by_status": status_counts
    }

@router.get("/users", response_model=List[Dict[str, Any]])
async def list_all_users(admin_user: dict = Depends(require_admin)):
    """
    List all portal users. Only accessible by admins.
    """
    return list(db.users.values())

@router.get("/candidates", response_model=List[Dict[str, Any]])
async def list_all_candidates(admin_user: dict = Depends(require_admin)):
    """
    List all candidates. Only accessible by admins.
    """
    return list(db.candidates.values())

@router.get("/submissions", response_model=List[Dict[str, Any]])
async def list_all_submissions(admin_user: dict = Depends(require_admin)):
    """
    List all submissions. Only accessible by admins.
    """
    return list(db.submissions.values())
