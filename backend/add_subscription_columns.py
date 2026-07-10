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
        print("Adding subscription columns to users table...")
        
        # Add is_subscribed (boolean, default false)
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE")
        
        # Add plan_name (varchar, default 'free')
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50) DEFAULT 'free'")
        
        # Add subscription_status (varchar, default 'inactive')
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive'")
        
        # Add subscription_ends_at (timestamp with time zone, default null)
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL")
        
        conn.commit()
    conn.close()
    print("Subscription columns added successfully to Supabase users table!")
except Exception as e:
    print(f"Migration failed: {str(e)}")
