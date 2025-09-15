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

from .models.openai_client import OpenAIClient
from .models.anthropic_client import AnthropicClient
from .db_client import QueryDatabaseClient
from .queue import RedisQueue
from .parser import ResponseParser
from .scraper import SERPAnalyzer
from .prompt_builder import PromptBuilder

load_dotenv()

logger = structlog.get_logger()


class QueryRunner:
    """Main query runner that orchestrates AI model queries"""

    def __init__(self):
        self.db = QueryDatabaseClient(os.getenv("DATABASE_URL"))
        self.queue = RedisQueue(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
        )
        self.parser = ResponseParser()
        self.serp_analyzer = SERPAnalyzer()
        self.prompt_builder = PromptBuilder()

        # Initialize AI clients
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        self.clients = {}

        if openai_key:
            self.clients.update({
                "gpt-4": OpenAIClient(api_key=openai_key, model="gpt-4"),
                "gpt-4-turbo": OpenAIClient(api_key=openai_key, model="gpt-4-turbo"),
                "gpt-3.5-turbo": OpenAIClient(api_key=openai_key, model="gpt-3.5-turbo"),
            })

        if anthropic_key:
            self.clients.update({
                "claude-3-opus": AnthropicClient(api_key=anthropic_key, model="claude-3-opus-20240229"),
                "claude-3-sonnet": AnthropicClient(api_key=anthropic_key, model="claude-3-5-sonnet-20241022"),
                "claude-3-haiku": AnthropicClient(api_key=anthropic_key, model="claude-3-haiku-20240307"),
            })

        logger.info(f"Initialized {len(self.clients)} AI clients")

    async def run_query(
        self,
        session_id: str,
        project_id: str,
        query: str,
        models: List[str],
        project_info: Dict[str, Any],
        run_count: int = 1
    ) -> List[Dict[str, Any]]:
        """Run a query against multiple models multiple times with enhanced prompts"""
        results = []

        # Analyze market context for the query
        market_context = None
        try:
            market_context = await self.serp_analyzer.analyze_query_context(query, project_info)
            logger.info(f"Market context analyzed for query: {query}")
        except Exception as e:
            logger.warning(f"Failed to analyze market context: {e}")

        for model_id in models:
            client = self.clients.get(model_id)
            if not client:
                logger.warning(f"Model {model_id} not configured")
                continue

            for run_num in range(run_count):
                try:
                    logger.info(f"Running query on {model_id}, run {run_num + 1}/{run_count}")

                    # Build enhanced prompt with market context
                    enhanced_prompt = self.prompt_builder.build_findability_prompt(
                        query=query,
                        project_info=project_info,
                        market_context=market_context,
                        prompt_type='findability'
                    )

                    # Execute query with enhanced prompt
                    start_time = datetime.utcnow()
                    response = await client.query(enhanced_prompt)
                    execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

                    # Parse response
                    parsed = self.parser.parse(response)

                    # Enhanced parsing with project-specific analysis
                    project_mentions = self.parser.extract_project_mentions(
                        response,
                        project_info.get('domain', ''),
                        project_info.get('competitors', [])
                    )

                    # Merge parsed data
                    all_mentions = list(set(parsed.get("mentions", []) + project_mentions.get("project_mentions", [])))

                    # Save to database
                    result = await self.db.save_run_result(
                        session_id=session_id,
                        project_id=project_id,
                        query_text=query,
                        model_name=model_id,
                        response_text=response,
                        citations=parsed.get("citations", []),
                        extracted_snippets=parsed.get("snippets", []),
                        mentions=all_mentions,
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

            # Get project ID and info
            project_id = session["projectId"]

            # Get project details for enhanced prompts
            project_info = await self.db.get_project_info(project_id)
            if not project_info:
                project_info = {
                    'id': project_id,
                    'name': 'Unknown Project',
                    'domain': None,
                    'competitors': [],
                    'keywords': []
                }
                logger.warning(f"Project {project_id} not found, using defaults")

            # Run all queries
            for query in queries:
                await self.run_query(session_id, project_id, query, models, project_info, run_count)

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