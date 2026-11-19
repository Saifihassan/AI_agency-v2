from dotenv import load_dotenv
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel
import os

load_dotenv(override=True)

VELONA_BASE_URL = os.getenv("VELONA_BASE_URL")
VELONA_API_KEY = os.getenv("VELONA_API_KEY")
DEFAULT_MODEL = os.getenv("VELONA_MODEL", "openai/gpt-6-luna")

velona_client = AsyncOpenAI(
    base_url=VELONA_BASE_URL,
    api_key=VELONA_API_KEY,
)

velona = OpenAIChatCompletionsModel(
    model=DEFAULT_MODEL,
    openai_client=velona_client,
)


def resolve_model(
    base_url: str | None = None,
    api_key: str | None = None,
    model: str | None = None,
):
    """Return a chat model bound to the user's own provider when configured."""
    if base_url and api_key:
        client = AsyncOpenAI(base_url=base_url.rstrip("/"), api_key=api_key)
        return OpenAIChatCompletionsModel(
            model=model or DEFAULT_MODEL,
            openai_client=client,
        )
    return velona


async def list_provider_models(base_url: str, api_key: str) -> list[str]:
    """List model ids from an OpenAI-compatible provider."""
    client = AsyncOpenAI(base_url=base_url.rstrip("/"), api_key=api_key)
    page = await client.models.list()
    ids = [m.id for m in page.data if getattr(m, "id", None)]
    return sorted(set(ids))
