import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routers import achievement, streak, behavior, fun, session, auth
from app.core.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ProcrastiMate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(achievement.router)
app.include_router(streak.router)
app.include_router(behavior.router)
app.include_router(fun.router)
app.include_router(session.router)


@app.on_event("startup")
async def startup_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("[STARTUP] Database connection verified (SELECT 1 OK)")
    except Exception as e:
        logger.error(f"[STARTUP] Database connection FAILED: {e}")


@app.get("/")
async def root():
    return {"message": "ProcrastiMate API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
