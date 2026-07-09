# Skreener FastAPI Backend Services

This is the Python-based FastAPI backend services layer for Skreener, providing automated candidate screening evaluations using Gemini 1.5 Flash, Cloudflare R2 uploads, and secure authentication.

---

## 📁 Directory Structure

```text
backend/
├── api/
│   └── routes/
│       ├── auth.py         # OTP generation, login and verification endpoints
│       ├── jobs.py         # CRUD endpoints for recruiter job postings
│       ├── submissions.py  # Presigned R2 uploads and application registrations
│       ├── webhooks.py     # Paddle billing signature webhook validator
│       └── admin.py        # Global metrics dashboard statistics & listings
├── core/
│   ├── config.py           # Configuration management (Pydantic Settings)
│   └── security.py         # JWT creation/verification & random OTP utilities
├── db/
│   ├── client.py           # Seedable In-Memory database engine for local testing
│   └── schema.sql          # Supabase/PostgreSQL schema definitions
├── models/
│   └── pydantic_schemas.py # Pydantic structures for serialization & validation
├── services/
│   ├── ai_engine.py        # Gemini 1.5 Flash evaluation core service
│   ├── notification.py     # Mock SMTP delivery alerts (OTP & reviews)
│   └── storage.py          # Cloudflare R2 presigned S3 uploads client
├── main.py                 # FastAPI application initializer & middleware router
├── requirements.txt        # Backend dependencies manifest
└── README.md               # Backend onboarding instructions
```

---

## 🛠️ Environment Configuration Checklist

Create a `.env` file in the `backend/` directory. If any credential remains unconfigured or matches the default `#reqd key` string, the application will fallback to a simulated mock service state.

| Environment Variable | Description | Value Requirement / Syntax |
|----------------------|-------------|----------------------------|
| `JWT_SECRET` | Secret key used to encrypt and sign JWT access tokens. | Secure alpha-numeric key |
| `SUPABASE_URL` | Endpoint URL of your Supabase project. | `https://[project-id].supabase.co` |
| `SUPABASE_KEY` | Supabase Service Role key or API Key. | JWT service token |
| `R2_ACCESS_KEY_ID` | Access key credential for Cloudflare R2 bucket. | Hexadecimal string |
| `R2_SECRET_ACCESS_KEY`| Secret access credential for Cloudflare R2. | Hexadecimal string |
| `R2_BUCKET_NAME` | Storage bucket name inside R2. | E.g., `skreener-uploads` |
| `R2_ENDPOINT_URL` | Cloudflare compatibility S3 API URL. | `https://[account-id].r2.cloudflarestorage.com` |
| `GEMINI_API_KEY` | API authentication key for Google Generative AI. | Gemini API Token |
| `PADDLE_PUBLIC_KEY` | RSA PEM public key used to verify Paddle webhook signatures. | Full PEM format string |

---

## 🚀 Running Locally

Follow these steps to spin up the API server in your local development environment:

### 1. Set Up Virtual Environment

We recommend using Python 3.10+:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (CMD):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Project Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Development Server

Start the API with hot-reloading:

```bash
uvicorn main:app --reload --port 8000
```

- **API Root**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
