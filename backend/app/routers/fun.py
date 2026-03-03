from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.fun_service import fun_service
from app.core.database import get_db


router = APIRouter(prefix="/fun", tags=["fun"])


@router.get("/longread/random")
async def get_random_longread(
    energy: Optional[str] = Query(None, description="Energy level filter")
) -> Dict[str, Any]:
    try:
        if energy and energy not in ["low", "mid", "high", "chaos"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid energy. Must be one of: low, mid, high, chaos"
            )
        
        content = fun_service.get_random_longread_by_energy(energy)
        if not content:
            raise HTTPException(
                status_code=404,
                detail="No longreads available"
            )
        return content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/video/random")
async def get_random_video(
    energy: Optional[str] = Query(None, description="Energy level filter"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    try:
        if energy and energy not in ["low", "mid", "high", "chaos"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid energy. Must be one of: low, mid, high, chaos"
            )
        
        content = await fun_service.get_random_video_by_energy(db, energy)
        if not content:
            raise HTTPException(
                status_code=404,
                detail="No videos available"
            )
        return content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/random")
async def get_random_fun(
    type: Optional[str] = Query(None, description="Type of fun content (legacy)"),
    energy: Optional[str] = Query(None, description="Energy level filter"),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    try:
        if energy:
            if energy not in ["low", "mid", "high", "chaos"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid energy. Must be one of: low, mid, high, chaos"
                )
            
            content = await fun_service.get_random_by_energy(db, energy)
            if not content:
                raise HTTPException(
                    status_code=404,
                    detail=f"No active content found for energy level: {energy}"
                )
            return content
        
        if not type:
            raise HTTPException(
                status_code=400,
                detail="Either 'type' or 'energy' parameter is required"
            )
        
        if type in ["cat", "dogfail", "science"]:
            return fun_service.get_random_video(type)
        elif type == "meme":
            return await fun_service.get_random_meme()
        elif type == "absurd":
            return fun_service.get_random_absurd_longread()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid type. Must be one of: cat, dogfail, science, meme, absurd"
            )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
