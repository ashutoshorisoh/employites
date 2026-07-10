import psycopg2
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
    with conn.cursor() as cur:
        print("Adding is_active column to jobs table...")
        cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
        conn.commit()
    conn.close()
    print("Column added successfully!")
except Exception as e:
    print(f"Error: {str(e)}")
