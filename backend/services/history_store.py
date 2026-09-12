"""
Lightweight JSON metadata store for inference history.
Uses SQLite for persistence; no external DB needed.
"""

import json
import sqlite3
import threading
import time
from pathlib import Path

DB_PATH = Path("data") / "history.sqlite"
_lock = threading.Lock()


def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init():
    with _lock, _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                ts REAL NOT NULL,
                filename TEXT NOT NULL,
                input_w INTEGER NOT NULL,
                input_h INTEGER NOT NULL,
                output_w INTEGER NOT NULL,
                output_h INTEGER NOT NULL,
                processing_ms REAL NOT NULL,
                device TEXT NOT NULL,
                model_version TEXT NOT NULL,
                output_path TEXT NOT NULL,
                original_path TEXT NOT NULL
            )
            """
        )
        c.commit()


def add_entry(entry: dict):
    with _lock, _conn() as c:
        c.execute(
            """
            INSERT INTO history (id, ts, filename, input_w, input_h, output_w, output_h,
                                 processing_ms, device, model_version, output_path, original_path)
            VALUES (:id, :ts, :filename, :input_w, :input_h, :output_w, :output_h,
                    :processing_ms, :device, :model_version, :output_path, :original_path)
            """,
            entry,
        )
        c.commit()


def list_entries() -> list[dict]:
    with _lock, _conn() as c:
        rows = c.execute("SELECT * FROM history ORDER BY ts DESC LIMIT 200").fetchall()
    return [dict(r) for r in rows]


def delete_entry(entry_id: str) -> bool:
    with _lock, _conn() as c:
        cur = c.execute("DELETE FROM history WHERE id = ?", (entry_id,))
        c.commit()
    return cur.rowcount > 0


def get_entry(entry_id: str) -> dict | None:
    with _lock, _conn() as c:
        row = c.execute("SELECT * FROM history WHERE id = ?", (entry_id,)).fetchone()
    return dict(row) if row else None