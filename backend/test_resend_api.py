import urllib.request
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.environ.get("RESEND_API")
url = "https://api.resend.com/emails"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Let's test sending to a few email addresses to check the response
to_email = "recruiter@acme.com" # Just a placeholder

body = {
    "from": "onboarding@resend.dev",
    "to": to_email,
    "subject": "Skreener Test",
    "html": "<p>This is a test email from Skreener backend.</p>"
}

try:
    req = urllib.request.Request(
        url, 
        data=json.dumps(body).encode("utf-8"), 
        headers=headers, 
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        res_body = response.read().decode("utf-8")
        print("Success! Resend API response:")
        print(res_body)
except Exception as e:
    print("Error during Resend email delivery:")
    if hasattr(e, "read"):
        print(e.read().decode("utf-8"))
    else:
        print(str(e))
