import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
from dotenv import load_dotenv

# Load environment variables from local .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))

url = os.getenv("DATABASE_URL")
if not url or url == "#reqd key":
    print("Error: DATABASE_URL not set in environment.")
    sys.exit(1)

try:
    conn = psycopg2.connect(url)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5")
        rows = cur.fetchall()
        print("Last 5 submissions:")
        for r in rows:
            print("-" * 50)
            print(f"ID: {r['id']}")
            print(f"Status: {r['status']}")
            print(f"Technical: {r['score_technical']}")
            print(f"Communication: {r['score_communication']}")
            print(f"Telemetry: {r['score_telemetry']}")
            print(f"AI Feedback: {r['ai_feedback']}")
            print(f"Video URL: {r['video_url']}")
    conn.close()
except Exception as e:
    print(f"Error: {str(e)}")
