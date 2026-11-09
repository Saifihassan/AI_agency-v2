import os
from agents.mcp import MCPServerStdio
from agents import Agent

OBSCURA_CMD = os.path.expanduser("~/obscura")


def web_research_agents() -> list[Agent]:
    from app.agents.profile import company_profile_agent
    from app.agents.studio import campaign_planner
    from app.agents.research import research_analyst, strategy_advisor
    from app.agents.news import news_researcher
    from app.agents.outreach import prospect_analyzer
    from app.agents.competitor import competitor_analyzer

    return [
        company_profile_agent,
        campaign_planner,
        research_analyst,
        strategy_advisor,
        news_researcher,
        prospect_analyzer,
        competitor_analyzer,
    ]


def make_obscura_server() -> MCPServerStdio:
    return MCPServerStdio(
        params={"command": OBSCURA_CMD, "args": ["mcp"]},
        cache_tools_list=True,
    )


def attach_mcp(server: MCPServerStdio, agents: list[Agent]):
    for agent in agents:
        agent.mcp_servers = list(agent.mcp_servers) + [server]
