from dotenv import load_dotenv

load_dotenv(override=True)

import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import APIStatusError, APIConnectionError, APIError
from pydantic import BaseModel

from app.auth import get_current_user
from app.mcp import make_obscura_server, attach_mcp, web_research_agents

from app.database import (
    IS_PG,
    init_database,
    add_workspace,
    fetch_workspaces,
    fetch_workspace,
    delete_workspace,
    insert_company_profile,
    fetch_company_profile,
    save_generated,
    save_news,
    save_chat_message,
    fetch_chat_history,
    record_usage,
    usage_status,
    add_provider,
    list_providers,
    get_active_provider,
    activate_provider,
    update_provider_model,
    delete_provider,
)
from app.crypto import encrypt_secret, decrypt_secret
from app.client import resolve_model, list_provider_models
from app.agents.profile import generate_company_profile
from app.agents.studio import run_studio_chat
from app.agents.research import run_research
from app.agents.news import run_market_news_agent
from app.agents.outreach import run_outreach_agent
from app.agents.competitor import run_competitor_agent

init_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        server = make_obscura_server()
        async with server:
            attach_mcp(server, web_research_agents())
            yield
    except Exception as e:
        print(f"WARNING: obscura MCP unavailable, agents run without it: {e}")
        yield


DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_configured_origins = [
    o.strip().rstrip("/")
    for o in (os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_URL", "")).split(",")
    if o.strip()
]
ALLOWED_ORIGINS = list(dict.fromkeys(DEFAULT_ORIGINS + _configured_origins))
ALLOWED_ORIGIN_REGEX = os.getenv("FRONTEND_ORIGIN_REGEX", r"^https://.*\.vercel\.app$").strip() or None
IS_DEBUG = os.getenv("BACKEND_DEBUG", "0") == "1"

fastapi_kwargs = dict(title="AI Agency OS Backend", version="2.0.0", lifespan=lifespan)
if not IS_DEBUG:
    fastapi_kwargs.update(docs_url=None, redoc_url=None, openapi_url=None)

app = FastAPI(**fastapi_kwargs)


@app.exception_handler(APIStatusError)
async def provider_status_error(request: Request, exc: APIStatusError):
    return JSONResponse(
        status_code=502,
        content={
            "detail": (
                f"Your provider rejected the request ({exc.status_code}): "
                f"{exc.message}. If you selected a custom model, it may not "
                "support tool calling or structured output — try another model."
            )
        },
    )


@app.exception_handler(APIConnectionError)
async def provider_connection_error(request: Request, exc: APIConnectionError):
    return JSONResponse(
        status_code=502,
        content={"detail": f"Could not reach your provider: {exc}"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProviderConfigRequest(BaseModel):
    base_url: str
    api_key: str
    label: str | None = None


class ProviderModelRequest(BaseModel):
    module: str
    model: str
    provider_id: str | None = None


class CreateWorkspaceRequest(BaseModel):
    name: str
    website: str
    industry: str
    model: str | None = None


class StudioChatRequest(BaseModel):
    message: str
    history: list | None = None
    workspace_id: str | None = None
    model: str | None = None


class ResearchRequest(BaseModel):
    topic: str
    depth: str = "medium"
    workspace_id: str | None = None
    model: str | None = None


class NewsRequest(BaseModel):
    industry: str
    workspace_id: str | None = None
    model: str | None = None


class OutreachRequest(BaseModel):
    website: str
    service: str
    tone: str = "Direct"
    workspace_id: str | None = None
    model: str | None = None


class CompetitorRequest(BaseModel):
    website: str
    workspace_id: str | None = None
    model: str | None = None


@app.get("/api/health")
def health():
    return {"status": "ok", "db": "postgres" if IS_PG else "sqlite"}


@app.get("/api/usage")
def usage(user: dict = Depends(get_current_user)):
    return {
        "limit": MODULE_LIMIT,
        "window_hours": MODULE_WINDOW_HOURS,
        "modules": {
            m: usage_status(user["id"], m, MODULE_LIMIT, MODULE_WINDOW_HOURS)
            for m in MODULES
        },
    }


MODULE_LIMIT = int(os.getenv("MODULE_DAILY_LIMIT", "3"))
MODULE_WINDOW_HOURS = int(os.getenv("MODULE_LIMIT_WINDOW_HOURS", "24"))
MODULES = ["research", "news", "outreach", "competitor", "studio", "workspace"]


def enforce_usage(user: dict, module: str) -> dict:
    """Rolling-window per-module quota. Skipped entirely when BYOK is configured."""
    if get_active_provider(user["id"]):
        return {"module": module, "used": 0, "limit": MODULE_LIMIT, "remaining": MODULE_LIMIT, "reset_at": None}
    status = usage_status(user["id"], module, MODULE_LIMIT, MODULE_WINDOW_HOURS)
    if status["used"] >= MODULE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "usage_limit",
                "module": module,
                "limit": MODULE_LIMIT,
                "used": status["used"],
                "window_hours": MODULE_WINDOW_HOURS,
                "reset_at": status["reset_at"],
            },
        )
    record_usage(user["id"], module)
    return status


def user_model(user: dict, module: str, override: str | None = None):
    provider = get_active_provider(user["id"])
    if not provider:
        return None
    api_key = decrypt_secret(provider["api_key"])
    if not api_key:
        return None
    chosen = override or (provider.get("model_map") or {}).get(module)
    if not chosen and provider.get("models"):
        from app.client import DEFAULT_MODEL
        chosen = DEFAULT_MODEL if DEFAULT_MODEL in provider["models"] else provider["models"][0]
    return resolve_model(provider["base_url"], api_key, chosen)


def _public_provider(provider: dict) -> dict:
    return {
        "id": provider["id"],
        "label": provider.get("label") or provider["base_url"],
        "base_url": provider["base_url"],
        "models": provider["models"],
        "model_map": provider["model_map"],
        "is_active": provider["is_active"],
    }


def providers_payload(user: dict) -> dict:
    items = [_public_provider(p) for p in list_providers(user["id"])]
    active = next((p for p in items if p["is_active"]), None)
    return {
        "configured": active is not None,
        "providers": items,
        "active_id": active["id"] if active else None,
        "base_url": active["base_url"] if active else None,
        "models": active["models"] if active else [],
        "model_map": active["model_map"] if active else {},
    }


def owned_workspace(ws_id: str | None, user: dict):
    """Verify a workspace exists and belongs to the caller (403 otherwise)."""
    if not ws_id:
        return None
    ws = fetch_workspace(ws_id)
    if ws and ws.get("user_id") and ws["user_id"] != user["id"]:
        raise HTTPException(403, "Not your workspace")
    return ws


@app.get("/api/providers")
def get_providers(user: dict = Depends(get_current_user)):
    return providers_payload(user)


@app.post("/api/providers")
async def connect_provider(req: ProviderConfigRequest, user: dict = Depends(get_current_user)):
    base_url = (req.base_url or "").strip().rstrip("/")
    api_key = (req.api_key or "").strip()
    if not base_url.startswith(("http://", "https://")):
        raise HTTPException(400, "Base URL must start with http:// or https://")
    if not api_key:
        raise HTTPException(400, "API key is required")
    try:
        models = await list_provider_models(base_url, api_key)
    except Exception as exc:
        raise HTTPException(400, f"Could not list models for that provider: {exc}") from exc
    if not models:
        raise HTTPException(400, "Provider returned no models")
    label = (req.label or "").strip() or base_url.split("//")[-1].split("/")[0]
    add_provider(user["id"], label, base_url, encrypt_secret(api_key), models)
    return providers_payload(user)


@app.post("/api/providers/{provider_id}/activate")
def switch_provider(provider_id: str, user: dict = Depends(get_current_user)):
    if not activate_provider(user["id"], provider_id):
        raise HTTPException(404, "Provider not found")
    return providers_payload(user)


@app.put("/api/providers/model")
def set_provider_model(req: ProviderModelRequest, user: dict = Depends(get_current_user)):
    if req.module not in MODULES:
        raise HTTPException(400, "Unknown module")
    if not update_provider_model(user["id"], req.module, req.model.strip(), req.provider_id):
        raise HTTPException(404, "No provider configured")
    return providers_payload(user)


@app.delete("/api/providers/{provider_id}")
def remove_provider(provider_id: str, user: dict = Depends(get_current_user)):
    if not delete_provider(user["id"], provider_id):
        raise HTTPException(404, "Provider not found")
    return providers_payload(user)


@app.post("/api/workspaces")
async def create_workspace(req: CreateWorkspaceRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "workspace")
    ws_id = add_workspace(user["id"], req.name, req.website, req.industry)
    profile = await generate_company_profile(req.name, req.website, req.industry, user_model(user, "workspace", req.model))
    profile_dict = profile.model_dump()
    profile_dict["website"] = req.website
    profile_dict["industry"] = req.industry
    insert_company_profile(ws_id, profile_dict)
    ws = fetch_workspace(ws_id)
    return {**ws, "profile": profile_dict}


@app.get("/api/workspaces")
def get_workspaces(user: dict = Depends(get_current_user)):
    workspaces = []
    for ws in fetch_workspaces(user["id"]):
        workspaces.append({**ws, "profile": fetch_company_profile(ws["id"])})
    return workspaces


@app.get("/api/workspaces/{ws_id}")
def get_workspace(ws_id: str, user: dict = Depends(get_current_user)):
    ws = owned_workspace(ws_id, user)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    profile = fetch_company_profile(ws_id)
    if profile:
        profile["website"] = ws["website"]
        profile["industry"] = ws["industry"]
    return {**ws, "profile": profile}


@app.delete("/api/workspaces/{ws_id}")
def remove_workspace(ws_id: str, user: dict = Depends(get_current_user)):
    ws = owned_workspace(ws_id, user)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    delete_workspace(ws_id)
    return {"ok": True}


@app.post("/api/studio")
async def studio(req: StudioChatRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "studio")
    ws = owned_workspace(req.workspace_id, user)
    profile = fetch_company_profile(req.workspace_id) if ws else None
    history = list(req.history or [])
    if ws:
        if not history:
            history = fetch_chat_history(req.workspace_id)[: -1]  # exclude just-saved user msg
        save_chat_message(req.workspace_id, "user", req.message)
    result = await run_studio_chat(req.message, history, profile, user_model(user, "studio", req.model))
    if ws:
        save_chat_message(req.workspace_id, "assistant", result.message, result.response_type)
    return result


@app.get("/api/studio/{ws_id}/history")
def studio_history(ws_id: str, user: dict = Depends(get_current_user)):
    if not owned_workspace(ws_id, user):
        raise HTTPException(404, "Workspace not found")
    return fetch_chat_history(ws_id)


@app.post("/api/research")
async def research(req: ResearchRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "research")
    owned_workspace(req.workspace_id, user)
    result = await run_research(req.topic, req.depth, user_model(user, "research", req.model))
    if req.workspace_id:
        save_generated(
            "research",
            req.workspace_id,
            {
                "topic": req.topic,
                "depth": req.depth,
                "research": result["research"].model_dump(),
                "strategy": result["strategy"].model_dump(),
            },
        )
    return result


@app.post("/api/news")
async def market_news(req: NewsRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "news")
    owned_workspace(req.workspace_id, user)
    report = await run_market_news_agent(req.workspace_id or "General", req.industry, user_model(user, "news", req.model))
    if req.workspace_id:
        save_news(req.workspace_id, req.industry, report.model_dump())
    return report


@app.post("/api/outreach")
async def outreach(req: OutreachRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "outreach")
    owned_workspace(req.workspace_id, user)
    result = await run_outreach_agent(req.website, req.service, req.tone, user_model(user, "outreach", req.model))
    if req.workspace_id:
        save_generated(
            "outreach",
            req.workspace_id,
            {
                "website": req.website,
                "service": req.service,
                "tone": req.tone,
                "prospect_analysis": result["prospect_analysis"].model_dump(),
                "outreach_sequence": result["outreach_sequence"].model_dump(),
            },
        )
    return result


@app.post("/api/competitor")
async def competitor(req: CompetitorRequest, user: dict = Depends(get_current_user)):
    enforce_usage(user, "competitor")
    ws = owned_workspace(req.workspace_id, user)
    profile = fetch_company_profile(req.workspace_id) if ws else None
    report = await run_competitor_agent(req.website, profile, user_model(user, "competitor", req.model))
    if req.workspace_id:
        save_generated(
            "competitor",
            req.workspace_id,
            {"website": req.website, "report": report.model_dump()},
        )
    return report
