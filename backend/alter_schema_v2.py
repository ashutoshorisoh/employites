import os
import psycopg2
from dotenv import load_dotenv

def run_migration():
    # Load environment variables
    load_dotenv()
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url or db_url == "#reqd key":
        print("Error: DATABASE_URL not set in .env")
        return
        
    print(f"Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # 1. Alter jobs table
        print("Modifying jobs table...")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS top_k_filter INTEGER DEFAULT 3;")
        cursor.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days');")
        
        # 2. Alter candidates table
        print("Modifying candidates table...")
        cursor.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL;")
        cursor.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;")
        
        # 3. Alter submissions table
        print("Modifying submissions table...")
        cursor.execute("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS resume_requested BOOLEAN DEFAULT FALSE;")
        cursor.execute("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cheating_flagged BOOLEAN DEFAULT FALSE;")
        cursor.execute("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cheating_details TEXT DEFAULT NULL;")
        
        # 4. Email duality triggers
        print("Adding email duality triggers...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION check_email_duality_users()
            RETURNS TRIGGER AS $$
            BEGIN
                IF EXISTS (SELECT 1 FROM candidates WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))) THEN
                    RAISE EXCEPTION 'An account with this email address already exists.';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        cursor.execute("""
            CREATE OR REPLACE FUNCTION check_email_duality_candidates()
            RETURNS TRIGGER AS $$
            BEGIN
                IF EXISTS (SELECT 1 FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))) THEN
                    RAISE EXCEPTION 'An account with this email address already exists.';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """)
        cursor.execute("DROP TRIGGER IF EXISTS trigger_check_email_users ON users;")
        cursor.execute("""
            CREATE TRIGGER trigger_check_email_users
            BEFORE INSERT OR UPDATE OF email ON users
            FOR EACH ROW EXECUTE FUNCTION check_email_duality_users();
        """)
        cursor.execute("DROP TRIGGER IF EXISTS trigger_check_email_candidates ON candidates;")
        cursor.execute("""
            CREATE TRIGGER trigger_check_email_candidates
            BEFORE INSERT OR UPDATE OF email ON candidates
            FOR EACH ROW EXECUTE FUNCTION check_email_duality_candidates();
        """)
        
        print("Migration schema alterations completed successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Migration error occurred: {str(e)}")

if __name__ == "__main__":
    run_migration()
