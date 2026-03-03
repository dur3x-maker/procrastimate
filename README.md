# ProcrastiMate

ProcrastiMate is a backend-heavy SaaS experiment focused on behavioral productivity mechanics and structured system design.

A gamified productivity application that helps users manage tasks, track focus sessions, and build sustainable work habits through achievement systems and energy-based mechanics.

## Overview

ProcrastiMate combines task management with behavioral psychology principles to create an engaging productivity experience. The application tracks user behavior, provides real-time feedback, and rewards consistent work patterns through an achievement system.

## Tech Stack

### Backend
- **Framework:** FastAPI 0.109.0
- **Database:** PostgreSQL with SQLAlchemy 2.0.36 (async)
- **Migrations:** Alembic 1.13.1
- **Validation:** Pydantic 2.10.5
- **Server:** Uvicorn with hot reload

### Frontend
- **Framework:** Next.js 16.1.6 (App Router + Turbopack)
- **Language:** TypeScript 5
- **Styling:** TailwindCSS 4
- **Internationalization:** next-intl 4.8.2
- **State Management:** Custom hooks + Zustand patterns

### Database Schema
- **Users:** User profiles and authentication data
- **Tasks:** Task management with completion tracking
- **Sessions:** Focus session history with time tracking
- **Achievements:** Progress tracking for gamification
- **Task Events:** Event-driven task completion logging
- **Behavior:** User behavior patterns (ghost sessions, breaks)
- **Streaks:** Daily activity streak tracking

## Features

### Core Functionality
- **Task Management:** Create, complete, and track work tasks
- **Focus Sessions:** Pomodoro-style work sessions with break management
- **Energy System:** Dynamic energy level tracking based on work patterns
- **Achievement System:** Unlock achievements based on productivity milestones
- **Streak Tracking:** Daily activity streaks with behavioral rewards
- **Break Suggestions:** Smart break recommendations based on session data
- **Internationalization:** Full support for English and Russian

### Behavioral Features
- **Ghost Session Detection:** Tracks abandoned sessions
- **Overheating Prevention:** Warns users about excessive work without breaks
- **Fun Engine:** Context-aware content delivery based on energy levels
- **Excuse Generator:** Humorous justification generator for procrastination
- **Self-Reporting:** Daily productivity reflection system

## Architecture

### Backend Structure
```
backend/
├── app/
│   ├── core/          # Database configuration
│   ├── models/        # SQLAlchemy ORM models
│   ├── routers/       # API endpoint definitions
│   ├── schemas/       # Pydantic request/response models
│   ├── services/      # Business logic layer
│   └── utils/         # Helper functions
├── alembic/           # Database migrations
├── data/              # Static content (excuses, day-start messages)
└── tests/             # Test suite
```

### Frontend Structure
```
src/
├── app/               # Next.js App Router pages
├── components/        # React components
├── hooks/             # Custom React hooks
├── lib/               # Core utilities (API client, userId, energy)
├── utils/             # Helper functions
├── content/           # Static content definitions
└── i18n/              # Internationalization setup
```

### Key Design Patterns
- **Event-Driven Architecture:** Task completions trigger events stored in `task_events` table
- **Service Layer:** Business logic isolated from API routes
- **Atomic Updates:** Session statistics updated atomically via database constraints
- **Client-Side State:** Local state management with backend synchronization
- **Type Safety:** Full TypeScript coverage with Pydantic validation

## Setup Instructions

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 14+
- npm or yarn

### Environment Variables

Create `.env.local` in the root directory:
```env
# No frontend-specific env vars required
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/procrastimate
```

See `backend/.env.example` for reference.

### Installation

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Running Tests

#### Backend Tests
```bash
cd backend
pytest
```

#### Frontend Tests
```bash
npm test
npm run test:coverage
```

## API Documentation

Once the backend is running, visit:
- **Interactive API Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### Main Endpoints

#### Achievements
- `GET /achievements/{user_id}` - Get user achievements
- `POST /achievements/trigger-event/{user_id}` - Trigger achievement event
- `POST /achievements/update/{user_id}` - Update achievement progress

#### Sessions
- `GET /sessions/daily/{user_id}` - Get today's session data
- `POST /sessions/daily/{user_id}` - Save/update daily session
- `GET /sessions/history/{user_id}` - Get aggregated statistics

#### Behavior
- `POST /behavior/ghost/{user_id}` - Track ghost session

#### Streak
- `POST /streak/update/{user_id}` - Update daily streak

#### Fun Content
- `GET /fun/content/{user_id}` - Get personalized fun content

## Project Structure

```
ProcrastiMate/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   ├── alembic/         # Database migrations
│   ├── data/            # Static content
│   └── tests/           # Backend tests
├── src/                 # Next.js frontend
│   ├── app/             # Pages and layouts
│   ├── components/      # UI components
│   ├── hooks/           # React hooks
│   └── lib/             # Core utilities
├── public/              # Static assets
│   └── messages/        # i18n message files
├── .gitignore           # Git ignore rules
├── package.json         # Frontend dependencies
└── README.md            # This file
```

## Development Notes

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Adding New Features
1. **Backend:** Add model → service → router → schema
2. **Frontend:** Add API method → hook → component
3. **Database:** Create migration if schema changes required

### Code Quality
- Backend uses Pydantic for validation
- Frontend uses TypeScript strict mode
- All API responses are typed
- Database operations use async/await

## Future Improvements

- [ ] User authentication system (OAuth2/JWT)
- [ ] Real-time notifications via WebSockets
- [ ] Mobile responsive design improvements
- [ ] Data export functionality
- [ ] Team/collaborative features
- [ ] Advanced analytics dashboard
- [ ] Docker Compose for easy deployment
- [ ] CI/CD pipeline setup
- [ ] Rate limiting and API security
- [ ] Caching layer (Redis)

## License

Private project - All rights reserved
