from zoneinfo import ZoneInfo
from asyncio import gather
from datetime import datetime
from urllib.parse import urlsplit
from agents import Agent, Runner, trace
from app.schemas import NewsResearch, NewsArticle, MarketIntelligenceReport
from app.client import velona
from app.tools import tavily_search, duckduckgo_search, searxng_search, serper_search
from app.agents.prompts import NEWS_RESEARCHER_INSTRUCTIONS, MARKET_ANALYST_INSTRUCTIONS

news_researcher = Agent(
    name="news_researcher",
    instructions=NEWS_RESEARCHER_INSTRUCTIONS,
    model=velona,
    tools=[searxng_search, duckduckgo_search, tavily_search, serper_search],
    output_type=NewsResearch,
)

market_analyst = Agent(
    name="market_analyst",
    instructions=MARKET_ANALYST_INSTRUCTIONS,
    model=velona,
    output_type=MarketIntelligenceReport,
)

ALLOWED_DOMAINS = (
    "spectrum.ieee.org",
    "technews.acm.org",
    "nist.gov",
    "warc.com",
    "iab.com",
    "thinkwithgoogle.com",
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "worldbank.org",
    "ourworldindata.org",
)


def _domain_allowed(url: str) -> bool:
    host = (urlsplit(url).hostname or "").lower().removeprefix("www.")
    return any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS)


def _filter_research(research: NewsResearch) -> NewsResearch:
    kept = [a for a in research.articles if _domain_allowed(a.url)]
    if len(kept) != len(research.articles):
        research = NewsResearch(articles=kept)
    return research


async def run_market_news_agent(workspace_name: str = "General", industry: str = "technology"):
    with trace("market_news_workflow"):
        prompt = (
            f"Find the most recent news related to the {industry} industry, specifically "
            f"focusing on how it impacts companies like {workspace_name}. Look for tech, "
            "marketing, startup, and AI trends relevant to this. Restrict every search "
            "and every article to the allowed domains in your instructions there are no "
            "exceptions; if nothing relevant exists there, say so by returning no articles."
        )
        research_result = await Runner.run(news_researcher, prompt)
        research = _filter_research(research_result.final_output)
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
