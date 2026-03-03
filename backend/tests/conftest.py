"""
Shared fixtures for ProcrastiMate backend test suite.

Strategy
--------
* If SQLALCHEMY_TEST_URL env var is set, use that PostgreSQL database.
* Otherwise fall back to SQLite in-memory via aiosqlite.

SQLite compatibility shim (applied BEFORE any app module is imported):
  postgresql.UUID columns are swapped to a TypeDecorator (String(36))
  that serialises uuid.UUID objects to/from strings at bind/result time.

The dependency override replaces get_db so no production DB is touched.
"""

import asyncio
import os
import uuid
from typing import AsyncGenerator, Any

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import String, event
from sqlalchemy.types import TypeDecorator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# ── choose test database ───────────────────────────────────────────────────────
_TEST_URL = os.environ.get(
    "SQLALCHEMY_TEST_URL",
    "sqlite+aiosqlite:///:memory:",
)
_IS_SQLITE = _TEST_URL.startswith("sqlite")

# ── SQLite shims — must run BEFORE any app.* import ───────────────────────────
if _IS_SQLITE:
    # ── 1. UUID TypeDecorator: str(36) storage, uuid.UUID in Python ───────────
    class _UUIDStr(TypeDecorator):
        impl = String(36)
        cache_ok = True

        def process_bind_param(self, value: Any, dialect: Any):
            return None if value is None else str(value)

        def process_result_value(self, value: Any, dialect: Any):
            return None if value is None else uuid.UUID(str(value))

# ── import app modules ─────────────────────────────────────────────────────────
from app.core.database import Base, get_db  # noqa: E402
from app.main import app                    # noqa: E402

# ── import all models so their tables are registered in Base.metadata ──────────
from app.models import user          # noqa: F401, E402
from app.models import achievement   # noqa: F401, E402
from app.models import streak        # noqa: F401, E402
from app.models import behavior      # noqa: F401, E402
from app.models import session_history  # noqa: F401, E402
from app.models import fun_content   # noqa: F401, E402

# ── 3. Swap postgresql.UUID columns → _UUIDStr before DDL (SQLite only) ───────
if _IS_SQLITE:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    @event.listens_for(Base.metadata, "before_create")
    def _patch_uuid_columns(target, connection, **kw):
        for table in target.tables.values():
            for col in table.columns:
                if isinstance(col.type, PG_UUID):
                    col.type = _UUIDStr()

# ── engine + session ───────────────────────────────────────────────────────────
_engine_kwargs: dict = {}
if _IS_SQLITE:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

test_engine = create_async_engine(_TEST_URL, echo=False, **_engine_kwargs)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── event loop (session-scoped so all async fixtures share it) ────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── create / drop schema once per session ─────────────────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── per-test DB session with rollback isolation ────────────────────────────────
@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


# ── dependency override ────────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── helpers ────────────────────────────────────────────────────────────────────
def new_user_id() -> str:
    """Return a fresh UUID string for each test that needs an isolated user."""
    return str(uuid.uuid4())
