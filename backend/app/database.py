import sqlite3
import os
import json
import uuid
from datetime import datetime, timezone

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "agency.db"
)


def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    con = get_connection()
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            website TEXT,
            industry TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS company_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            company_name TEXT,
            website TEXT,
            industry TEXT,
            company_summary TEXT,
            description TEXT,
            products_services TEXT,
            target_audience TEXT,
            brand_voice TEXT,
            value_proposition TEXT,
            keywords TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS research_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            report_data TEXT,
            depth TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS competitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            website TEXT,
            report_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS market_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            industry TEXT,
            report_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS generated_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            content_kind TEXT,
            payload TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT,
            role TEXT,
            content TEXT,
            response_type TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    con.commit()
    con.close()


def delete_workspace(ws_id: str) -> bool:
    con = get_connection()
    cur = con.execute("SELECT id FROM workspaces WHERE id = ?", (ws_id,))
    if not cur.fetchone():
        con.close()
        return False
    for table in [
        "workspaces",
        "company_profile",
        "research_reports",
        "competitors",
        "market_news",
        "generated_content",
        "chat_messages",
    ]:
        if table == "workspaces":
            con.execute("DELETE FROM workspaces WHERE id = ?", (ws_id,))
        else:
            con.execute(
                f"DELETE FROM {table} WHERE workspace_id = ?", (ws_id,)
            )
    con.commit()
    con.close()
    return True


def ws_row_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "website": row["website"],
        "industry": row["industry"],
        "createdAt": row["created_at"],
    }


def add_workspace(name: str, website: str, industry: str) -> str:
    con = get_connection()
    ws_id = str(uuid.uuid4())
    con.execute(
        "INSERT INTO workspaces (id, name, website, industry) VALUES (?, ?, ?, ?)",
        (ws_id, name, website, industry),
    )
    con.commit()
    con.close()
    return ws_id


def fetch_workspaces():
    con = get_connection()
    rows = con.execute("SELECT * FROM workspaces ORDER BY created_at DESC").fetchall()
    con.close()
    return [ws_row_to_dict(r) for r in rows]


def fetch_workspace(ws_id: str):
    con = get_connection()
    row = con.execute("SELECT * FROM workspaces WHERE id = ?", (ws_id,)).fetchone()
    con.close()
    return ws_row_to_dict(row) if row else None


def insert_company_profile(ws_id: str, profile: dict):
    con = get_connection()
    con.execute(
        """
        INSERT INTO company_profile (
            workspace_id, company_name, website, industry, company_summary,
            description, products_services, target_audience, brand_voice,
            value_proposition, keywords
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ws_id,
            profile.get("company_name"),
            profile.get("website"),
            profile.get("industry"),
            profile.get("company_summary"),
            profile.get("description"),
            json.dumps(profile.get("products_services") or []),
            profile.get("target_audience"),
            profile.get("brand_voice"),
            profile.get("value_proposition"),
            json.dumps(profile.get("keywords") or []),
        ),
    )
    con.commit()
    con.close()


def fetch_company_profile(ws_id: str):
    con = get_connection()
    row = con.execute(
        "SELECT * FROM company_profile WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1",
        (ws_id,),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {
        "company_name": row["company_name"],
        "website": row["website"],
        "industry": row["industry"],
        "company_summary": row["company_summary"],
        "description": row["description"],
        "products_services": json.loads(row["products_services"] or "[]"),
        "target_audience": row["target_audience"],
        "brand_voice": row["brand_voice"],
        "value_proposition": row["value_proposition"],
        "keywords": json.loads(row["keywords"] or "[]"),
    }


def save_generated(kind: str, ws_id: str, payload: dict):
    con = get_connection()
    con.execute(
        "INSERT INTO generated_content (workspace_id, content_kind, payload) VALUES (?, ?, ?)",
        (ws_id, kind, json.dumps(payload, default=str)),
    )
    con.commit()
    con.close()


def save_news(ws_id: str, industry: str, report: dict):
    con = get_connection()
    con.execute(
        "INSERT INTO market_news (workspace_id, industry, report_data) VALUES (?, ?, ?)",
        (ws_id, industry, json.dumps(report, default=str)),
    )
    con.commit()
    con.close()


def save_chat_message(ws_id: str, role: str, content: str, response_type: str = "chat"):
    con = get_connection()
    con.execute(
        "INSERT INTO chat_messages (workspace_id, role, content, response_type) VALUES (?, ?, ?, ?)",
        (ws_id, role, content, response_type),
    )
    con.commit()
    con.close()


def fetch_chat_history(ws_id: str, limit: int = 40):
    con = get_connection()
    rows = con.execute(
        """
        SELECT role, content, response_type FROM chat_messages
        WHERE workspace_id = ? ORDER BY id DESC LIMIT ?
        """,
        (ws_id, limit),
    ).fetchall()
    con.close()
    return [
        {
            "role": r["role"],
            "content": r["content"],
            "response_type": r["response_type"],
        }
        for r in reversed(rows)
    ]


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
