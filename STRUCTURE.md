# 📁 Struttura del Progetto

```
q-ai/
│
├── 📂 backend/                      # Backend Python FastAPI
│   ├── 📂 app/
│   │   ├── __init__.py
│   │   ├── main.py                  # 🚀 Entry point API, endpoints REST
│   │   ├── database.py              # 🗄️  Configurazione PostgreSQL
│   │   ├── models.py                # 📊 Modelli database SQLAlchemy
│   │   ├── excel_parser.py          # 📑 Parser file Excel
│   │   └── analytics.py             # 📈 Logica analisi statistica
│   ├── Dockerfile                   # 🐳 Container backend
│   ├── requirements.txt             # 📦 Dipendenze Python
│   └── .env.example                 # ⚙️  Variabili ambiente esempio
│
├── 📂 frontend/                     # Frontend React + Vite
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Dashboard.jsx       # 📊 Componente dashboard principale
│   │   │   └── Dashboard.css       # 🎨 Stili dashboard
│   │   ├── App.jsx                  # 🏠 Componente App principale
│   │   ├── App.css                  # 🎨 Stili globali
│   │   └── main.jsx                 # 🚀 Entry point React
│   ├── Dockerfile                   # 🐳 Container frontend
│   ├── package.json                 # 📦 Dipendenze npm
│   └── .env.example                 # ⚙️  Variabili ambiente esempio
│
├── 📂 dati/                         # File Excel questionari
│   ├── Studenti - Questionario -CNR.xlsx      # 📝 Risposte studenti
│   └── Insegnati - Questionario - CNR.xlsx    # 📝 Risposte insegnanti
│
├── 🐳 docker-compose.yml            # Orchestrazione servizi
├── 📋 Dockerfile                    # (vari per ogni servizio)
├── 📄 README.md                     # Documentazione completa
├── 🚀 QUICKSTART.md                 # Guida rapida
├── 📁 STRUCTURE.md                  # Questo file
├── 🔧 Makefile                      # Comandi automatizzati
├── 🧪 test-setup.sh                 # Script verifica setup
├── 🚫 .gitignore                    # File da ignorare
└── 🚫 .dockerignore                 # File da ignorare in Docker

```

---

## 🔄 Flusso dei Dati

```
┌─────────────────┐
│  Excel Files    │
│  (dati/)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Excel Parser   │────▶│  PostgreSQL  │
│  (backend)      │     │  Database    │
└─────────────────┘     └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Analytics   │
                        │  Engine      │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  FastAPI     │
                        │  REST API    │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  React       │
                        │  Dashboard   │
                        └──────────────┘
```

---

## 📊 Struttura Database

### Tabelle Principali

#### `student_responses`
- Risposte questionario studenti
- Domande chiuse (scale 1-7, Sì/No, ore)
- Domande aperte salvate come JSON

#### `teacher_responses`
- Risposte questionario insegnanti
- Domande chiuse (scale 1-7, Sì/No, ore)
- Domande aperte salvate come JSON
- Campo `currently_teaching` per filtraggio

#### `question_mappings`
- Mappatura domande speculari
- Categorizzazione (competenze, fiducia, ecc.)
- Riferimenti campi DB

---

## 🎨 Componenti Frontend

### Dashboard.jsx
**Sezioni:**
- Header con statistiche rapide
- Navigazione tab (Panoramica, Confronto, Studenti, Insegnanti, Strumenti)
- Grafici interattivi (Recharts):
  - BarChart: Confronti e distribuzioni
  - LineChart: Trend temporali
  - PieChart: Percentuali

**Tab disponibili:**
1. **Overview**: Panoramica generale con confronti
2. **Comparison**: Domande speculari dettagliate
3. **Students**: Analisi specifica studenti
4. **Teachers**: Analisi specifica insegnanti
5. **Tools**: Strumenti AI utilizzati

---

## 🔌 API Endpoints

```
GET  /                  → Info API
GET  /health            → Health check
POST /api/import        → Importa dati Excel
GET  /api/students      → Statistiche studenti
GET  /api/teachers      → Statistiche insegnanti
GET  /api/comparison    → Analisi comparativa
GET  /api/tools         → Strumenti AI
```

---

## 🐳 Servizi Docker

### db (PostgreSQL)
- **Immagine**: postgres:15-alpine
- **Porta**: 5432
- **Volume**: postgres_data
- **Health check**: pg_isready

### backend (FastAPI)
- **Build**: ./backend/Dockerfile
- **Porta**: 8000
- **Volumi**:
  - ./backend → /app
  - ./dati → /app/dati
- **Dipendenze**: db

### frontend (React)
- **Build**: ./frontend/Dockerfile
- **Porta**: 5173
- **Volumi**:
  - ./frontend → /app
  - node_modules (anonimo)
- **Dipendenze**: backend

---

## 📝 File di Configurazione

### Backend
- `requirements.txt`: Dipendenze Python
- `.env`: Variabili ambiente (DATABASE_URL)
- `Dockerfile`: Immagine Python 3.11

### Frontend
- `package.json`: Dipendenze npm
- `.env`: Variabili ambiente (VITE_API_URL)
- `vite.config.js`: Configurazione Vite
- `Dockerfile`: Immagine Node 20

### Docker
- `docker-compose.yml`: Orchestrazione completa
- `.dockerignore`: File esclusi da build

---

## 🔐 Sicurezza e Privacy

- **Dati Anonimi**: Codici identificativi al posto di nomi
- **CORS**: Configurato per sviluppo locale
- **Password DB**: Da modificare in produzione
- **Volumi**: Dati persistenti isolati

---

## 🚀 Sviluppo

### Aggiungere una nuova analisi:
1. Aggiungi metodo in `backend/app/analytics.py`
2. Crea endpoint in `backend/app/main.py`
3. Aggiungi tab/sezione in `frontend/src/components/Dashboard.jsx`
4. Aggiorna stili in `frontend/src/components/Dashboard.css`

### Modificare il database:
1. Aggiorna modelli in `backend/app/models.py`
2. Modifica parser in `backend/app/excel_parser.py`
3. Ricostruisci: `docker-compose down -v && docker-compose up -d --build`

---

**Ultimo aggiornamento**: 2025-10-01
