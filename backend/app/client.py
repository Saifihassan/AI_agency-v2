from dotenv import load_dotenv
from openai import AsyncOpenAI
from agents import OpenAIChatCompletionsModel
import os

load_dotenv(override=True)

velona_client = AsyncOpenAI(
    base_url=os.getenv("VELONA_BASE_URL"),
    api_key=os.getenv("VELONA_API_KEY"),
)

velona = OpenAIChatCompletionsModel(
    model="upstage/solar-mini4",
    openai_client=velona_client,
)
