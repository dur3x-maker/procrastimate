#!/usr/bin/env python3
"""
Production-safe seed script for fun_content table in Supabase PostgreSQL.

Usage:
    python seed_fun_content.py path/to/file.csv

CSV Format:
    url,category,energy,duration,safe
    https://example.com/video1,cats,low,120,true
    https://example.com/video2,science,high,300,true
"""

import sys
import csv
import asyncio
from pathlib import Path
from uuid import uuid4
from typing import List, Dict, Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.models.fun_content import FunContent


ALLOWED_ENERGY_LEVELS = {"low", "mid", "high", "chaos"}


def validate_row(row: Dict[str, str], line_num: int) -> bool:
    """Validate a CSV row. Returns True if valid, False otherwise."""
    
    if not row.get("url", "").strip():
        print(f"  [SKIP] Line {line_num}: Empty URL")
        return False
    
    energy = row.get("energy", "").strip().lower()
    if energy not in ALLOWED_ENERGY_LEVELS:
        print(f"  [SKIP] Line {line_num}: Invalid energy '{energy}' (must be one of {ALLOWED_ENERGY_LEVELS})")
        return False
    
    try:
        duration = int(row.get("duration", "0"))
        if duration < 0:
            print(f"  [SKIP] Line {line_num}: Duration must be non-negative")
            return False
    except ValueError:
        print(f"  [SKIP] Line {line_num}: Duration must be an integer")
        return False
    
    return True


async def seed_fun_content(csv_path: str) -> None:
    """Seed fun_content table from CSV file."""
    
    csv_file = Path(csv_path)
    if not csv_file.exists():
        print(f"Error: File not found: {csv_path}")
        sys.exit(1)
    
    if not csv_file.suffix.lower() == ".csv":
        print(f"Error: File must be a CSV file: {csv_path}")
        sys.exit(1)
    
    print(f"Reading CSV file: {csv_path}")
    
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
    )
    
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    inserted_count = 0
    skipped_count = 0
    duplicate_count = 0
    
    async with async_session() as session:
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                
                if not reader.fieldnames:
                    print("Error: CSV file is empty or has no headers")
                    sys.exit(1)
                
                required_fields = {"url", "category", "energy", "duration"}
                missing_fields = required_fields - set(reader.fieldnames)
                if missing_fields:
                    print(f"Error: CSV missing required columns: {missing_fields}")
                    sys.exit(1)
                
                print(f"Processing rows...")
                
                for line_num, row in enumerate(reader, start=2):
                    if not validate_row(row, line_num):
                        skipped_count += 1
                        continue
                    
                    url = row["url"].strip()
                    category = row.get("category", "").strip()
                    energy = row["energy"].strip().lower()
                    duration = int(row["duration"])
                    
                    result = await session.execute(
                        select(FunContent).where(FunContent.url == url)
                    )
                    existing = result.scalar_one_or_none()
                    
                    if existing:
                        print(f"  [DUPLICATE] Line {line_num}: URL already exists: {url[:50]}...")
                        duplicate_count += 1
                        continue
                    
                    new_content = FunContent(
                        id=uuid4(),
                        type="video",
                        category=category,
                        energy=energy,
                        url=url,
                        duration_seconds=duration,
                        is_active=True,
                    )
                    
                    session.add(new_content)
                    inserted_count += 1
                    print(f"  [INSERT] Line {line_num}: {category} | {energy} | {duration}s")
                
                await session.commit()
                print("\n" + "="*60)
                print("Seed completed successfully!")
                print(f"  Inserted: {inserted_count}")
                print(f"  Duplicates skipped: {duplicate_count}")
                print(f"  Invalid rows skipped: {skipped_count}")
                print(f"  Total processed: {inserted_count + duplicate_count + skipped_count}")
                print("="*60)
                
        except Exception as e:
            await session.rollback()
            print(f"\nError during seeding: {e}")
            sys.exit(1)
        finally:
            await engine.dispose()


def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python seed_fun_content.py path/to/file.csv")
        print("\nCSV Format:")
        print("  url,category,energy,duration,safe")
        print("  https://example.com/video1,cats,low,120,true")
        print("  https://example.com/video2,science,high,300,true")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    asyncio.run(seed_fun_content(csv_path))


if __name__ == "__main__":
    main()
