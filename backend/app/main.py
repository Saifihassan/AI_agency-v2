from dotenv import load_dotenv

load_dotenv(override=True)

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


_origins_env = os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in _origins_env.split(",")
    if o.strip()
] or ["http://localhost:3000", "http://127.0.0.1:3000"]
IS_DEBUG = os.getenv("BACKEND_DEBUG", "0") == "1"

fastapi_kwargs = dict(title="AI Agency OS Backend", version="2.0.0", lifespan=lifespan)
if not IS_DEBUG:
    fastapi_kwargs.update(docs_url=None, redoc_url=None, openapi_url=None)

app = FastAPI(**fastapi_kwargs)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    init_database()
except Exception as e:
    print(f"WARNING: database init skipped (read-only filesystem?): {e}")


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


@app.post("/api/workspaces")
async def create_workspace(req: CreateWorkspaceRequest):
    ws_id = add_workspace(req.name, req.website, req.industry)
    profile = await generate_company_profile(req.name, req.website, req.industry)
    profile_dict = profile.model_dump()
    profile_dict["website"] = req.website
    profile_dict["industry"] = req.industry
    insert_company_profile(ws_id, profile_dict)
    ws = fetch_workspace(ws_id)
    return {**ws, "profile": profile_dict}


@app.get("/api/workspaces")
def get_workspaces():
    workspaces = []
    for ws in fetch_workspaces():
        workspaces.append({**ws, "profile": fetch_company_profile(ws["id"])})
    return workspaces


@app.get("/api/workspaces/{ws_id}")
def get_workspace(ws_id: str):
    ws = fetch_workspace(ws_id)
    if not ws:
        raise HTTPException(404, "Workspace not found")
    profile = fetch_company_profile(ws_id)
    if profile:
        profile["website"] = ws["website"]
        profile["industry"] = ws["industry"]
    return {**ws, "profile": profile}


@app.delete("/api/workspaces/{ws_id}")
def remove_workspace(ws_id: str):
    if not delete_workspace(ws_id):
        raise HTTPException(404, "Workspace not found")
    return {"ok": True}


@app.post("/api/studio")
async def studio(req: StudioChatRequest):
    profile = None
    if req.workspace_id:
        profile = fetch_company_profile(req.workspace_id)
        if not fetch_workspace(req.workspace_id):
            profile = None
    history = list(req.history or [])
    if req.workspace_id:
        if not history:
            history = fetch_chat_history(req.workspace_id)[: -1]  # exclude just-saved user msg
        save_chat_message(req.workspace_id, "user", req.message)
    result = await run_studio_chat(req.message, history, profile)
    if req.workspace_id:
        save_chat_message(req.workspace_id, "assistant", result.message, result.response_type)
    return result


@app.get("/api/studio/{ws_id}/history")
def studio_history(ws_id: str):
    return fetch_chat_history(ws_id)


@app.post("/api/research")
async def research(req: ResearchRequest):
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
async def market_news(req: NewsRequest):
    report = await run_market_news_agent(req.workspace_id or "General", req.industry)
    if req.workspace_id:
        save_news(req.workspace_id, req.industry, report.model_dump())
    return report


@app.post("/api/outreach")
async def outreach(req: OutreachRequest):
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
async def competitor(req: CompetitorRequest):
    profile = fetch_company_profile(req.workspace_id) if req.workspace_id else None
    report = await run_competitor_agent(req.website, profile)
    if req.workspace_id:
        save_generated(
            "competitor",
            req.workspace_id,
            {"website": req.website, "report": report.model_dump()},
        )
    return report
