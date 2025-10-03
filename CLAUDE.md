# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Analisi Questionari AI - CNR**: Full-stack application for analyzing student and teacher surveys about AI usage in education. The system imports Excel questionnaire data, stores it in PostgreSQL, performs statistical analysis, and displays interactive visualizations.

**Tech Stack:**
- Backend: Python FastAPI with SQLAlchemy ORM
- Frontend: React 19 + Vite with Recharts for visualizations
- Database: PostgreSQL 15
- Deployment: Docker Compose orchestration

## Development Commands

### Docker (Primary Development Method)
```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend    # Backend only
docker-compose logs -f frontend   # Frontend only

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Access backend container
docker-compose exec backend bash

# Access database
docker-compose exec db psql -U user -d questionnaire_db
```

### Makefile Shortcuts
```bash
make up       # Start all services
make down     # Stop services
make logs     # View logs
make health   # Check service status
make import   # Manually import Excel data
make clean    # Remove containers and volumes
```

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture

### Service Ports
- Frontend: `5180` → Internal `5173`
- Backend: `8118` → Internal `8000`
- PostgreSQL: `5433` → Internal `5432`

**Note**: Custom ports are used to avoid conflicts. The Makefile references these ports.

### Data Flow
1. **Excel Import**: Excel files in `dati/` directory parsed by `excel_parser.py`
2. **Database Storage**: Responses stored in `student_responses` and `teacher_responses` tables
3. **Analytics Processing**: `analytics.py` computes statistics (mean, median, distributions)
4. **API Layer**: FastAPI endpoints in `main.py` expose data
5. **Frontend Visualization**: React components fetch and render with Recharts

### Backend Architecture

**Core Modules:**
- `main.py`: FastAPI application, CORS configuration, API endpoints
- `models.py`: SQLAlchemy models for `StudentResponse`, `TeacherResponse`, `Question`, `QuestionMapping`
- `database.py`: PostgreSQL connection configuration
- `excel_parser.py`: Parses Excel questionnaire files and maps to database models
- `analytics.py`: Statistical calculations for students/teachers (mean, median, distribution)
- `question_classifier.py`: Categorizes questions as closed/open
- `question_stats_service.py`: Question-level statistics service

**Key Endpoints:**
- `POST /api/import`: Import Excel data (clears existing data first)
- `GET /api/students`: Student statistics
- `GET /api/teachers?include_non_teaching=false`: Teacher statistics (filters by teaching status)
- `GET /api/comparison`: Comparative analysis between students/teachers on specular questions
- `GET /api/tools`: Top AI tools used
- `GET /health`: Database connection and response count check

### Frontend Architecture

**Components:**
- `Dashboard.jsx`: Main component with tabs (Overview, Comparison, Students, Teachers, Tools)
- `QuestionStats.jsx`: Question-level statistics visualization
- `Icons.jsx`: SVG icon components
- `App.jsx`: Root component with API integration

**Data Fetching Pattern:**
- Uses Axios to fetch from backend on component mount
- Refresh button triggers manual data reload
- All chart visualizations use Recharts library (BarChart, LineChart, PieChart)

### Database Schema

**student_responses**
- Demographics: `age`, `gender`, `school_type`, `education_level`, `study_path`
- Competences: `practical_competence`, `theoretical_competence` (scale 1-7)
- Trust/Impact: `ai_change_study`, `training_adequacy`, `trust_integration` (scale 1-7)
- Concerns: `concern_ai_school`, `concern_ai_peers` (scale 1-7)
- Usage: `uses_ai_daily` (Sì/No), `hours_daily`, `hours_study`
- Tools: `ai_tools`, `ai_purposes`, `preferred_tools` (text/multiple choice)
- Open responses: `open_responses` (JSON, excluded from statistical analysis)

**teacher_responses**
- Demographics: `age`, `gender`, `education_level`, `school_level`, `subject_area`
- Teaching status: `currently_teaching` (used for filtering)
- Competences: `practical_competence`, `theoretical_competence` (scale 1-7)
- Trust/Impact: `ai_change_teaching`, `training_adequacy`, `trust_integration` (scale 1-7)
- Concerns: `concern_ai_education`, `concern_ai_students` (scale 1-7)
- Usage: `uses_ai_daily`, `hours_daily`, `hours_training`, `hours_lesson_planning`
- Tools: `ai_tools`, `ai_purposes`, `preferred_tools`
- Open responses: `open_responses` (JSON)

**Important**: Only closed questions (scale 1-7, Sì/No, numeric) are analyzed in statistics. Open-ended text responses are stored but not visualized.

## Key Design Decisions

1. **Teacher Filtering**: By default, teacher statistics exclude respondents who aren't currently teaching (controlled by `include_non_teaching` query parameter)

2. **Specular Questions**: Some questions appear in both surveys for comparison (e.g., practical competence, theoretical competence, trust in AI integration)

3. **Open vs Closed Questions**: The system distinguishes between closed questions (analyzable statistics) and open questions (stored but not charted)

4. **Data Import Strategy**: Import endpoint (`/api/import`) deletes all existing data before re-importing to avoid duplicates

5. **CORS**: Backend allows all origins for development (configured in `main.py`)

6. **UI Icons**: **ALWAYS use SVG icons from `Icons.jsx` instead of emoji characters**. All visual elements in the UI must use properly styled SVG icons for consistency and accessibility

## Excel File Structure

Excel files must be in `dati/` directory:
- `Studenti - Questionario -CNR.xlsx`
- `Insegnati - Questionario - CNR.xlsx`

The parser expects specific column positions matching the questionnaire structure. Modifying Excel files requires updating `excel_parser.py` column mappings.

## Testing & Verification

```bash
# Run setup verification script
./test-setup.sh

# Check API health
curl http://localhost:8118/health

# Manual import
curl -X POST http://localhost:8118/api/import

# View API documentation
# Visit http://localhost:8118/docs (Swagger UI)
```

## Common Development Tasks

### Adding a New Analysis
1. Add analysis method to `backend/app/analytics.py`
2. Create endpoint in `backend/app/main.py`
3. Add frontend component/section in `frontend/src/components/Dashboard.jsx`
4. Update styles in `frontend/src/components/Dashboard.css`

### Modifying Database Schema
1. Update models in `backend/app/models.py`
2. Update parser in `backend/app/excel_parser.py`
3. Rebuild and clear database: `docker-compose down -v && docker-compose up -d --build`

### Adding New Questions
1. Update Excel parser column mappings in `excel_parser.py`
2. Add corresponding fields to `StudentResponse` or `TeacherResponse` models
3. Update analytics logic if question should be analyzed

## Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string (set in docker-compose.yml)

**Frontend** (`frontend/.env`):
- `VITE_API_URL`: Backend API URL (defaults to `http://192.168.129.14:8118` in docker-compose)

## Notes

- Privacy: All data is anonymized using participant codes
- The system automatically imports data on backend startup
- Frontend runs in development mode with hot reload enabled
- Database uses named volume `postgres_data` for persistence
