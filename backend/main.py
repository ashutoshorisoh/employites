import os
import sys

# Add parent directory to sys.path to support running from within the backend directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.core.config import settings
from backend.api.routes import auth, jobs, submissions, webhooks, admin

# Setup logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description="Skreener automated video candidate screening API.",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to specific domains in production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(submissions.router)
app.include_router(webhooks.router)
app.include_router(admin.router)

@app.get("/", tags=["Health Check"])
async def root_health_check():
    """
    General service health check indicator.
    """
    return {
        "app": settings.APP_NAME,
        "status": "healthy",
        "version": "1.0.0"
    }

# Global custom exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception captured: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred. Please contact system support.",
            "error_class": exc.__class__.__name__
        }
    )

# Optional startup log check for keys
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Skreener FastAPI Services...")
