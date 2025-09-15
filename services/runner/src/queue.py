"""
Redis Queue for the Query Runner Service
"""

import redis.asyncio as redis
import json
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()


class RedisQueue:
    """Redis-based queue for query processing"""

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.queue_key = "findable:query_sessions"
        self.processing_key = "findable:processing_sessions"

    async def connect(self):
        """Test Redis connection"""
        try:
            await self.redis.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Close Redis connection"""
        await self.redis.close()

    async def enqueue_session(self, session_id: str, priority: str = "normal"):
        """Add a session to the processing queue"""
        try:
            # Add to queue with priority (higher score = higher priority)
            priority_score = {
                "low": 1,
                "normal": 5,
                "high": 10
            }.get(priority, 5)

            await self.redis.zadd(self.queue_key, {session_id: priority_score})
            logger.info(f"Session {session_id} enqueued with priority {priority}")
        except Exception as e:
            logger.error(f"Failed to enqueue session {session_id}: {e}")
            raise

    async def get_next_session(self) -> Optional[str]:
        """Get the next session to process (highest priority first)"""
        try:
            # Get highest priority session
            result = await self.redis.zpopmax(self.queue_key)
            if result:
                session_id, score = result[0]
                # Mark as processing
                await self.redis.sadd(self.processing_key, session_id)
                logger.info(f"Dequeued session {session_id} (priority score: {score})")
                return session_id
            return None
        except Exception as e:
            logger.error(f"Failed to get next session: {e}")
            return None

    async def mark_session_completed(self, session_id: str):
        """Mark a session as completed (remove from processing set)"""
        try:
            await self.redis.srem(self.processing_key, session_id)
            logger.info(f"Session {session_id} marked as completed")
        except Exception as e:
            logger.error(f"Failed to mark session {session_id} as completed: {e}")

    async def mark_session_failed(self, session_id: str):
        """Mark a session as failed and optionally re-queue it"""
        try:
            await self.redis.srem(self.processing_key, session_id)
            # Could implement retry logic here
            logger.info(f"Session {session_id} marked as failed")
        except Exception as e:
            logger.error(f"Failed to mark session {session_id} as failed: {e}")

    async def get_queue_stats(self) -> Dict[str, int]:
        """Get queue statistics"""
        try:
            pending_count = await self.redis.zcard(self.queue_key)
            processing_count = await self.redis.scard(self.processing_key)
            return {
                "pending": pending_count,
                "processing": processing_count
            }
        except Exception as e:
            logger.error(f"Failed to get queue stats: {e}")
            return {"pending": 0, "processing": 0}

    async def health_check(self) -> bool:
        """Check if Redis is healthy"""
        try:
            await self.redis.ping()
            return True
        except Exception:
            return False