from agents import Agent, Runner, trace
from app.schemas import CompetitiveAnalysis
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import COMPETITOR_ANALYZER_INSTRUCTIONS

competitor_analyzer = Agent(
    name="competitor_analyzer",
    instructions=COMPETITOR_ANALYZER_INSTRUCTIONS,
    model=velona,
    output_type=CompetitiveAnalysis,
    tools=[searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape],
)


async def run_competitor_agent(
    target_website: str, company_profile: dict = None
) -> CompetitiveAnalysis:
    prompt = f"Target Website: {target_website}"
    if company_profile:
        prompt += (
            f"\nOur Company Name: {company_profile.get('company_name')}"
            f"\nOur Company Summary: {company_profile.get('company_summary')}"
            f"\nOur Company Description: {company_profile.get('description')}"
        )
    with trace("competitor_analysis"):
        result = await Runner.run(competitor_analyzer, prompt)
        return result.final_output
