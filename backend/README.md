# ProcrastiMate Backend

Production-ready FastAPI backend for gamified productivity tracking.

## Setup

1. Create `.env` file:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
alembic upgrade head
```

4. Start server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

### Achievements
- `GET /achievements/{user_id}` - Get all achievements for user
- `POST /achievements/update/{user_id}` - Update achievement progress

### Streak
- `POST /streak/update/{user_id}` - Update daily streak

### Behavior
- `POST /behavior/ghost/{user_id}` - Track ghost session

### Health
- `GET /health` - Health check
