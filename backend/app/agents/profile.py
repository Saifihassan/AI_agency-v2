from agents import Agent, Runner, trace
from app.schemas import CompanyProfile
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, serper_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import COMPANY_PROFILE_GENERATOR_INSTRUCTIONS

company_profile_agent = Agent(
    name="company_profile_generator",
    instructions=COMPANY_PROFILE_GENERATOR_INSTRUCTIONS,
    model=velona,
    output_type=CompanyProfile,
    tools=[searxng_search, duckduckgo_search, tavily_search, serper_search, crawl4ai_scrape, firecrawl_scrape],
)


async def generate_company_profile(name: str, website: str, industry: str) -> CompanyProfile:
    prompt = f"Company: {name}, URL: {website}, Industry: {industry}"
    with trace("workspace_profile"):
        result = await Runner.run(company_profile_agent, prompt)
    return result.final_output
