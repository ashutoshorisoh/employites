import os
import uuid
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor, Json

from backend.core.config import settings

logger = logging.getLogger(__name__)

# Fallback helper for local JSON database if Supabase URL is placeholder
class PersistentDict(dict):
    def __init__(self, callback, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._callback = callback
    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self._callback()
    def __delitem__(self, key):
        super().__delitem__(key)
        self._callback()
    def pop(self, key, default=None):
        res = super().pop(key, default)
        self._callback()
        return res

class LocalJSONDatabaseFallback:
    """
    Fallback persistent JSON store if Supabase PostgreSQL database URL is not provided.
    """
    def __init__(self, file_path: str):
        self._file_path = file_path
        self.users = PersistentDict(self.save)
        self.jobs = PersistentDict(self.save)
        self.candidates = PersistentDict(self.save)
        self.submissions = PersistentDict(self.save)
        self.subscriptions = PersistentDict(self.save)
        self.otp_store = {}
        self.load()

    def load(self):
        if not os.path.exists(self._file_path):
            self._seed()
            return
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Load users
            for k, v in data.get("users", {}).items():
                uid = uuid.UUID(k)
                self.users[uid] = {
                    "id": uid,
                    "email": v["email"],
                    "password_hash": v.get("password_hash", ""),
                    "role": v["role"],
                    "name": v.get("name"),
                    "created_at": datetime.fromisoformat(v["created_at"]) if "created_at" in v else datetime.now(timezone.utc),
                    "updated_at": datetime.fromisoformat(v["updated_at"]) if "updated_at" in v else datetime.now(timezone.utc)
                }
            # Load jobs
            for k, v in data.get("jobs", {}).items():
                jid = uuid.UUID(k)
                self.jobs[jid] = {
                    "id": jid,
                    "title": v["title"],
                    "description": v["description"],
                    "requirements": v.get("requirements"),
                    "created_by": uuid.UUID(v["created_by"]) if v.get("created_by") else None,
                    "token": v.get("token"),
                    "created_at": datetime.fromisoformat(v["created_at"]) if "created_at" in v else datetime.now(timezone.utc),
                    "updated_at": datetime.fromisoformat(v["updated_at"]) if "updated_at" in v else datetime.now(timezone.utc)
                }
            # Load candidates
            for k, v in data.get("candidates", {}).items():
                cid = uuid.UUID(k)
                self.candidates[cid] = {
                    "id": cid,
                    "email": v["email"],
                    "first_name": v.get("first_name"),
                    "last_name": v.get("last_name"),
                    "resume_url": v.get("resume_url"),
                    "password_hash": v.get("password_hash"),
                    "is_verified": v.get("is_verified", False),
                    "created_at": datetime.fromisoformat(v["created_at"]) if "created_at" in v else datetime.now(timezone.utc),
                    "updated_at": datetime.fromisoformat(v["updated_at"]) if "updated_at" in v else datetime.now(timezone.utc)
                }
            # Load submissions
            for k, v in data.get("submissions", {}).items():
                sid = uuid.UUID(k)
                self.submissions[sid] = {
                    "id": sid,
                    "job_id": uuid.UUID(v["job_id"]),
                    "candidate_id": uuid.UUID(v["candidate_id"]),
                    "video_url": v.get("video_url"),
                    "status": v["status"],
                    "score_communication": v.get("score_communication"),
                    "score_technical": v.get("score_technical"),
                    "score_telemetry": v.get("score_telemetry"),
                    "ai_feedback": v.get("ai_feedback"),
                    "created_at": datetime.fromisoformat(v["created_at"]) if "created_at" in v else datetime.now(timezone.utc),
                    "updated_at": datetime.fromisoformat(v["updated_at"]) if "updated_at" in v else datetime.now(timezone.utc)
                }
            # Load subscriptions
            for k, v in data.get("subscriptions", {}).items():
                subid = uuid.UUID(k)
                self.subscriptions[subid] = {
                    "id": subid,
                    "user_id": uuid.UUID(v["user_id"]),
                    "paddle_subscription_id": v["paddle_subscription_id"],
                    "paddle_customer_id": v["paddle_customer_id"],
                    "status": v["status"],
                    "tier_id": v["tier_id"],
                    "current_period_end": datetime.fromisoformat(v["current_period_end"]) if v.get("current_period_end") else None,
                    "created_at": datetime.fromisoformat(v["created_at"]) if "created_at" in v else datetime.now(timezone.utc),
                    "updated_at": datetime.fromisoformat(v["updated_at"]) if "updated_at" in v else datetime.now(timezone.utc)
                }
        except Exception:
            self._seed()

    def save(self):
        try:
            data = {
                "users": {
                    str(k): {
                        "id": str(v["id"]),
                        "email": v["email"],
                        "password_hash": v.get("password_hash", ""),
                        "role": v["role"],
                        "name": v.get("name"),
                        "created_at": v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else str(v.get("created_at")),
                        "updated_at": v["updated_at"].isoformat() if isinstance(v.get("updated_at"), datetime) else str(v.get("updated_at"))
                    } for k, v in self.users.items()
                },
                "jobs": {
                    str(k): {
                        "id": str(v["id"]),
                        "title": v["title"],
                        "description": v["description"],
                        "requirements": v.get("requirements"),
                        "created_by": str(v["created_by"]) if v.get("created_by") else None,
                        "token": v.get("token"),
                        "created_at": v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else str(v.get("created_at")),
                        "updated_at": v["updated_at"].isoformat() if isinstance(v.get("updated_at"), datetime) else str(v.get("updated_at"))
                    } for k, v in self.jobs.items()
                },
                "candidates": {
                    str(k): {
                        "id": str(v["id"]),
                        "email": v["email"],
                        "first_name": v.get("first_name"),
                        "last_name": v.get("last_name"),
                        "resume_url": v.get("resume_url"),
                        "password_hash": v.get("password_hash"),
                        "is_verified": v.get("is_verified", False),
                        "created_at": v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else str(v.get("created_at")),
                        "updated_at": v["updated_at"].isoformat() if isinstance(v.get("updated_at"), datetime) else str(v.get("updated_at"))
                    } for k, v in self.candidates.items()
                },
                "submissions": {
                    str(k): {
                        "id": str(v["id"]),
                        "job_id": str(v["job_id"]),
                        "candidate_id": str(v["candidate_id"]),
                        "video_url": v.get("video_url"),
                        "status": v["status"],
                        "score_communication": v.get("score_communication"),
                        "score_technical": v.get("score_technical"),
                        "score_telemetry": v.get("score_telemetry"),
                        "ai_feedback": v.get("ai_feedback"),
                        "created_at": v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else str(v.get("created_at")),
                        "updated_at": v["updated_at"].isoformat() if isinstance(v.get("updated_at"), datetime) else str(v.get("updated_at"))
                    } for k, v in self.submissions.items()
                },
                "subscriptions": {
                    str(k): {
                        "id": str(v["id"]),
                        "user_id": str(v["user_id"]),
                        "paddle_subscription_id": v["paddle_subscription_id"],
                        "paddle_customer_id": v["paddle_customer_id"],
                        "status": v["status"],
                        "tier_id": v["tier_id"],
                        "current_period_end": v["current_period_end"].isoformat() if isinstance(v.get("current_period_end"), datetime) else (str(v.get("current_period_end")) if v.get("current_period_end") else None),
                        "created_at": v["created_at"].isoformat() if isinstance(v.get("created_at"), datetime) else str(v.get("created_at")),
                        "updated_at": v["updated_at"].isoformat() if isinstance(v.get("updated_at"), datetime) else str(v.get("updated_at"))
                    } for k, v in self.subscriptions.items()
                }
            }
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving database JSON: {str(e)}")

    def _seed(self):
        admin_id = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        self.users[admin_id] = {
            "id": admin_id,
            "email": "admin@employites.com",
            # Hashed version of 'admin123'
            "password_hash": "pbkdf2_sha256$100000$secure_salt$00e6ebb565d66c2e6e607385ddcfcddbd78f69829f02fc7018c0d1245e18cc28",
            "role": "admin",
            "name": "Admin Owner",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        client_id = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
        self.users[client_id] = {
            "id": client_id,
            "email": "recruiter@acme.com",
            # Hashed version of 'recruiter123'
            "password_hash": "pbkdf2_sha256$100000$secure_salt$c553011bdac34f3b5a0d51e415747e9c413b795954809c993422e230c12f4c59",
            "role": "recruiter",
            "name": "Acme Recruiter",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

# --- Supabase Database Table Proxy Mappings ---

class TableProxy:
    """
    Proxies standard python dictionary interface operations to SQL queries on Supabase tables.
    """
    def __init__(self, table_name: str, get_connection_fn):
        self.table_name = table_name
        self.get_connection = get_connection_fn

    def _execute(self, query: str, params: tuple = ()) -> List[dict]:
        import time
        retries = 3
        for attempt in range(retries):
            try:
                with self.get_connection() as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(query, params)
                        if cur.description:
                            return [dict(row) for row in cur.fetchall()]
                        conn.commit()
                        return []
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                logger.warning(f"Database operational error on {self.table_name} (attempt {attempt + 1}/{retries}): {str(e)}")
                if attempt < retries - 1:
                    time.sleep(1)
                else:
                    logger.error(f"PostgreSQL query execution failed after {retries} retries on {self.table_name}: {query}. Error: {str(e)}")
                    raise e
            except Exception as e:
                logger.error(f"PostgreSQL query execution failed on {self.table_name}: {query}. Error: {str(e)}")
                raise e

    def get(self, key: Any, default: Any = None) -> Optional[Dict[str, Any]]:
        # Map primary keys
        pk_col = "email" if self.table_name == "otps" else "id"
        
        # Format key appropriately
        val = str(key) if isinstance(key, uuid.UUID) else key
        
        rows = self._execute(f"SELECT * FROM {self.table_name} WHERE {pk_col} = %s", (val,))
        if not rows:
            return default
            
        row = rows[0]
        # Clean UUID formatting
        if "id" in row and isinstance(row["id"], str):
            row["id"] = uuid.UUID(row["id"])
        for ref_col in ["job_id", "candidate_id", "created_by"]:
            if ref_col in row and row[ref_col] is not None:
                row[ref_col] = uuid.UUID(str(row[ref_col]))
                
        return row

    def __contains__(self, key: Any) -> bool:
        return self.get(key) is not None

    def __getitem__(self, key: Any) -> Dict[str, Any]:
        res = self.get(key)
        if res is None:
            raise KeyError(key)
        return res

    def __setitem__(self, key: Any, val: Dict[str, Any]):
        cols = list(val.keys())
        params = []
        for c in cols:
            v = val[c]
            if isinstance(v, uuid.UUID):
                params.append(str(v))
            elif isinstance(v, (dict, list)):
                params.append(Json(v))
            else:
                params.append(v)
                
        placeholders = ", ".join(["%s"] * len(cols))
        col_names = ", ".join(cols)
        
        # Conflict parameters
        pk_col = "email" if self.table_name == "otps" else "id"
        update_sets = ", ".join([f"{c} = EXCLUDED.{c}" for c in cols if c != pk_col])
        
        query = f"""
            INSERT INTO {self.table_name} ({col_names})
            VALUES ({placeholders})
            ON CONFLICT ({pk_col}) 
            DO UPDATE SET {update_sets}
        """
        self._execute(query, tuple(params))

    def __delitem__(self, key: Any):
        pk_col = "email" if self.table_name == "otps" else "id"
        val = str(key) if isinstance(key, uuid.UUID) else key
        self._execute(f"DELETE FROM {self.table_name} WHERE {pk_col} = %s", (val,))

    def pop(self, key: Any, default: Any = None) -> Optional[Dict[str, Any]]:
        res = self.get(key)
        if res is not None:
            self.__delitem__(key)
            return res
        return default

    def values(self) -> List[Dict[str, Any]]:
        rows = self._execute(f"SELECT * FROM {self.table_name}")
        for r in rows:
            if "id" in r and isinstance(r["id"], str):
                r["id"] = uuid.UUID(r["id"])
            for ref_col in ["job_id", "candidate_id", "created_by"]:
                if ref_col in r and r[ref_col] is not None:
                    r[ref_col] = uuid.UUID(str(r[ref_col]))
        return rows

    def __len__(self) -> int:
        rows = self._execute(f"SELECT COUNT(*) as cnt FROM {self.table_name}")
        return rows[0]["cnt"] if rows else 0

class SupabasePostgresDatabase:
    """
    Supabase PostgreSQL client wrapping direct S3-compatible connections.
    """
    def __init__(self, db_url: str):
        # Format scheme for psycopg2 compatibility
        if db_url.startswith("postgresql+asyncpg://"):
            self.db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        elif db_url.startswith("postgresql+psycopg2://"):
            self.db_url = db_url.replace("postgresql+psycopg2://", "postgresql://", 1)
        else:
            self.db_url = db_url

        self.users = TableProxy("users", self.get_connection)
        self.jobs = TableProxy("jobs", self.get_connection)
        self.candidates = TableProxy("candidates", self.get_connection)
        self.submissions = TableProxy("submissions", self.get_connection)
        self.subscriptions = TableProxy("subscriptions", self.get_connection)
        self.otp_store = TableProxy("otps", self.get_connection)

        # Run schema migrations on startup to build schemas automatically.
        self._initialize_schema()

    def get_connection(self):
        return psycopg2.connect(self.db_url)

    def _initialize_schema(self):
        """
        Runs DDL commands on Supabase PostgreSQL database during startup to build schemas.
        """
        logger.info("Initializing Supabase schema commands...")
        schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
        if not os.path.exists(schema_path):
            logger.error("Database schema.sql DDL not found.")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            ddl_queries = f.read()

        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(ddl_queries)
                conn.commit()
            logger.info("Supabase database tables synchronized successfully.")
            self._seed_database_if_empty()
        except Exception as e:
            logger.error(f"Failed loading Supabase PostgreSQL DDL schemas: {str(e)}")

    def _seed_database_if_empty(self):
        """
        Seeds initial default Admin and Recruiter credentials if the tables are empty.
        """
        try:
            if len(self.users) == 0:
                logger.info("Database users table empty. Seeding initial admin and recruiter credentials...")
                
                admin_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
                self.users[uuid.UUID(admin_id)] = {
                    "id": uuid.UUID(admin_id),
                    "email": "admin@employites.com",
                    # Hashed version of 'admin123'
                    "password_hash": "pbkdf2_sha256$100000$secure_salt$00e6ebb565d66c2e6e607385ddcfcddbd78f69829f02fc7018c0d1245e18cc28",
                    "role": "admin",
                    "name": "Admin Owner",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }

                client_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
                self.users[uuid.UUID(client_id)] = {
                    "id": uuid.UUID(client_id),
                    "email": "recruiter@acme.com",
                    # Hashed version of 'recruiter123'
                    "password_hash": "pbkdf2_sha256$100000$secure_salt$c553011bdac34f3b5a0d51e415747e9c413b795954809c993422e230c12f4c59",
                    "role": "recruiter",
                    "name": "Acme Recruiter",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                
                # Seed default Job listing too
                job_id = "11111111-1111-1111-1111-111111111111"
                self.jobs[uuid.UUID(job_id)] = {
                    "id": uuid.UUID(job_id),
                    "title": "Senior Backend Engineer (FastAPI)",
                    "description": "Build high-throughput APIs and integrate generative AI agents.",
                    "requirements": "Strong skills in Python, FastAPI, PostgreSQL, and AWS/Cloudflare R2.",
                    "created_by": uuid.UUID(client_id),
                    "token": "INV-REACT-SR",
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
        except Exception as e:
            logger.error(f"Error seeding Supabase database: {str(e)}")

# Initialize the global database engine client
db_url = settings.DATABASE_URL
if db_url and db_url != "#reqd key":
    try:
        db = SupabasePostgresDatabase(db_url)
        logger.info("🚀 Database client initialized successfully pointing to Supabase PostgreSQL.")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase PostgreSQL. Falling back to local JSON: {str(e)}")
        db = LocalJSONDatabaseFallback(os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json"))
else:
    logger.warning("Supabase DATABASE_URL is placeholder. Using local persistent JSON fallback database.")
    db = LocalJSONDatabaseFallback(os.path.join(os.path.dirname(os.path.abspath(__file__)), "db.json"))
