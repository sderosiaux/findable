"""
HTTP API for the Query Runner Service
Provides REST endpoints for managing query sessions
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import structlog
import os

from .main import QueryRunner
from .queue import RedisQueue

logger = structlog.get_logger()

app = FastAPI(title="Findable Query Runner", version="1.0.0")

# Global instances
runner = None
queue = None


class SessionRequest(BaseModel):
    session_id: str
    priority: str = "normal"


class SessionStatus(BaseModel):
    session_id: str
    status: str
    message: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the query runner and queue"""
    global runner, queue

    try:
        runner = QueryRunner()
        await runner.db.connect()

        queue = RedisQueue(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
        )
        await queue.connect()

        logger.info("Query Runner API started successfully")
    except Exception as e:
        logger.error(f"Failed to start Query Runner API: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources"""
    global runner, queue

    if runner:
        await runner.db.disconnect()
    if queue:
        await queue.disconnect()

    logger.info("Query Runner API shutdown")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global queue

    redis_healthy = await queue.health_check() if queue else False

    return {
        "status": "healthy" if redis_healthy else "unhealthy",
        "redis": redis_healthy,
        "service": "query-runner"
    }


@app.post("/sessions/queue")
async def queue_session(request: SessionRequest, background_tasks: BackgroundTasks):
    """Queue a session for processing"""
    global queue, runner

    if not queue or not runner:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        # Verify session exists
        session = await runner.db.get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Queue for processing
        await queue.enqueue_session(request.session_id, request.priority)

        return SessionStatus(
            session_id=request.session_id,
            status="queued",
            message="Session queued for processing"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to queue session {request.session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to queue session")


@app.post("/sessions/{session_id}/process")
async def process_session(session_id: str, background_tasks: BackgroundTasks):
    """Process a session immediately"""
    global runner

    if not runner:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        # Start processing in background
        background_tasks.add_task(runner.process_session, session_id)

        return SessionStatus(
            session_id=session_id,
            status="processing",
            message="Session processing started"
        )
    except Exception as e:
        logger.error(f"Failed to process session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to process session")


@app.get("/sessions/{session_id}/status")
async def get_session_status(session_id: str):
    """Get session status"""
    global runner

    if not runner:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        session = await runner.db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "session_id": session_id,
            "status": session["status"],
            "started_at": session["startedAt"],
            "completed_at": session["completedAt"],
            "metadata": session["metadata"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session status {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session status")


@app.get("/queue/stats")
async def get_queue_stats():
    """Get queue statistics"""
    global queue

    if not queue:
        raise HTTPException(status_code=503, detail="Queue service not ready")

    try:
        stats = await queue.get_queue_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get queue stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get queue stats")


@app.get("/models")
async def list_available_models():
    """List available AI models"""
    global runner

    if not runner:
        raise HTTPException(status_code=503, detail="Service not ready")

    return {
        "models": list(runner.clients.keys()),
        "count": len(runner.clients)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)