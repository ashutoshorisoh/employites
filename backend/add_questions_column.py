import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

url = os.environ.get("DATABASE_URL")

try:
    conn = psycopg2.connect(url)
    with conn.cursor() as cur:
        print("Adding questions JSONB column to jobs table...")
        cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS questions JSONB")
        
        print("Migrating existing requirements strings into questions arrays...")
        # If requirements exist and questions is null, build JSON array of [requirements]
        cur.execute("""
            UPDATE jobs 
            SET questions = jsonb_build_array(requirements) 
            WHERE questions IS NULL AND requirements IS NOT NULL
        """)
        
        # If both are null, default questions to empty array []
        cur.execute("UPDATE jobs SET questions = '[]'::jsonb WHERE questions IS NULL")
        
        conn.commit()
    conn.close()
    print("Database altered and migrated successfully!")
except Exception as e:
    print(f"Error: {str(e)}")
