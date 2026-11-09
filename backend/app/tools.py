from dotenv import load_dotenv
from tavily import TavilyClient
from agents import function_tool
import os
import json
import requests
from duckduckgo_search import DDGS
from firecrawl import FirecrawlApp

load_dotenv(override=True)

tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY", ""))


@function_tool
def tavily_search(query: str) -> str:
    """
    Search the web for up-to-date information.
    """
    response = tavily_client.search(
        query=query,
        search_depth="advanced",
        max_results=5,
    )
    return str(response.get("results"))


@function_tool
def duckduckgo_search(query: str) -> str:
    """
    Search the web using DuckDuckGo for up-to-date information.
    """
    results = DDGS().text(query, max_results=5)
    return str(results)


@function_tool
def serper_search(query: str) -> str:
    """
    Search the web using Google Search (via Serper API) for up-to-date information.
    """
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "num": 5})
    headers = {
        "X-API-KEY": os.getenv("SERPER_API_KEY", ""),
        "Content-Type": "application/json",
    }
    response = requests.post(url, headers=headers, data=payload, timeout=30)
    return str(response.json())


@function_tool
def searxng_search(query: str) -> str:
    """
    Search the web using SearXNG for up-to-date information.
    """
    url = (os.getenv("SEARXNG_URL") or "").rstrip("/") + "/search"
    params = {"q": query, "format": "json"}
    response = requests.get(url, params=params, timeout=30)
    return str(response.json())


@function_tool
def crawl4ai_scrape(url: str) -> str:
    """
    Scrape the content of a provided URL using hosted crawl4ai API.
    """
    base_url = os.getenv(
        "CRAWL4AI_URL", "https://crawl4ai-production-1422.up.railway.app"
    )
    api_token = os.getenv("CRAWL4AI_API_TOKEN")
    headers = {"Content-Type": "application/json"}
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"
    payload = {"urls": [url]}
    try:
        endpoint = f"{base_url.rstrip('/')}/crawl"
        response = requests.post(endpoint, json=payload, headers=headers, timeout=60)
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("results"):
                result = data["results"][0]
                return result.get("markdown", result.get("html", str(result)))
            return str(data)
        return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error connecting to Crawl4AI API: {str(e)}"


@function_tool
def firecrawl_scrape(url: str) -> str:
    """
    Scrape the content of a provided URL using firecrawl. Use this if crawl4ai fails.
    """
    app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY") or "")
    result = app.scrape_url(url)
    return str(result)
