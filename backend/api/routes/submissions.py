from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from backend.api.routes.auth import get_current_user
from backend.db.client import db
from backend.services.storage import storage_service
from backend.services.ai_engine import ai_engine
from backend.services.notification import notification_service
from backend.models.pydantic_schemas import (
    PresignedUrlRequest,
    PresignedUrlResponse,
    SubmissionCreate,
    SubmissionResponse
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])

def extract_object_key(video_url_or_key: str) -> str:
    """
    Extracts S3 object key from a full presigned URL, or returns the key if already relative.
    """
    if not video_url_or_key.startswith("http"):
        return video_url_or_key
    try:
        from urllib.parse import urlparse
        from backend.core.config import settings
        
        bucket_name = "skreener-uploads"
        if settings.STORAGE_BUCKET_NAME != "#reqd key":
            bucket_name = settings.STORAGE_BUCKET_NAME
        elif settings.R2_BUCKET_NAME != "#reqd key":
            bucket_name = settings.R2_BUCKET_NAME
            
        path = urlparse(video_url_or_key).path
        parts = path.lstrip("/").split("/")
        
        if bucket_name in parts:
            idx = parts.index(bucket_name)
            return "/".join(parts[idx + 1:])
            
        # Fallback to entire path if bucket name is not a path element
        return "/".join(parts)
    except Exception:
        return video_url_or_key

async def run_ai_evaluation_background(
    submission_id: uuid.UUID,
    job_title: str,
    job_description: str,
    video_url: str,
    questions: List[str]
):
    """
    Background worker that runs Gemini AI structures extraction, saves to database,
    and IMMEDIATELY deletes the raw video binary from Supabase storage (Ephemeral).
    """
    eval_result = None
    try:
        # Trigger AI analysis
        eval_result = await ai_engine.analyze_submission_async(
            video_url=video_url,
            job_title=job_title,
            job_description=job_description,
            questions=questions
        )
    except Exception as e:
        logger.error(f"Error during run_ai_evaluation_background analysis: {str(e)}")
        eval_result = {
            "status": "Failed",
            "score_communication": 0,
            "score_technical": 0,
            "score_telemetry": 0,
            "cheating_flagged": False,
            "cheating_details": f"Analysis failed with error: {str(e)}",
            "ai_feedback": {
                "summary": "AI evaluation failed.",
                "transcript": "Analysis failed.",
                "weaknesses": []
            }
        }
    finally:
        # Update the submission database
        submission = db.submissions.get(submission_id)
        if submission:
            if eval_result:
                # Map statuses to strict PostgreSQL enum values
                status_val = eval_result.get("status", "Failed")
                if status_val == "Shortlisted":
                    status_val = "Completed"
                elif status_val == "Rejected":
                    status_val = "Failed"

                submission["status"] = status_val
                submission["score_communication"] = eval_result.get("score_communication")
                submission["score_technical"] = eval_result.get("score_technical")
                submission["score_telemetry"] = eval_result.get("score_telemetry")
                submission["cheating_flagged"] = eval_result.get("cheating_flagged", False)
                submission["cheating_details"] = eval_result.get("cheating_details", "")
                submission["ai_feedback"] = eval_result.get("ai_feedback")
            else:
                submission["status"] = "Failed"
                submission["cheating_details"] = "AI evaluation failed unexpectedly."
                submission["ai_feedback"] = {
                    "summary": "AI evaluation failed.",
                    "transcript": "Analysis failed.",
                    "weaknesses": []
                }
            
            submission["updated_at"] = datetime.now(timezone.utc)
            # WIPE raw video URL reference from DB (preserving structured text summaries only)
            submission["video_url"] = None
            db.submissions[submission_id] = submission

        # WIPE raw video binary object(s) from Supabase bucket
        if video_url:
            for url_part in video_url.split(","):
                try:
                    object_key = extract_object_key(url_part.strip())
                    storage_service.delete_object(object_key)
                except Exception as del_err:
                    logger.error(f"Failed to delete video object {url_part}: {str(del_err)}")

        # Email notification to candidate upon successful complete review
        if submission and eval_result and eval_result.get("status") == "Completed":
            candidate = db.candidates.get(submission["candidate_id"])
            if candidate:
                await notification_service.send_submission_completed_email(
                    email=candidate["email"],
                    job_title=job_title
                )

@router.post("/upload-url", response_model=PresignedUrlResponse)
async def get_upload_url(payload: PresignedUrlRequest):
    """
    Acquire a Cloudflare R2 presigned PUT URL for candidate uploads.
    """
    object_key = f"uploads/{uuid.uuid4()}_{payload.filename}"
    url = storage_service.generate_presigned_put_url(
        object_name=object_key,
        content_type=payload.content_type
    )
    return {
        "upload_url": url,
        "object_key": object_key
    }

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def register_submission(payload: SubmissionCreate, background_tasks: BackgroundTasks):
    """
    Submits a candidate's video interview application for AI analysis.
    Begins background evaluation immediately.
    """
    # 1. Verify Job existence
    job = db.jobs.get(payload.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job post does not exist."
        )

    # 2. Find or register the Candidate
    candidate = None
    candidate_email = payload.candidate_email.strip().lower()
    for c in db.candidates.values():
        if c["email"] == candidate_email:
            candidate = c
            break

    if not candidate:
        candidate_id = uuid.uuid4()
        candidate = {
            "id": candidate_id,
            "email": candidate_email,
            "first_name": payload.candidate_first_name.strip(),
            "last_name": payload.candidate_last_name.strip(),
            "resume_url": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        db.candidates[candidate_id] = candidate

    # Check if candidate has already submitted for this job to prevent double-submission entries
    existing_sub = None
    for s in db.submissions.values():
        if str(s["candidate_id"]) == str(candidate["id"]) and str(s["job_id"]) == str(job["id"]):
            existing_sub = s
            break
            
    if existing_sub:
        if existing_sub.get("video_url") == payload.video_url:
            logger.info(f"Duplicate submission request (same video) detected for candidate {candidate_email} on job {job['id']}. Returning existing.")
            return existing_sub
        
        logger.info(f"Candidate {candidate_email} is re-submitting with different video for job {job['id']}. Resetting and enqueuing evaluation.")
        existing_sub["video_url"] = payload.video_url
        existing_sub["status"] = "Pending"
        existing_sub["score_communication"] = None
        existing_sub["score_technical"] = None
        existing_sub["score_telemetry"] = None
        existing_sub["cheating_flagged"] = False
        existing_sub["cheating_details"] = None
        existing_sub["resume_requested"] = False
        existing_sub["ai_feedback"] = None
        existing_sub["updated_at"] = datetime.now(timezone.utc)
        db.submissions[existing_sub["id"]] = existing_sub

        # Trigger background AI job for the reset submission
        background_tasks.add_task(
            run_ai_evaluation_background,
            submission_id=existing_sub["id"],
            job_title=job["title"],
            job_description=job["description"],
            video_url=payload.video_url,
            questions=job.get("questions", [])
        )
        return existing_sub

    # 3. Create the submission
    submission_id = uuid.uuid4()
    submission = {
        "id": submission_id,
        "job_id": job["id"],
        "candidate_id": candidate["id"],
        "video_url": payload.video_url,
        "status": "Pending",
        "score_communication": None,
        "score_technical": None,
        "score_telemetry": None,
        "cheating_flagged": False,
        "cheating_details": None,
        "resume_requested": False,
        "ai_feedback": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    db.submissions[submission_id] = submission

    # 4. Enqueue background AI job
    background_tasks.add_task(
        run_ai_evaluation_background,
        submission_id=submission_id,
        job_title=job["title"],
        job_description=job["description"],
        video_url=payload.video_url,
        questions=job.get("questions", [])
    )

    return submission

@router.get("", response_model=List[Dict[str, Any]])
async def list_submissions():
    """
    Retrieve all candidate submissions, joined with candidate names and job titles.
    Optimized with single JOIN query to avoid N+1 connection limits on Supabase.
    """
    if hasattr(db, "get_connection"):
        try:
            query = """
                SELECT 
                    s.id,
                    s.job_id,
                    coalesce(j.title, 'Unknown Job') as job_title,
                    s.candidate_id,
                    concat(c.first_name, ' ', c.last_name) as candidate_name,
                    coalesce(c.email, '') as candidate_email,
                    s.status,
                    s.score_communication,
                    s.score_technical,
                    s.score_telemetry,
                    s.ai_feedback,
                    s.resume_requested,
                    s.cheating_flagged,
                    s.cheating_details,
                    c.resume_url as candidate_resume_url,
                    s.created_at,
                    s.updated_at
                FROM submissions s
                LEFT JOIN jobs j ON s.job_id = j.id
                LEFT JOIN candidates c ON s.candidate_id = c.id
            """
            results = db.submissions._execute(query)
            for r in results:
                if "id" in r and isinstance(r["id"], str):
                    r["id"] = uuid.UUID(r["id"])
                if "job_id" in r and isinstance(r["job_id"], str):
                    r["job_id"] = uuid.UUID(r["job_id"])
                if "candidate_id" in r and isinstance(r["candidate_id"], str):
                    r["candidate_id"] = uuid.UUID(r["candidate_id"])
            return results
        except Exception as e:
            # Fallback to legacy dictionary loop on join failure
            pass

    results = []
    for s in db.submissions.values():
        job = db.jobs.get(s["job_id"])
        candidate = db.candidates.get(s["candidate_id"])
        
        job_title = job["title"] if job else "Unknown Job"
        candidate_name = f"{candidate['first_name']} {candidate['last_name']}" if candidate else "Unknown Candidate"
        candidate_email = candidate["email"] if candidate else ""
        
        results.append({
            "id": s["id"],
            "job_id": s["job_id"],
            "job_title": job_title,
            "candidate_id": s["candidate_id"],
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "status": s["status"],
            "score_communication": s.get("score_communication"),
            "score_technical": s.get("score_technical"),
            "score_telemetry": s.get("score_telemetry"),
            "cheating_flagged": s.get("cheating_flagged", False),
            "cheating_details": s.get("cheating_details"),
            "resume_requested": s.get("resume_requested", False),
            "candidate_resume_url": candidate.get("resume_url") if candidate else None,
            "ai_feedback": s.get("ai_feedback"),
            "created_at": s["created_at"],
            "updated_at": s["updated_at"]
        })
    return results

from pydantic import BaseModel

class SubmissionUpdate(BaseModel):
    status: str

@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(submission_id: uuid.UUID):
    """
    Retrieve the status and scores of an interview submission.
    """
    submission = db.submissions.get(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    candidate = db.candidates.get(submission["candidate_id"])
    res_dict = dict(submission)
    res_dict["candidate_resume_url"] = candidate.get("resume_url") if candidate else None
    return res_dict

@router.put("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(submission_id: uuid.UUID, payload: SubmissionUpdate):
    """
    Updates the status of a submission (e.g., from recruiter board dragging).
    """
    submission = db.submissions.get(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
        
    status_val = payload.status
    if payload.status == "Shortlisted":
        status_val = "Completed"
        if not submission.get("resume_requested"):
            submission["resume_requested"] = True
            job = db.jobs.get(submission["job_id"])
            candidate = db.candidates.get(submission["candidate_id"])
            if candidate and job:
                await notification_service.send_resume_request_email(
                    email=candidate["email"],
                    job_title=job["title"],
                    recruiter_name="Hiring Team"
                )
    elif payload.status == "Rejected":
        status_val = "Failed"

    submission["status"] = status_val
    submission["updated_at"] = datetime.now(timezone.utc)
    
    db.submissions[submission_id] = submission
    return submission

@router.get("/candidate/{candidate_email}", response_model=List[SubmissionResponse])
async def list_candidate_submissions(candidate_email: str):
    """
    Lookup all historical submissions made by a candidate email.
    """
    email = candidate_email.strip().lower()
    candidate = None
    for c in db.candidates.values():
        if c["email"] == email:
            candidate = c
            break

    if not candidate:
        return []

    subs = []
    for s in db.submissions.values():
        if s["candidate_id"] == candidate["id"]:
            s_dict = dict(s)
            s_dict["candidate_resume_url"] = candidate.get("resume_url")
            subs.append(s_dict)
    return subs

@router.post("/{sub_id}/ask-resume")
async def ask_resume(sub_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    """
    Recruiter triggers resume request for candidate. Saves state and emails candidate.
    """
    submission = db.submissions.get(sub_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    job = db.jobs.get(submission["job_id"])
    if not job or str(job["created_by"]) != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to request resume for this candidate.")
        
    submission["resume_requested"] = True
    db.submissions[sub_id] = submission
    
    # Trigger email to candidate
    candidate = db.candidates.get(submission["candidate_id"])
    if candidate:
        await notification_service.send_resume_request_email(
            email=candidate["email"],
            job_title=job["title"],
            recruiter_name=current_user.get("name") or current_user["email"]
        )
    return {"success": True, "message": "Resume request sent successfully."}

@router.get("/resume-download/{sub_id}")
async def download_resume(sub_id: uuid.UUID):
    """
    Generate a secure presigned GET URL for viewing the candidate's uploaded resume.
    """
    submission = db.submissions.get(sub_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
        
    candidate = db.candidates.get(submission["candidate_id"])
    if not candidate or not candidate.get("resume_url"):
        raise HTTPException(status_code=404, detail="No resume uploaded for this candidate yet.")
        
    resume_path = candidate["resume_url"]
    if resume_path.startswith("uploads/"):
        url = storage_service.generate_presigned_get_url(resume_path)
    else:
        url = resume_path
        
    return {"url": url}
