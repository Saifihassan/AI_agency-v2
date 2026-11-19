from agents import Agent, Runner, trace
from app.schemas import CompanyProfile
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import COMPANY_PROFILE_GENERATOR_INSTRUCTIONS

def _build_agent(model=None):
    return Agent(
        name="company_profile_generator",
        instructions=COMPANY_PROFILE_GENERATOR_INSTRUCTIONS,
        model=model or velona,
        output_type=CompanyProfile,
        tools=[searxng_search, duckduckgo_search, tavily_search, crawl4ai_scrape, firecrawl_scrape],
    )


async def generate_company_profile(
    name: str, website: str, industry: str, model=None
) -> CompanyProfile:
    company_profile_agent = _build_agent(model)
    prompt = f"Company: {name}, URL: {website}, Industry: {industry}"
    with trace("workspace_profile"):
        result = await Runner.run(company_profile_agent, prompt)
    return result.final_output
