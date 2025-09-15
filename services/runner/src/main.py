"""
Query Runner Service
Executes queries against various AI models and collects responses
"""

import asyncio
import os
from typing import List, Dict, Any
from datetime import datetime
import structlog
from dotenv import load_dotenv

from .models import OpenAIClient, AnthropicClient, GeminiClient, PerplexityClient
from .database import Database
from .queue import RedisQueue
from .parser import ResponseParser

load_dotenv()

logger = structlog.get_logger()


class QueryRunner:
    """Main query runner that orchestrates AI model queries"""

    def __init__(self):
        self.db = Database(os.getenv("DATABASE_URL"))
        self.queue = RedisQueue(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
        )
        self.parser = ResponseParser()

        # Initialize AI clients
        self.clients = {
            "gpt-4": OpenAIClient(api_key=os.getenv("OPENAI_API_KEY")),
            "gpt-3.5-turbo": OpenAIClient(api_key=os.getenv("OPENAI_API_KEY")),
            "claude-3-opus-20240229": AnthropicClient(api_key=os.getenv("ANTHROPIC_API_KEY")),
            "claude-3-5-sonnet-20241022": AnthropicClient(api_key=os.getenv("ANTHROPIC_API_KEY")),
            "gemini-pro": GeminiClient(api_key=os.getenv("GOOGLE_AI_API_KEY")),
            "pplx-70b-online": PerplexityClient(api_key=os.getenv("PERPLEXITY_API_KEY")),
        }

    async def run_query(
        self,
        session_id: str,
        query: str,
        models: List[str],
        run_count: int = 1
    ) -> List[Dict[str, Any]]:
        """Run a query against multiple models multiple times"""
        results = []

        for model_id in models:
            client = self.clients.get(model_id)
            if not client:
                logger.warning(f"Model {model_id} not configured")
                continue

            for run_num in range(run_count):
                try:
                    logger.info(f"Running query on {model_id}, run {run_num + 1}/{run_count}")

                    # Execute query
                    start_time = datetime.utcnow()
                    response = await client.query(query)
                    execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

                    # Parse response
                    parsed = self.parser.parse(response)

                    # Save to database
                    result = await self.db.save_run_result(
                        session_id=session_id,
                        query_id=f"{query[:50]}_{run_num}",
                        model_id=model_id,
                        query_text=query,
                        response_text=response,
                        citations=parsed.get("citations", []),
                        extracted_snippets=parsed.get("snippets", []),
                        mentions=parsed.get("mentions", []),
                        execution_time_ms=execution_time_ms,
                    )

                    results.append(result)

                except Exception as e:
                    logger.error(f"Error running query on {model_id}: {e}")

        return results

    async def process_session(self, session_id: str):
        """Process a complete query session"""
        try:
            # Get session details
            session = await self.db.get_session(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                return

            # Update status to running
            await self.db.update_session_status(session_id, "running")

            # Extract metadata
            queries = session["metadata"].get("queries", [])
            models = session["metadata"].get("models", [])
            run_count = session["metadata"].get("runCount", 1)

            # Run all queries
            for query in queries:
                await self.run_query(session_id, query, models, run_count)

            # Update status to completed
            await self.db.update_session_status(session_id, "completed")
            logger.info(f"Session {session_id} completed successfully")

        except Exception as e:
            logger.error(f"Error processing session {session_id}: {e}")
            await self.db.update_session_status(session_id, "failed")

    async def start_worker(self):
        """Start the worker to process queued sessions"""
        logger.info("Starting query runner worker...")

        while True:
            try:
                # Get next session from queue
                session_id = await self.queue.get_next_session()
                if session_id:
                    logger.info(f"Processing session: {session_id}")
                    await self.process_session(session_id)
                else:
                    # No sessions to process, wait
                    await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(10)


async def main():
    """Main entry point"""
    runner = QueryRunner()
    await runner.start_worker()


if __name__ == "__main__":
    asyncio.run(main())