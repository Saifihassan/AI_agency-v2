from agents import Agent, Runner, trace
from app.schemas import ResearchAnalysis, StrategyReport
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, serper_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import RESEARCH_ANALYST, STRATEGY_ADVISOR

research_analyst = Agent(
    name="research_analyst",
    instructions=RESEARCH_ANALYST,
    output_type=ResearchAnalysis,
    model=velona,
    tools=[searxng_search, duckduckgo_search, tavily_search, serper_search],
)

strategy_advisor = Agent(
    name="strategy_advisor",
    instructions=STRATEGY_ADVISOR,
    output_type=StrategyReport,
    model=velona,
    tools=[crawl4ai_scrape, firecrawl_scrape],
)


async def run_research(input: str, research_depth: str) -> dict:
    with trace("research_flow"):
        query = f"Topic: {input}\nRequested Research Depth: {research_depth}"
        results = await Runner.run(research_analyst, query)
        strategy_query = (
            f"Research Analysis:\n{results.final_output.model_dump_json()}\n\n"
            f"Requested Research Depth: {research_depth}"
        )
        report = await Runner.run(strategy_advisor, strategy_query)
        return {
            "research": results.final_output,
            "strategy": report.final_output,
        }
