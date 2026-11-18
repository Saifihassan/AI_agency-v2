import os
import json
import uuid
from datetime import datetime, timezone

DB_URL = (os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL") or "").strip()
IS_PG = bool(DB_URL)

if IS_PG:
    import psycopg2
    import psycopg2.extras


def _q(sql: str) -> str:
    return sql.replace("?", "%s") if IS_PG else sql


def get_connection():
    if IS_PG:
        return psycopg2.connect(DB_URL, sslmode="require")
    import sqlite3

    db_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "agency.db"
    )
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _execute(con, sql, params=()):
    if IS_PG:
        cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(_q(sql), params)
        return cur
    return con.execute(sql, params)


def _commit_close(con):
    con.commit()
    con.close()


def init_database():
    con = get_connection()
    auto_pk = "BIGSERIAL PRIMARY KEY" if IS_PG else "INTEGER PRIMARY KEY AUTOINCREMENT"
    ts = "TIMESTAMPTZ DEFAULT NOW()" if IS_PG else "TEXT DEFAULT CURRENT_TIMESTAMP"
    script = f"""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            website TEXT,
            industry TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS company_profile (
            id {auto_pk},
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
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS research_reports (
            id {auto_pk},
            workspace_id TEXT,
            report_data TEXT,
            depth TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS competitors (
            id {auto_pk},
            workspace_id TEXT,
            website TEXT,
            report_data TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS market_news (
            id {auto_pk},
            workspace_id TEXT,
            industry TEXT,
            report_data TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS generated_content (
            id {auto_pk},
            workspace_id TEXT,
            content_kind TEXT,
            payload TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id {auto_pk},
            workspace_id TEXT,
            role TEXT,
            content TEXT,
            response_type TEXT,
            created_at {ts}
        );
    """
    if IS_PG:
        _execute(con, script)
    else:
        con.executescript(script)
    _commit_close(con)


def delete_workspace(ws_id: str) -> bool:
    con = get_connection()
    if not _execute(con, "SELECT id FROM workspaces WHERE id = ?", (ws_id,)).fetchone():
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
            _execute(con, "DELETE FROM workspaces WHERE id = ?", (ws_id,))
        else:
            _execute(con, f"DELETE FROM {table} WHERE workspace_id = ?", (ws_id,))
    _commit_close(con)
    return True


def _val(v):
    if isinstance(v, datetime):
        return v.isoformat(timespec="seconds")
    return v


def ws_row_to_dict(row):
    return {
        "id": _val(row["id"]),
        "name": _val(row["name"]),
        "website": _val(row["website"]),
        "industry": _val(row["industry"]),
        "createdAt": _val(row["created_at"]),
    }


def add_workspace(name: str, website: str, industry: str) -> str:
    con = get_connection()
    ws_id = str(uuid.uuid4())
    _execute(
        con,
        "INSERT INTO workspaces (id, name, website, industry) VALUES (?, ?, ?, ?)",
        (ws_id, name, website, industry),
    )
    _commit_close(con)
    return ws_id


def fetch_workspaces():
    con = get_connection()
    rows = _execute(
        con, "SELECT * FROM workspaces ORDER BY created_at DESC"
    ).fetchall()
    con.close()
    return [ws_row_to_dict(r) for r in rows]


def fetch_workspace(ws_id: str):
    con = get_connection()
    row = _execute(con, "SELECT * FROM workspaces WHERE id = ?", (ws_id,)).fetchone()
    con.close()
    return ws_row_to_dict(row) if row else None


def insert_company_profile(ws_id: str, profile: dict):
    con = get_connection()
    _execute(
        con,
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
    _commit_close(con)


def fetch_company_profile(ws_id: str):
    con = get_connection()
    row = _execute(
        con,
        "SELECT * FROM company_profile WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 1",
        (ws_id,),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {
        "company_name": _val(row["company_name"]),
        "website": _val(row["website"]),
        "industry": _val(row["industry"]),
        "company_summary": _val(row["company_summary"]),
        "description": _val(row["description"]),
        "products_services": json.loads(row["products_services"] or "[]"),
        "target_audience": _val(row["target_audience"]),
        "brand_voice": _val(row["brand_voice"]),
        "value_proposition": _val(row["value_proposition"]),
        "keywords": json.loads(row["keywords"] or "[]"),
    }


def save_generated(kind: str, ws_id: str, payload: dict):
    con = get_connection()
    _execute(
        con,
        "INSERT INTO generated_content (workspace_id, content_kind, payload) VALUES (?, ?, ?)",
        (ws_id, kind, json.dumps(payload, default=str)),
    )
    _commit_close(con)


def save_news(ws_id: str, industry: str, report: dict):
    con = get_connection()
    _execute(
        con,
        "INSERT INTO market_news (workspace_id, industry, report_data) VALUES (?, ?, ?)",
        (ws_id, industry, json.dumps(report, default=str)),
    )
    _commit_close(con)


def save_chat_message(ws_id: str, role: str, content: str, response_type: str = "chat"):
    con = get_connection()
    _execute(
        con,
        "INSERT INTO chat_messages (workspace_id, role, content, response_type) VALUES (?, ?, ?, ?)",
        (ws_id, role, content, response_type),
    )
    _commit_close(con)


def fetch_chat_history(ws_id: str, limit: int = 40):
    con = get_connection()
    rows = _execute(
        con,
        """
        SELECT role, content, response_type FROM chat_messages
        WHERE workspace_id = ? ORDER BY id DESC LIMIT ?
        """,
        (ws_id, limit),
    ).fetchall()
    con.close()
    return [
        {
            "role": _val(r["role"]),
            "content": _val(r["content"]),
            "response_type": _val(r["response_type"]),
        }
        for r in reversed(rows)
    ]


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
