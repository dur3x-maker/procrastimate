import json
import random
from pathlib import Path
from typing import Dict, Any, List, Optional
from urllib.parse import quote_plus
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.fun_content import FunContent


class FunService:
    def __init__(self):
        self._fun_content: Dict[str, Any] = {}
        self._absurd_longreads: List[Dict[str, Any]] = []
        self._load_data()

    def _load_data(self) -> None:
        data_dir = Path(__file__).resolve().parent.parent / "data"
        
        absurd_path = data_dir / "absurd_longreads.json"
        if absurd_path.exists():
            with open(absurd_path, "r", encoding="utf-8") as f:
                absurd_data = json.load(f)
                self._absurd_longreads = absurd_data.get("longreads", [])

    def get_random_video(self, category: str) -> Dict[str, Any]:
        if category not in ["cat", "dogfail", "science"]:
            raise ValueError(f"Invalid category: {category}")
        
        videos = self._fun_content.get("videos", {}).get(category, [])
        if not videos:
            raise ValueError(f"No videos found for category: {category}")
        
        video = random.choice(videos)
        search_query = video["search_query"].replace(" ", "+")
        
        return {
            "type": "video",
            "title": video["title"],
            "url": f"https://www.youtube.com/results?search_query={search_query}"
        }

    async def get_random_meme(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get("https://meme-api.com/gimme")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "type": "meme",
                        "title": data.get("title", "Random Meme"),
                        "url": data.get("url", "")
                    }
        except Exception:
            pass
        
        return self._get_fallback_meme()

    def _get_fallback_meme(self) -> Dict[str, Any]:
        memes = self._fun_content.get("memes_fallback", [])
        if not memes:
            raise ValueError("No fallback memes available")
        
        meme = random.choice(memes)
        image_seed = meme["image_seed"]
        
        return {
            "type": "meme",
            "title": meme["title"],
            "url": f"https://picsum.photos/seed/{image_seed}/600/400"
        }

    def get_random_absurd_longread(self) -> Dict[str, Any]:
        if not self._absurd_longreads:
            raise ValueError("No absurd longreads available")
        
        longread = random.choice(self._absurd_longreads)
        learn_more_query = quote_plus(longread["learn_more_query"])
        
        return {
            "type": "absurd",
            "id": longread["id"],
            "title": longread["title"],
            "category": longread["category"],
            "estimated_read_time_sec": longread["estimated_read_time_sec"],
            "body": longread["body"],
            "learn_more_url": f"https://www.google.com/search?q={learn_more_query}"
        }

    def get_random_longread_by_energy(self, energy: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self._absurd_longreads:
            return None
        
        candidates = self._absurd_longreads
        
        if energy:
            if energy == "low":
                candidates = [lr for lr in candidates if lr.get("estimated_read_time_sec", 0) <= 100]
            elif energy == "chaos":
                candidates = [lr for lr in candidates if lr.get("estimated_read_time_sec", 0) >= 100]
        
        if not candidates:
            candidates = self._absurd_longreads
        
        longread = random.choice(candidates)
        learn_more_query = quote_plus(longread["learn_more_query"])
        
        return {
            "type": "absurd",
            "id": longread["id"],
            "title": longread["title"],
            "category": longread["category"],
            "estimated_read_time_sec": longread["estimated_read_time_sec"],
            "body": longread["body"],
            "learn_more_url": f"https://www.google.com/search?q={learn_more_query}"
        }

    async def get_random_video_by_energy(
        self,
        db: AsyncSession,
        energy: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        query = select(FunContent).where(
            and_(
                FunContent.type == "video",
                FunContent.is_active == True
            )
        )
        
        if energy:
            query = query.where(FunContent.energy == energy)
        
        result = await db.execute(query)
        items = list(result.scalars().all())
        
        if not items:
            fallback_query = select(FunContent).where(
                and_(
                    FunContent.type == "video",
                    FunContent.is_active == True
                )
            )
            fallback_result = await db.execute(fallback_query)
            items = list(fallback_result.scalars().all())
        
        if not items:
            return None
        
        item = random.choice(items)
        
        return {
            "type": "video",
            "category": item.category,
            "url": item.url,
            "duration_seconds": item.duration_seconds,
        }

    async def get_random_by_energy(
        self,
        db: AsyncSession,
        energy: str
    ) -> Optional[Dict[str, Any]]:
        query = select(FunContent).where(
            and_(
                FunContent.energy == energy,
                FunContent.is_active == True
            )
        )
        
        if energy == "low":
            query = query.where(FunContent.duration_seconds <= 300)
        elif energy == "chaos":
            pass
        
        result = await db.execute(query)
        items = list(result.scalars().all())
        
        if not items:
            fallback_query = select(FunContent).where(
                and_(
                    FunContent.energy == energy,
                    FunContent.is_active == True
                )
            )
            fallback_result = await db.execute(fallback_query)
            items = list(fallback_result.scalars().all())
            
            if not items:
                return None
        
        item = random.choice(items)
        
        return {
            "type": item.type,
            "category": item.category,
            "url": item.url,
            "duration_seconds": item.duration_seconds,
        }


fun_service = FunService()
