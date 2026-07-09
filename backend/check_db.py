import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = os.environ.get("DATABASE_URL")

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
