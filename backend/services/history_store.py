"""
Metadata store for inference history using Supabase PostgreSQL.
"""

import os
import threading
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

_lock = threading.Lock()


def _get_db_url():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set!")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    return db_url


def _conn():
    conn = psycopg2.connect(_get_db_url(), cursor_factory=RealDictCursor)
    return conn


def init():
    with _lock:
        with _conn() as c:
            with c.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS history (
                        id TEXT PRIMARY KEY,
                        ts DOUBLE PRECISION NOT NULL,
                        filename TEXT NOT NULL,
                        input_w INTEGER NOT NULL,
                        input_h INTEGER NOT NULL,
                        output_w INTEGER NOT NULL,
                        output_h INTEGER NOT NULL,
                        processing_ms DOUBLE PRECISION NOT NULL,
                        device TEXT NOT NULL,
                        model_version TEXT NOT NULL,
                        output_path TEXT NOT NULL,
                        original_path TEXT NOT NULL
                    );
                    """
                )
            c.commit()


def add_entry(entry: dict):
    with _lock:
        with _conn() as c:
            with c.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO history (id, ts, filename, input_w, input_h, output_w, output_h,
                                         processing_ms, device, model_version, output_path, original_path)
                    VALUES (%(id)s, %(ts)s, %(filename)s, %(input_w)s, %(input_h)s, %(output_w)s, %(output_h)s,
                            %(processing_ms)s, %(device)s, %(model_version)s, %(output_path)s, %(original_path)s);
                    """,
                    entry,
                )
            c.commit()


def list_entries() -> list[dict]:
    with _lock:
        with _conn() as c:
            with c.cursor() as cur:
                cur.execute("SELECT * FROM history ORDER BY ts DESC LIMIT 200;")
                rows = cur.fetchall()
    return [dict(r) for r in rows]


def delete_entry(entry_id: str) -> bool:
    with _lock:
        with _conn() as c:
            with c.cursor() as cur:
                cur.execute("DELETE FROM history WHERE id = %s;", (entry_id,))
                deleted = cur.rowcount > 0
            c.commit()
    return deleted


def get_entry(entry_id: str) -> dict | None:
    with _lock:
        with _conn() as c:
            with c.cursor() as cur:
                cur.execute("SELECT * FROM history WHERE id = %s;", (entry_id,))
                row = cur.fetchone()
    return dict(row) if row else None