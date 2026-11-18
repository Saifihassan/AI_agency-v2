from dotenv import load_dotenv

load_dotenv(override=True)

import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth import get_current_user
from app.mcp import make_obscura_server, attach_mcp, web_research_agents

from app.database import (
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
)
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateWorkspaceRequest(BaseModel):
    name: str
    website: str
    industry: str


class StudioChatRequest(BaseModel):
    message: str
    history: list | None = None
    workspace_id: str | None = None


class ResearchRequest(BaseModel):
    topic: str
    depth: str = "medium"
    workspace_id: str | None = None


class NewsRequest(BaseModel):
    industry: str
    workspace_id: str | None = None


class OutreachRequest(BaseModel):
    website: str
    service: str
    tone: str = "Direct"
    workspace_id: str | None = None


class CompetitorRequest(BaseModel):
    website: str
    workspace_id: str | None = None


@app.get("/api/health")
def health():
    return {"status": "ok"}


def owned_workspace(ws_id: str | None, user: dict):
    """Verify a workspace exists and belongs to the caller (403 otherwise)."""
    if not ws_id:
        return None
    ws = fetch_workspace(ws_id)
    if ws and ws.get("user_id") and ws["user_id"] != user["id"]:
        raise HTTPException(403, "Not your workspace")
    return ws


@app.post("/api/workspaces")
async def create_workspace(req: CreateWorkspaceRequest, user: dict = Depends(get_current_user)):
    ws_id = add_workspace(user["id"], req.name, req.website, req.industry)
    profile = await generate_company_profile(req.name, req.website, req.industry)
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
    ws = owned_workspace(req.workspace_id, user)
    profile = fetch_company_profile(req.workspace_id) if ws else None
    history = list(req.history or [])
    if ws:
        if not history:
            history = fetch_chat_history(req.workspace_id)[: -1]  # exclude just-saved user msg
        save_chat_message(req.workspace_id, "user", req.message)
    result = await run_studio_chat(req.message, history, profile)
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
    owned_workspace(req.workspace_id, user)
    result = await run_research(req.topic, req.depth)
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
    owned_workspace(req.workspace_id, user)
    report = await run_market_news_agent(req.workspace_id or "General", req.industry)
    if req.workspace_id:
        save_news(req.workspace_id, req.industry, report.model_dump())
    return report


@app.post("/api/outreach")
async def outreach(req: OutreachRequest, user: dict = Depends(get_current_user)):
    owned_workspace(req.workspace_id, user)
    result = await run_outreach_agent(req.website, req.service, req.tone)
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
    ws = owned_workspace(req.workspace_id, user)
    profile = fetch_company_profile(req.workspace_id) if ws else None
    report = await run_competitor_agent(req.website, profile)
    if req.workspace_id:
        save_generated(
            "competitor",
            req.workspace_id,
            {"website": req.website, "report": report.model_dump()},
        )
    return report
