import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from backend.main import app
from backend.api.routes.auth import require_admin, get_current_user

# Mock admin user to bypass authentication dependencies
app.dependency_overrides[require_admin] = lambda: {"role": "admin", "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "email": "admin@employites.com"}
app.dependency_overrides[get_current_user] = lambda: {"role": "admin", "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "email": "admin@employites.com"}

client = TestClient(app)

response = client.get("/v1/admin/billing/metrics")

print(f"Status: {response.status_code}")
print(f"Body: {response.json()}")
