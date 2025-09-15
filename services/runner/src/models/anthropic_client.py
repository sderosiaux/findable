"""Anthropic API client for Claude models"""

from typing import Optional
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()


class AnthropicClient:
    """Client for Anthropic API"""

    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def query(self, prompt: str, temperature: float = 0.7) -> str:
        """Execute a query against Anthropic model"""
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise