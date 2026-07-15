import os
import sys
import asyncio
import urllib.request

# Add parent directory to sys.path to support running from within the backend directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.core.config import settings
from backend.api.routes import auth, jobs, submissions, webhooks, admin, payments, admin_billing, candidates

# Setup logger configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description="Employites HR note-taking and audio transcription copilot API.",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS Middleware (requires explicit origins when allow_credentials=True)
origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,"
    "http://localhost:8000,http://127.0.0.1:8000,"
    "https://employites.com,https://www.employites.com"
)
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(payments.router)
app.include_router(admin_billing.router, prefix="/v1/admin/billing")
app.include_router(candidates.router, prefix="/v1/candidate")

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

async def ping_self_loop():
    # Wait for the server to be fully initialized and listen before starting pings
    await asyncio.sleep(10)
    ping_url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("SELF_PING_URL")
    if not ping_url:
        logger.warning("RENDER_EXTERNAL_URL or SELF_PING_URL environment variables not set. Keep-alive self-ping task will be inactive.")
        return
    
    logger.info(f"Keep-alive self-ping task initialized. Target: {ping_url}")
    while True:
        try:
            def sync_ping():
                try:
                    req = urllib.request.Request(
                        ping_url,
                        headers={"User-Agent": "EmployitesKeepAlive/1.0"}
                    )
                    with urllib.request.urlopen(req, timeout=15) as response:
                        return response.getcode()
                except Exception as e:
                    return f"Failed: {str(e)}"
            
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, sync_ping)
            logger.info(f"Keep-alive self-ping to {ping_url} -> result status: {result}")
        except Exception as e:
            logger.error(f"Keep-alive self-ping encountered task loop error: {str(e)}")
        
        # Sleep for 10 minutes (600 seconds)
        await asyncio.sleep(600)

# Optional startup log check for keys
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Employites FastAPI Services...")
    # Start the keep-alive background task to prevent Render spin-down
    asyncio.create_task(ping_self_loop())
