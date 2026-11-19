from agents import Agent, Runner, trace
from app.schemas import ProspectAnalysis, OutreachSequence
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import (
    PROSPECT_ANALYZER_INSTRUCTIONS,
    OUTREACH_GENERATOR_INSTRUCTIONS,
)

def _build_agents(model=None):
    m = model or velona
    return (
        Agent(
            name="prospect_analyzer",
            instructions=PROSPECT_ANALYZER_INSTRUCTIONS,
            model=m,
            output_type=ProspectAnalysis,
            tools=[searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape],
        ),
        Agent(
            name="outreach_generator",
            instructions=OUTREACH_GENERATOR_INSTRUCTIONS,
            model=m,
            output_type=OutreachSequence,
        ),
    )


async def run_outreach_agent(
    website: str, service: str, outreach_tone: str = "Direct", model=None
) -> dict:
    prospect_analyzer, outreach_generator = _build_agents(model)
    with trace("outreach_sequence"):
        prompt = f"Website: {website}\nService Offered: {service}\nOutreach Tone: {outreach_tone}"
        res = await Runner.run(prospect_analyzer, prompt)
        outreach_seq = await Runner.run(
            outreach_generator, res.final_output.model_dump_json()
        )
        return {
            "prospect_analysis": res.final_output,
            "outreach_sequence": outreach_seq.final_output,
        }
