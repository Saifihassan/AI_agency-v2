from zoneinfo import ZoneInfo
from datetime import datetime
from urllib.parse import urlsplit
import re
from json import loads
from agents import Agent, Runner, trace
from app.schemas import NewsResearch, NewsArticle, MarketIntelligenceReport
from app.client import velona
from app.tools import (
    tavily_search,
    duckduckgo_search,
    searxng_search,
    news_domain_search,
    ALLOWED_NEWS_DOMAINS,
)
from app.agents.prompts import (
    NEWS_RESEARCHER_INSTRUCTIONS,
    MARKET_ANALYST_INSTRUCTIONS,
    NEWS_SEARCHER_INSTRUCTIONS,
)

def _build_agents(model=None):
    m = model or velona
    return (
        Agent(
            name="news_researcher",
            instructions=NEWS_RESEARCHER_INSTRUCTIONS,
            model=m,
            tools=[news_domain_search, searxng_search, duckduckgo_search, tavily_search],
            output_type=NewsResearch,
        ),
        Agent(
            name="news_searcher",
            instructions=NEWS_SEARCHER_INSTRUCTIONS,
            model=m,
            tools=[news_domain_search],
        ),
        Agent(
            name="market_analyst",
            instructions=MARKET_ANALYST_INSTRUCTIONS,
            model=m,
            output_type=MarketIntelligenceReport,
        ),
    )

ALLOWED_DOMAINS = ALLOWED_NEWS_DOMAINS


def _domain_allowed(url: str) -> bool:
    host = (urlsplit(url).hostname or "").lower().removeprefix("www.")
    return any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS)


def _filter_research(research: NewsResearch) -> NewsResearch:
    kept = [a for a in research.articles if _domain_allowed(a.url)]
    if len(kept) != len(research.articles):
        research = NewsResearch(articles=kept)
    return research


def _extract_json(text: str):
    text = text.strip()
    if "```" in text:
        for seg in text.split("```"):
            if ("{" in seg) or ("[" in seg):
                text = seg.strip()
                break
    firstObj = text.find("{")
    firstArr = text.find("[")
    if firstObj == -1 and firstArr == -1:
        return []
    opener = "{" if (firstArr == -1 or (0 <= firstObj < firstArr)) and firstObj != -1 else "["
    closer = "}" if opener == "{" else "]"
    start = firstObj if opener == "{" else firstArr
    depth = 0
    for i in range(start, len(text)):
        if text[i] == opener:
            depth += 1
        elif text[i] == closer:
            depth -= 1
            if depth == 0:
                try:
                    return loads(text[start : i + 1])
                except Exception:
                    return []
    return []


def _parse_articles(raw) -> NewsResearch:
    if isinstance(raw, NewsResearch):
        return raw
    data = _extract_json(str(raw))
    articles_in = data
    if isinstance(data, dict):
        articles_in = data.get("articles") or []
    articles = []
    for a in articles_in if isinstance(articles_in, list) else []:
        if not isinstance(a, dict):
            continue
        try:
            articles.append(
                NewsArticle(
                    title=str(a.get("title", ""))[:400],
                    category=str(a.get("category", ""))[:60],
                    source=str(a.get("source", ""))[:120],
                    url=str(a.get("url", "")),
                    published_date=str(a.get("published_date", ""))[:60],
                    summary=str(a.get("summary", ""))[:2000],
                )
            )
        except Exception:
            continue
    return NewsResearch(articles=articles)


async def run_market_news_agent(
    workspace_name: str = "General", industry: str = "technology", model=None
):
    _news_researcher, news_searcher, market_analyst = _build_agents(model)
    with trace("market_news_workflow"):
        prompt = (
            f"Gather the latest news for the {industry} industry, focused on how it "
            f"impacts companies like {workspace_name}. Use news_domain_search with "
            "different subsets of the allowed domains until you have enough candidates. "
            'If nothing is found in the allowed domains, return exactly "[]".'
        )
        search_result = await Runner.run(news_searcher, prompt)
        research = _filter_research(_parse_articles(search_result.final_output))
        if not research.articles:
            return MarketIntelligenceReport(
                generated_at=datetime.now(ZoneInfo("Asia/Kolkata")).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                one_liner_headlines=[],
                categorized_news=[],
                market_trends=[],
                opportunities=[],
            )
        analysis_result = await Runner.run(market_analyst, str(research))
        report = analysis_result.final_output
        report.generated_at = datetime.now(ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        return report
