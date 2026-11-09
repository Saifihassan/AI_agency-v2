from zoneinfo import ZoneInfo
from asyncio import gather
from datetime import datetime
from agents import Agent, Runner, trace
from app.schemas import NewsResearch, MarketIntelligenceReport
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


async def run_market_news_agent(workspace_name: str = "General", industry: str = "technology"):
    with trace("market_news_workflow"):
        prompt = (
            f"Find the most recent news related to the {industry} industry, specifically "
            f"focusing on how it impacts companies like {workspace_name}. Look for tech, "
            "marketing, startup, and AI trends relevant to this."
        )
        research_result = await Runner.run(news_researcher, prompt)
        analysis_result = await Runner.run(market_analyst, str(research_result.final_output))
        report = analysis_result.final_output
        report.generated_at = datetime.now(ZoneInfo("Asia/Kolkata")).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        return report
