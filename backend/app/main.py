from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import achievement, streak, behavior, fun, session


app = FastAPI(title="ProcrastiMate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(achievement.router)
app.include_router(streak.router)
app.include_router(behavior.router)
app.include_router(fun.router)
app.include_router(session.router)


@app.get("/")
async def root():
    return {"message": "ProcrastiMate API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
