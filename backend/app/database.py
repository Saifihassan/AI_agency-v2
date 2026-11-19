import os
import json
import uuid
from datetime import datetime, timedelta, timezone

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

        CREATE TABLE IF NOT EXISTS usage_events (
            id {auto_pk},
            user_id TEXT,
            module TEXT,
            created_at {ts}
        );

        CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            label TEXT,
            base_url TEXT NOT NULL,
            api_key TEXT NOT NULL,
            models TEXT,
            model_map TEXT,
            is_active INTEGER DEFAULT 0,
            updated_at {ts}
        );
    """
    if IS_PG:
        _execute(con, script)
        _execute(con, "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id TEXT")
    else:
        con.executescript(script)
        try:
            con.execute("ALTER TABLE workspaces ADD COLUMN user_id TEXT")
        except Exception:
            pass
    _commit_close(con)
    _migrate_legacy_providers()


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
        "user_id": _val(row["user_id"]) if row["user_id"] else None,
        "createdAt": _val(row["created_at"]),
    }


def add_workspace(user_id: str, name: str, website: str, industry: str) -> str:
    con = get_connection()
    ws_id = str(uuid.uuid4())
    _execute(
        con,
        "INSERT INTO workspaces (id, user_id, name, website, industry) VALUES (?, ?, ?, ?, ?)",
        (ws_id, user_id, name, website, industry),
    )
    _commit_close(con)
    return ws_id


def fetch_workspaces(user_id: str | None = None):
    con = get_connection()
    if user_id:
        rows = _execute(
            con,
            "SELECT * FROM workspaces WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    else:
        rows = _execute(con, "SELECT * FROM workspaces ORDER BY created_at DESC").fetchall()
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


# ---------- bring-your-own-key provider config ----------

def _provider_row(row) -> dict:
    data = dict(row)
    try:
        data["models"] = json.loads(data.get("models") or "[]")
    except (TypeError, ValueError):
        data["models"] = []
    try:
        data["model_map"] = json.loads(data.get("model_map") or "{}")
    except (TypeError, ValueError):
        data["model_map"] = {}
    data["is_active"] = bool(data.get("is_active"))
    return data


def list_providers(user_id: str) -> list[dict]:
    con = get_connection()
    rows = _execute(
        con,
        "SELECT id, user_id, label, base_url, api_key, models, model_map, is_active "
        "FROM providers WHERE user_id = ? ORDER BY is_active DESC, updated_at ASC",
        (user_id,),
    ).fetchall()
    con.close()
    return [_provider_row(r) for r in rows]


def get_active_provider(user_id: str) -> dict | None:
    con = get_connection()
    row = _execute(
        con,
        "SELECT id, user_id, label, base_url, api_key, models, model_map, is_active "
        "FROM providers WHERE user_id = ? AND is_active = 1 LIMIT 1",
        (user_id,),
    ).fetchone()
    con.close()
    return _provider_row(row) if row is not None else None


def add_provider(user_id: str, label: str, base_url: str, encrypted_key: str, models: list[str]) -> dict:
    provider_id = str(uuid.uuid4())
    has_active = get_active_provider(user_id) is not None
    con = get_connection()
    _execute(
        con,
        "INSERT INTO providers (id, user_id, label, base_url, api_key, models, model_map, is_active) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            provider_id,
            user_id,
            label,
            base_url,
            encrypted_key,
            json.dumps(models),
            json.dumps({}),
            0 if has_active else 1,
        ),
    )
    _commit_close(con)
    con = get_connection()
    row = _execute(
        con,
        "SELECT id, user_id, label, base_url, api_key, models, model_map, is_active "
        "FROM providers WHERE id = ?",
        (provider_id,),
    ).fetchone()
    con.close()
    return _provider_row(row)


def activate_provider(user_id: str, provider_id: str) -> bool:
    con = get_connection()
    owned = _execute(
        con, "SELECT id FROM providers WHERE id = ? AND user_id = ?", (provider_id, user_id)
    ).fetchone()
    if owned is None:
        con.close()
        return False
    _execute(con, "UPDATE providers SET is_active = 0 WHERE user_id = ?", (user_id,))
    _execute(con, "UPDATE providers SET is_active = 1 WHERE id = ?", (provider_id,))
    _commit_close(con)
    return True


def update_provider_model(user_id: str, module: str, model: str, provider_id: str | None = None) -> bool:
    provider = None
    if provider_id:
        for candidate in list_providers(user_id):
            if candidate["id"] == provider_id:
                provider = candidate
                break
    else:
        provider = get_active_provider(user_id)
    if provider is None:
        return False
    model_map = provider["model_map"] or {}
    if model:
        model_map[module] = model
    else:
        model_map.pop(module, None)
    con = get_connection()
    _execute(
        con,
        "UPDATE providers SET model_map = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (json.dumps(model_map), provider["id"]),
    )
    _commit_close(con)
    return True


def delete_provider(user_id: str, provider_id: str) -> bool:
    con = get_connection()
    row = _execute(
        con, "SELECT is_active FROM providers WHERE id = ? AND user_id = ?", (provider_id, user_id)
    ).fetchone()
    if row is None:
        con.close()
        return False
    was_active = bool(dict(row).get("is_active"))
    _execute(con, "DELETE FROM providers WHERE id = ?", (provider_id,))
    _commit_close(con)
    if was_active:
        remaining = list_providers(user_id)
        if remaining:
            activate_provider(user_id, remaining[0]["id"])
    return True


def _migrate_legacy_providers():
    """Move rows from the old single-provider table into `providers`."""
    con = get_connection()
    try:
        if IS_PG:
            exists = _execute(
                con,
                "SELECT 1 AS ok FROM information_schema.tables WHERE table_name = 'user_providers'",
            ).fetchone()
        else:
            exists = _execute(
                con, "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'user_providers'"
            ).fetchone()
        if exists is None:
            con.close()
            return
        rows = _execute(
            con,
            "SELECT user_id, base_url, api_key, models, model_map FROM user_providers",
        ).fetchall()
        for row in rows:
            data = dict(row)
            _execute(
                con,
                "INSERT INTO providers (id, user_id, label, base_url, api_key, models, model_map, is_active) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
                (
                    str(uuid.uuid4()),
                    data["user_id"],
                    "Migrated provider",
                    data["base_url"],
                    data["api_key"],
                    data.get("models") or "[]",
                    data.get("model_map") or "{}",
                ),
            )
        _execute(con, "DROP TABLE user_providers")
        con.commit()
    except Exception:
        pass
    finally:
        try:
            con.close()
        except Exception:
            pass


# ---------- usage accounting (rolling window, per user per module) ----------

def _window_cutoff(hours: int):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    if IS_PG:
        return cutoff
    return cutoff.strftime("%Y-%m-%d %H:%M:%S")


def count_usage(user_id: str, module: str, window_hours: int = 24) -> int:
    con = get_connection()
    row = _execute(
        con,
        "SELECT COUNT(*) AS n FROM usage_events WHERE user_id = ? AND module = ? AND created_at >= ?",
        (user_id, module, _window_cutoff(window_hours)),
    ).fetchone()
    con.close()
    if row is None:
        return 0
    return int(row["n"])


def record_usage(user_id: str, module: str):
    con = get_connection()
    _execute(
        con,
        "INSERT INTO usage_events (user_id, module) VALUES (?, ?)",
        (user_id, module),
    )
    _execute(
        con,
        "DELETE FROM usage_events WHERE created_at < ?",
        (_window_cutoff(24 * 30),),
    )
    _commit_close(con)


def _value(v):
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            try:
                return datetime.strptime(v, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            except ValueError:
                return None
    return None


def usage_status(user_id: str, module: str, limit: int, window_hours: int = 24) -> dict:
    con = get_connection()
    rows = _execute(
        con,
        "SELECT created_at FROM usage_events WHERE user_id = ? AND module = ? AND created_at >= ? ORDER BY created_at ASC",
        (user_id, module, _window_cutoff(window_hours)),
    ).fetchall()
    con.close()
    used = len(rows)
    reset_at = None
    if used >= limit and rows:
        oldest = _value(rows[used - limit]["created_at"])
        if oldest:
            reset_at = (oldest + timedelta(hours=window_hours)).isoformat(timespec="seconds")
    return {"module": module, "used": used, "limit": limit, "remaining": max(0, limit - used), "reset_at": reset_at}
