import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = os.environ.get("DATABASE_URL")

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
