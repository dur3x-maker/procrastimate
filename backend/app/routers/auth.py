from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from passlib.context import CryptContext

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import AuthRegisterRequest, AuthLoginRequest, AuthResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", response_model=AuthResponse)
async def register(body: AuthRegisterRequest, db: AsyncSession = Depends(get_db)):
    email_lower = body.email.strip().lower()
    logger.info(f"[AUTH:REGISTER] Incoming email: '{email_lower}'")

    # Check if email already exists (case-insensitive)
    result = await db.execute(
        select(User).where(func.lower(User.email) == email_lower)
    )
    existing = result.scalar_one_or_none()

    if existing:
        logger.warning(f"[AUTH:REGISTER] Email already exists: '{email_lower}'")
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password
    hashed = pwd_context.hash(body.password)
    logger.info(f"[AUTH:REGISTER] Password hashed successfully")

    user = User(email=email_lower, password_hash=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"[AUTH:REGISTER] User created: id={user.id}, email='{user.email}'")

    return AuthResponse(
        id=str(user.id),
        email=user.email,
        message="Registration successful",
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: AuthLoginRequest, db: AsyncSession = Depends(get_db)):
    email_lower = body.email.strip().lower()
    logger.info(f"[AUTH:LOGIN] Incoming email: '{email_lower}'")

    # Case-insensitive email lookup
    result = await db.execute(
        select(User).where(func.lower(User.email) == email_lower)
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"[AUTH:LOGIN] No user found for email: '{email_lower}'")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    logger.info(f"[AUTH:LOGIN] Found user: id={user.id}, email='{user.email}'")

    # Verify password hash (NOT string comparison)
    if not user.password_hash:
        logger.warning(f"[AUTH:LOGIN] User has no password_hash set")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_valid = pwd_context.verify(body.password, user.password_hash)
    logger.info(f"[AUTH:LOGIN] Password verification result: {password_valid}")

    if not password_valid:
        logger.warning(f"[AUTH:LOGIN] Password mismatch for email: '{email_lower}'")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    logger.info(f"[AUTH:LOGIN] Login successful for user: id={user.id}")

    return AuthResponse(
        id=str(user.id),
        email=user.email,
        message="Login successful",
    )
