# CONTEXT — q-ai

<!-- ai4educ:context-template v1.0 -->

## Quick Reference
- **Stack**: Python (FastAPI), React (Vite), PostgreSQL, Docker
- **Entry point**: `docker compose up -d` o `uvicorn backend.app.main:app --reload` + `cd frontend && npm run dev`
- **Test**: manuale / pytest
- **Repo**: https://github.com/nugh75/q-ai

## Domain
Sistema per l'analisi di questionari su studenti e insegnanti riguardo l'uso dell'IA in ambito educativo (progetto CNR). Carica file Excel, esegue analisi statistiche descrittive e comparative, analisi qualitativa con categorizzazione automatica.

## Architecture
Monorepo backend/frontend:
- Backend FastAPI: parsing Excel, analytics, statistics, qualitative templates
- Frontend React (Vite): dashboard interattiva con grafici
- PostgreSQL per archiviazione strutturata

### Key Files
- `backend/app/main.py` — entry point API REST
- `backend/app/excel_parser.py` — parsing file Excel
- `backend/app/analytics.py` — analisi statistiche
- `backend/app/qualitative_service.py` — analisi qualitativa con template
- `backend/app/models.py` — modelli DB (SQLAlchemy)
- `backend/app/database.py` — configurazione PostgreSQL

## Conventions
- API REST con route versionate
- Analisi qualitative: template-driven con categorizzazione automatica

## Common Tasks

| Task | Command |
|---|---|
| Avvio Docker | `docker compose up -d` |
| Backend dev | `uvicorn backend.app.main:app --reload` |
| Frontend dev | `cd frontend && npm run dev` |
