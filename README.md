# AI Agency OS v2

Full-stack rebuild of [AI_Agency_OS](../AI_Agency_OS) — the Streamlit prototype rebuilt as a modern web product. The agent brain stays Python (`openai-agents` + FastAPI), the UI moves to Next.js.

## Structure

```
ai-agency-os-v2/
├── frontend/   Next.js 16 + React 19 + TypeScript (no build-tool config needed)
└── backend/    FastAPI + openai-agents (to be built here)
```

## What it does (mirrors the original, one page per workflow)

| Page | What it does | Original equivalent |
|---|---|---|
| `/` Dashboard | Workspace overview, agent run counters, recent modules | Dashboard page |
| `/workspaces` | Create client workspaces → AI generates the company profile that context-powers every agent | Create Workspace + `workspace_init.py` |
| `/studio` | Brief → manager agent plans the campaign → generates marketing / email / social assets | `campaign.py` |
| `/research` | Topic → research analyst findings → strategy advisor playbook | `research.py` |
| `/news` | Industry → live news pipeline → headlines, trends, opportunities | `market_news.py` |
| `/outreach` | Prospect website → site analysis → cold email + 2 follow-ups | `outreach_agent.py` |
| `/competitor` | Competitor website → snapshot, strengths/weaknesses, attack strategy | `competitor.py` |

## Frontend

```bash
cd frontend
npm run dev          # http://localhost:3000
npm run build        # production build (passes clean)
```

- **State**: `components/workspace.tsx` — workspaces, active workspace, module usage + recency (persisted to localStorage for now; moves to the DB via the API)
- **Types**: `lib/types.ts` — TS mirrors of the Python pydantic schemas (`ResearchAnalysis`, `StrategyReport`, `MarketIntelligenceReport`, `OutreachSequence`, `CompetitiveAnalysis`, `CampaignPlan`/`CampaignAssets`, `CompanyProfile`)
- **API layer**: `lib/api.ts` — every module calls `POST ${NEXT_PUBLIC_API_URL}/api/{module}`; if the URL is unset or the call fails it transparently falls back to realistic mock data from `lib/mock.ts`, so the UI is fully explorable before the backend exists

## Backend contract (to implement in FastAPI)

`NEXT_PUBLIC_API_URL=http://localhost:8000`

| Endpoint | Body | Response |
|---|---|---|
| `POST /api/profile` | `{name, website, industry}` | `CompanyProfile` |
| `POST /api/studio` | `{prompt, workspace, profile, requested_assets}` | `{plan: CampaignPlan, assets: CampaignAssets}` |
| `POST /api/research` | `{topic, depth, workspace}` | `{research: ResearchAnalysis, strategy: StrategyReport}` |
| `POST /api/news` | `{industry, workspace}` | `MarketIntelligenceReport` |
| `POST /api/outreach` | `{website, service, tone, workspace}` | `{prospect_analysis, outreach_sequence}` |
| `POST /api/competitor` | `{website, workspace}` | `CompetitiveAnalysis` |

Response shapes must match `lib/types.ts` exactly (snake_case keys) — the frontend renders generically from them.

## Next steps

1. Port the agents from `../AI_Agency_OS/ai_agents/` into `backend/agents/` (single Velona provider, per `clients.py`)
2. FastAPI routes per the contract above, CORS for `localhost:3000`
3. SQLite tables (`workspaces`, `company_profile`, `research_reports`, `competitors`, `market_news`, `generated_content`) — port from the original `Database/db.py`
4. Swap `lib/api.ts` mock fallback `workspaces` arg for real profile injection


## Backend

1. Create Python venv and install deps:
```bash
cd backend
uv venv
.venv/bin/pip install -e .
```
1. Add env vars: copy `.env.example` to `.env` and fill in real values (Velona, SearXNG, Tavily, Serper, Crawl4AI, Firecrawl).
1. Run: `uvicorn app.main:app --reload --port 8000`

## Next Steps
- [x] Frontend module pages with mock fallback
- [x] FastAPI backend with all 6 modules + workspace CRUD
- [x] Studio as chat interface (ManagerResponse)
