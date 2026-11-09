from agents import Agent, Runner, trace
from app.schemas import CampaignPlan, CampaignAssets, ManagerResponse
from app.client import velona
from app.tools import searxng_search, duckduckgo_search, tavily_search, serper_search, crawl4ai_scrape, firecrawl_scrape
from app.agents.prompts import (
    CAMPAIGN_PLANNER_INSTRUCTIONS,
    CONTENT_GENERATOR_INSTRUCTIONS,
    MANAGER_AGENT_INSTRUCTIONS,
)

campaign_planner = Agent(
    name="campaign_planner",
    instructions=CAMPAIGN_PLANNER_INSTRUCTIONS,
    model=velona,
    output_type=CampaignPlan,
    tools=[searxng_search, duckduckgo_search, tavily_search, serper_search, crawl4ai_scrape, firecrawl_scrape],
)

content_generator = Agent(
    name="content_generator",
    instructions=CONTENT_GENERATOR_INSTRUCTIONS,
    model=velona,
    output_type=CampaignAssets,
)

manager_tools = [
    campaign_planner.as_tool(
        tool_name="campaign_planner",
        tool_description="Plan a full campaign strategy from gathered context",
    ),
    content_generator.as_tool(
        tool_name="content_generator",
        tool_description="Generate specific marketing assets and copy",
    ),
]

manager_agent = Agent(
    name="manager_agent",
    instructions=MANAGER_AGENT_INSTRUCTIONS,
    model=velona,
    tools=manager_tools,
    output_type=ManagerResponse,
)


def _flatten_history(history: list[dict]) -> str:
    parts = []
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        parts.append(f"{role.capitalize()}: {content}")
    return "\n\n".join(parts)


async def run_studio_chat(
    user_query: str,
    history: list[dict] = None,
    company_profile: dict = None,
) -> ManagerResponse:
    query_to_send = user_query
    if company_profile:
        profile_str = (
            "--- CLIENT PROFILE CONTEXT ---\n"
            f"Name: {company_profile.get('company_name')}\n"
            f"Summary: {company_profile.get('company_summary')}\n"
            f"Description: {company_profile.get('description')}\n"
            f"Industry: {company_profile.get('industry')}\n"
            f"Target Audience: {company_profile.get('target_audience')}\n"
            f"Products/Services: {'; '.join(company_profile.get('products_services') or [])}\n"
            f"Value Proposition: {company_profile.get('value_proposition')}\n"
            f"Brand Voice: {company_profile.get('brand_voice')}\n"
            f"Keywords: {'; '.join(company_profile.get('keywords') or [])}\n"
            "------------------------------\n\n"
        )
        query_to_send = profile_str + query_to_send

    if history:
        history_str = _flatten_history(history[-20:])
        query_to_send = f"Conversation history:\n{history_str}\n\nUser's latest message: {user_query}"

    with trace("studio_chat"):
        result = await Runner.run(manager_agent, query_to_send)
        return result.final_output
