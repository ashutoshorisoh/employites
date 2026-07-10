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
        # Check if supabase_realtime publication exists
        cur.execute("SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'")
        exists = cur.fetchone()
        
        if not exists:
            print("Creating publication supabase_realtime...")
            cur.execute("CREATE PUBLICATION supabase_realtime")
            
        # Add tables to publication individually (safely catching if already added)
        for table in ["users", "jobs", "candidates", "submissions"]:
            try:
                cur.execute(f"ALTER PUBLICATION supabase_realtime ADD TABLE {table}")
                print(f"Enabled Realtime for table: {table}")
            except Exception as table_err:
                conn.rollback() # rollback subtransaction error
                # Check if it was already added
                if "already contains table" in str(table_err) or "duplicate" in str(table_err):
                    print(f"Realtime was already enabled for table: {table}")
                else:
                    print(f"Could not enable realtime for {table}: {str(table_err)}")
            else:
                conn.commit()
                
    conn.close()
    print("\nDatabase Realtime configuration completed successfully!")
except Exception as e:
    print(f"Error: {str(e)}")
