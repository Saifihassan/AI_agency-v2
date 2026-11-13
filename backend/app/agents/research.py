from agents import Agent, Runner, trace
from app.schemas import ResearchAnalysis, StrategyReport
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import RESEARCH_ANALYST, STRATEGY_ADVISOR

research_analyst = Agent(
    name="research_analyst",
    instructions=RESEARCH_ANALYST,
    output_type=ResearchAnalysis,
    model=velona,
    tools=[searxng_search, duckduckgo_search, tavily_search],
)

strategy_advisor = Agent(
    name="strategy_advisor",
    instructions=STRATEGY_ADVISOR,
    output_type=StrategyReport,
    model=velona,
    tools=[crawl4ai_scrape, firecrawl_scrape],
)

DEPTH_ALIASES = {
    "quick": "quick",
    "summary": "quick",
    "fast": "quick",
    "standard": "standard",
    "medium": "standard",
    "normal": "standard",
    "regular": "standard",
    "deep": "deep",
    "deep dive": "deep",
    "exhaustive": "deep",
}

DEPTH_LABELS = {
    "quick": "quick",
    "standard": "standard",
    "deep": "deep",
}


def normalize_depth(depth: str) -> str:
    return DEPTH_ALIASES.get((depth or "").strip().lower(), "standard")


def depth_directive(depth: str) -> str:
    depth = normalize_depth(depth)
    if depth == "quick":
        spec = (
            "Requested Research Depth: quick — "
            "make at most 2 search passes; return exactly 2-3 findings "
            "with single-sentence explanations; executive summary 3-4 sentences."
        )
    elif depth == "deep":
        spec = (
            "Requested Research Depth: deep — "
            "run 6-12 search passes covering multiple sub-angles (market size, "
            "regulations, key players, tech developments, funding, contrarian views); "
            "return 6-8 findings with 3-5 sentence explanations and 2-3 pieces of "
            "evidence each; executive summary 2 paragraphs."
        )
    else:
        spec = (
            "Requested Research Depth: standard — "
            "run 3-5 search passes; return exactly 4-5 findings with 2-3 sentence "
            "explanations and 1-2 pieces of evidence each; executive summary one paragraph."
        )
    return spec + f' The requested depth keyword is "{DEPTH_LABELS[depth]}".'


async def run_research(input: str, research_depth: str) -> dict:
    depth = normalize_depth(research_depth)
    with trace("research_flow"):
        query = f"Topic: {input}\n{depth_directive(depth)}"
        results = await Runner.run(research_analyst, query)
        strategy_query = (
            f"Research Analysis:\n{results.final_output.model_dump_json()}\n\n"
            f"Topic: {input}\n{depth_directive(depth)}"
        )
        report = await Runner.run(strategy_advisor, strategy_query)
        return {
            "research": results.final_output,
            "strategy": report.final_output,
        }
