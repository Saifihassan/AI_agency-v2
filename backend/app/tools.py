from dotenv import load_dotenv
from tavily import TavilyClient
from agents import function_tool
import os
import json
import requests
from duckduckgo_search import DDGS

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
def news_domain_search(query: str, domains: str) -> str:
    """
    Search the web restricted to specific trusted source domains. This is the
    preferred way to find recent news from verified sources only.

    Args:
        query: plain search keywords (e.g. "artificial intelligence funding").
            Do NOT include site: operators — domain restriction is handled
            by this tool automatically.
        domains: comma-separated list of allowed domains, e.g.
            "reuters.com,apnews.com,bbc.com". Keep the list short (1-4 domains)
            per call and call again with different domains for better coverage.
    """
    return _news_domain_search_impl(query=query, domains=domains)



def _news_domain_search_impl(query: str, domains: str) -> str:
    """
    Search the web restricted to specific trusted source domains. This is the
    preferred way to find recent news from verified sources only.

    Args:
        query: plain search keywords (e.g. "artificial intelligence funding").
            Do NOT include site: operators — domain restriction is handled
            by this tool automatically.
        domains: comma-separated list of allowed domains, e.g.
            "reuters.com,apnews.com,bbc.com". Keep the list short (1-4 domains)
            per call and call again with different domains for better coverage.
    """
    include_domains = [d.strip() for d in domains.split(",") if d.strip()]
    if not include_domains:
        include_domains = ALLOWED_NEWS_DOMAINS
    fallback = None
    try:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=8,
            topic="news",
            days=45,
            include_domains=include_domains,
        )
        results = response.get("results") or []
        if results:
            return json.dumps({"source": "tavily", "results": results})
        fallback = "no results"
    except Exception as e:
        fallback = f"tavily unavailable: {str(e)}"
    try:
        q = f"({' OR '.join('site:' + d for d in include_domains)}) {query}"
        payload = json.dumps({"q": q, "num": 8})
        headers = {
            "X-API-KEY": os.getenv("SERPER_API_KEY", ""),
            "Content-Type": "application/json",
        }
        response = requests.post(
            "https://google.serper.dev/search", headers=headers, data=payload, timeout=30
        )
        organic = (response.json().get("organic") or [])[:8]
        normalised = [
            {
                "title": r.get("title", ""),
                "url": r.get("link", ""),
                "published_date": r.get("date", ""),
                "summary": r.get("snippet", ""),
            }
            for r in organic
        ]
        if normalised:
            return json.dumps({"source": "serper", "results": normalised})
        return json.dumps({"source": "none", "results": [], "note": fallback})
    except Exception as e:
        return json.dumps({"source": "none", "results": [], "note": fallback, "error": str(e)})


ALLOWED_NEWS_DOMAINS = (
    "spectrum.ieee.org",
    "technews.acm.org",
    "nist.gov",
    "warc.com",
    "iab.com",
    "thinkwithgoogle.com",
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "worldbank.org",
    "ourworldindata.org",
)


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
    try:
        from firecrawl import V1FirecrawlApp
        app = V1FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY") or "")
        result = app.scrape_url(url, formats=["markdown"], timeout=60000)
        md = getattr(result, "markdown", None)
        if md:
            return str(md)
        return str(result)
    except Exception as e:
        return f"Error scraping with Firecrawl: {str(e)}"
