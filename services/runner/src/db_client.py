"""
Database interface for the Query Runner Service
"""

import asyncio
import asyncpg
from typing import Dict, Any, Optional, List
import structlog
import json
from datetime import datetime

logger = structlog.get_logger()


class QueryDatabaseClient:
    """Database client for query runner operations"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool = None

    async def connect(self):
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise

    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session details by ID"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, "projectId", status, priority, metadata, "startedAt", "completedAt"
                FROM "RunSession"
                WHERE id = $1
                """,
                session_id
            )

            if row:
                return {
                    "id": row["id"],
                    "projectId": row["projectId"],
                    "status": row["status"],
                    "priority": row["priority"],
                    "metadata": row["metadata"],
                    "startedAt": row["startedAt"],
                    "completedAt": row["completedAt"]
                }
            return None

    async def get_project_info(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project details by ID"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, name, slug, domain, "oneLiner", competitors, keywords
                FROM "Project"
                WHERE id = $1 AND "isActive" = true
                """,
                project_id
            )

            if row:
                return {
                    "id": row["id"],
                    "name": row["name"],
                    "slug": row["slug"],
                    "domain": row["domain"],
                    "oneLiner": row["oneLiner"],
                    "competitors": row["competitors"] if row["competitors"] else [],
                    "keywords": row["keywords"] if row["keywords"] else []
                }
            return None

    async def update_session_status(
        self,
        session_id: str,
        status: str,
        error_message: Optional[str] = None
    ):
        """Update session status"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            if status.upper() == "RUNNING":
                await conn.execute(
                    """
                    UPDATE "RunSession"
                    SET status = $1, "startedAt" = $2
                    WHERE id = $3
                    """,
                    status.upper(),
                    datetime.utcnow(),
                    session_id
                )
            elif status.upper() in ["COMPLETED", "FAILED"]:
                await conn.execute(
                    """
                    UPDATE "RunSession"
                    SET status = $1, "completedAt" = $2, "errorMessage" = $3
                    WHERE id = $4
                    """,
                    status.upper(),
                    datetime.utcnow(),
                    error_message,
                    session_id
                )
            else:
                await conn.execute(
                    """
                    UPDATE "RunSession"
                    SET status = $1
                    WHERE id = $2
                    """,
                    status.upper(),
                    session_id
                )

    async def get_or_create_query(self, project_id: str, query_text: str) -> str:
        """Get existing query or create new one"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            # Try to find existing query
            row = await conn.fetchrow(
                """
                SELECT id FROM "Query"
                WHERE "projectId" = $1 AND text = $2
                """,
                project_id,
                query_text
            )

            if row:
                return row["id"]

            # Create new query
            row = await conn.fetchrow(
                """
                INSERT INTO "Query" ("projectId", text, category)
                VALUES ($1, $2, 'general')
                RETURNING id
                """,
                project_id,
                query_text
            )
            return row["id"]

    async def get_model_id(self, model_name: str) -> Optional[str]:
        """Get model ID by name"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id FROM "Model"
                WHERE name = $1 AND "isActive" = true
                """,
                model_name
            )
            return row["id"] if row else None

    async def save_run_result(
        self,
        session_id: str,
        project_id: str,
        query_text: str,
        model_name: str,
        response_text: str,
        citations: List[str],
        extracted_snippets: List[str],
        mentions: List[str],
        execution_time_ms: int,
        surface: str = "web"
    ) -> Dict[str, Any]:
        """Save query execution result"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            # Get or create query
            query_id = await self.get_or_create_query(project_id, query_text)

            # Get model ID
            model_id = await self.get_model_id(model_name)
            if not model_id:
                raise ValueError(f"Model {model_name} not found")

            # Insert result
            row = await conn.fetchrow(
                """
                INSERT INTO "RunResult" (
                    "sessionId", "queryId", "modelId", "queryText",
                    "responseText", citations, "extractedSnippets",
                    mentions, "executionTimeMs", surface
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, "createdAt"
                """,
                session_id,
                query_id,
                model_id,
                query_text,
                response_text,
                json.dumps(citations),
                json.dumps(extracted_snippets),
                json.dumps(mentions),
                execution_time_ms,
                surface
            )

            return {
                "id": row["id"],
                "sessionId": session_id,
                "queryId": query_id,
                "modelId": model_id,
                "queryText": query_text,
                "responseText": response_text,
                "citations": citations,
                "extractedSnippets": extracted_snippets,
                "mentions": mentions,
                "executionTimeMs": execution_time_ms,
                "surface": surface,
                "createdAt": row["createdAt"]
            }