# 🚀 Piano di Miglioramento - CNR Questionari AI

**Data**: 2 Ottobre 2025
**Versione Attuale**: 2.0.0
**Versione Target**: 3.0.0

---

## 📋 **EXECUTIVE SUMMARY**

Il progetto è funzionante e stabile (**Production Ready**), ma presenta diverse aree di miglioramento in termini di:
- Code quality (ESLint errors)
- Portabilità (hardcoded IPs)
- Sicurezza (CORS, credentials)
- Performance (caching, API calls)
- Testing (zero coverage)

**Priorità**: Alta per code quality, media per performance, bassa per testing (dato che è un tool interno)

---

## 🎯 **OBIETTIVI**

### Fase 1: Fix Critici (1-2 giorni)
- ✅ Eliminare tutti gli errori ESLint
- ✅ Rimuovere hardcoded IP addresses
- ✅ Implementare environment variables corrette
- ✅ Fix Docker Compose deprecation

### Fase 2: Miglioramenti Qualità (3-4 giorni)
- ⚡ Implementare caching per statistiche
- ⚡ Ottimizzare chiamate API
- ⚡ Migliorare error handling e retry logic
- ⚡ Aggiungere loading states più granulari

### Fase 3: Sicurezza (2-3 giorni)
- 🔒 Configurare CORS correttamente
- 🔒 Externalizzare credenziali database
- 🔒 Aggiungere rate limiting
- 🔒 Implementare logging strutturato

### Fase 4: Testing & Documentation (opzionale, 3-5 giorni)
- 🧪 Unit tests per backend analytics
- 🧪 Integration tests per API endpoints
- 🧪 E2E tests per frontend critical paths
- 📚 API documentation completa

---

## 🔧 **DETTAGLIO INTERVENTI**

### **1. Fix ESLint Errors**

#### **1.1 Dashboard.jsx - Rimuovere variabili non utilizzate**
```javascript
// PRIMA
const [teacherFilter, setTeacherFilter] = useState('current')

// DOPO
// Rimuovere completamente se non usato, oppure implementare funzionalità filtro insegnanti
```

#### **1.2 Dashboard.jsx - Fix React Hooks**
```javascript
// PROBLEMA: Hooks chiamati dopo return condizionale
if (!data) return null

useEffect(() => { ... }, [])  // ❌ Violazione rules of hooks

// SOLUZIONE: Spostare return dopo tutti gli hooks
useEffect(() => { ... }, [])
if (!data) return null  // ✅ Corretto
```

#### **1.3 QuestionStats.jsx - Fix case declarations**
```javascript
// PRIMA
switch(question.response_format) {
  case 'scale_1_7':
    const chartData = ...  // ❌ Lexical declaration

// DOPO
switch(question.response_format) {
  case 'scale_1_7': {
    const chartData = ...  // ✅ Wrapped in block
    break
  }
}
```

#### **1.4 Rimuovere parametri non utilizzati**
```javascript
// PRIMA
.map(([name, count]) => ({ name, count }))  // ❌ 'name' non usato

// DOPO
.map(([_name, count], idx) => ({ name: _name, count }))  // ✅
// oppure
.map((entry) => entry)  // ✅ Se già oggetto
```

**File da modificare:**
- `frontend/src/components/Dashboard.jsx`
- `frontend/src/components/QuestionStats.jsx`
- `frontend/src/App.jsx`

**Test:**
```bash
npm run lint  # Dovrebbe passare senza errori
```

---

### **2. Rimuovere Hardcoded IPs**

#### **2.1 Creare .env files**

**backend/.env**
```bash
DATABASE_URL=postgresql://user:password@db:5432/questionnaire_db
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ORIGINS=http://localhost:5180,http://localhost:5173
```

**frontend/.env**
```bash
VITE_API_URL=http://localhost:8118
```

**frontend/.env.production**
```bash
VITE_API_URL=http://your-production-server:8118
```

#### **2.2 Aggiornare docker-compose.yml**
```yaml
backend:
  environment:
    DATABASE_URL: ${DATABASE_URL:-postgresql://user:password@db:5432/questionnaire_db}
    CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:5180}

frontend:
  environment:
    VITE_API_URL: ${VITE_API_URL:-http://localhost:8118}
```

#### **2.3 Aggiornare App.jsx**
```javascript
// PRIMA
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.129.14:8118'

// DOPO
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'
```

**Benefici:**
- ✅ Funziona su qualsiasi macchina
- ✅ Easy deployment in ambienti diversi
- ✅ Nessun hardcoded IP

---

### **3. Implementare Caching**

#### **3.1 Backend - Redis per cache statistiche**

**Opzione A: Redis (raccomandato per production)**
```python
# backend/requirements.txt
redis==5.0.1
fastapi-cache2==0.2.1

# backend/app/cache.py
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

async def init_cache():
    redis = await aioredis.from_url("redis://redis:6379")
    FastAPICache.init(RedisBackend(redis), prefix="questionnaire-cache")

# backend/app/main.py
from fastapi_cache.decorator import cache

@app.get("/api/students")
@cache(expire=3600)  # Cache 1 ora
async def get_student_statistics(db: Session = Depends(get_db)):
    ...
```

**Opzione B: In-memory cache (più semplice, senza Redis)**
```python
# backend/app/cache.py
from functools import lru_cache
from datetime import datetime, timedelta

class SimpleCache:
    def __init__(self):
        self._cache = {}
        self._timestamps = {}

    def get(self, key, ttl=3600):
        if key in self._cache:
            if datetime.now() - self._timestamps[key] < timedelta(seconds=ttl):
                return self._cache[key]
        return None

    def set(self, key, value):
        self._cache[key] = value
        self._timestamps[key] = datetime.now()

cache = SimpleCache()

# backend/app/main.py
@app.get("/api/students")
def get_student_statistics(db: Session = Depends(get_db)):
    cached = cache.get('students')
    if cached:
        return cached

    stats = analytics.get_student_statistics()
    cache.set('students', stats)
    return stats
```

#### **3.2 Frontend - React Query**
```javascript
// frontend/package.json
"dependencies": {
  "@tanstack/react-query": "^5.0.0"
}

// frontend/src/App.jsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      cacheTime: 10 * 60 * 1000 // 10 minuti
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

function AppContent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const [students, teachers, comparison, tools] = await Promise.all([...])
      return { students, teachers, comparison, tools }
    }
  })

  return <Dashboard data={data} onRefresh={refetch} />
}
```

**Benefici:**
- ⚡ 90% riduzione chiamate API
- ⚡ Instant loading su tab switch
- ⚡ Automatic refetch on window focus
- ⚡ Retry logic built-in

---

### **4. Migliorare Error Handling**

#### **4.1 Backend - Structured errors**
```python
# backend/app/errors.py
from fastapi import HTTPException
from typing import Any, Dict

class APIException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        details: Dict[str, Any] = None
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "message": message,
                "details": details or {},
                "timestamp": datetime.now().isoformat()
            }
        )

# backend/app/main.py
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )
```

#### **4.2 Frontend - Retry logic & better errors**
```javascript
// frontend/src/utils/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config
    if (!config || !config.retry) {
      config.retry = 0
    }

    if (config.retry >= 3) {
      return Promise.reject(error)
    }

    config.retry += 1
    const delay = Math.min(1000 * Math.pow(2, config.retry), 5000)
    await new Promise(resolve => setTimeout(resolve, delay))

    return api(config)
  }
)

export default api

// frontend/src/App.jsx
const loadData = async () => {
  try {
    const [students, teachers, comparison, tools] = await Promise.all([
      api.get('/api/students'),
      api.get('/api/teachers'),
      api.get('/api/comparison'),
      api.get('/api/tools')
    ])
    setData({ ... })
  } catch (err) {
    // Errori più specifici
    if (err.code === 'ECONNABORTED') {
      setError('Timeout: il server non risponde')
    } else if (err.response?.status === 500) {
      setError('Errore del server: riprova più tardi')
    } else if (!err.response) {
      setError('Impossibile connettersi al backend. Verifica che i servizi siano attivi.')
    } else {
      setError(`Errore: ${err.response?.data?.message || err.message}`)
    }
  }
}
```

---

### **5. Sicurezza**

#### **5.1 CORS Corretto**
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware
import os

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5180").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # ✅ Solo origins specifici
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # ✅ Solo metodi necessari
    allow_headers=["*"],
)
```

#### **5.2 Environment Variables per Secrets**
```yaml
# docker-compose.yml
services:
  db:
    environment:
      POSTGRES_USER: ${DB_USER:-user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}  # Da .env
      POSTGRES_DB: ${DB_NAME:-questionnaire_db}

# .env (NON committare!)
DB_USER=cnr_user
DB_PASSWORD=strong_random_password_here
DB_NAME=questionnaire_db
```

```bash
# .gitignore
.env
.env.local
.env.production
backend/.env
frontend/.env.local
```

#### **5.3 Rate Limiting**
```python
# backend/requirements.txt
slowapi==0.1.9

# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/students")
@limiter.limit("10/minute")  # Max 10 richieste al minuto
def get_student_statistics(request: Request, db: Session = Depends(get_db)):
    ...
```

---

### **6. Fix Docker Compose**

```yaml
# docker-compose.yml
# RIMUOVERE: version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: questionnaire_db
    environment:
      POSTGRES_USER: ${DB_USER:-user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
      POSTGRES_DB: ${DB_NAME:-questionnaire_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${DB_PORT:-5433}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - questionnaire-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: questionnaire_backend
    env_file:
      - .env
    environment:
      DATABASE_URL: postgresql://${DB_USER:-user}:${DB_PASSWORD:-password}@db:5432/${DB_NAME:-questionnaire_db}
    volumes:
      - ./backend:/app
      - ./dati:/app/dati
    ports:
      - "${BACKEND_PORT:-8118}:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - questionnaire-net
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: questionnaire_frontend
    env_file:
      - .env
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:8118}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "${FRONTEND_PORT:-5180}:5173"
    depends_on:
      - backend
    networks:
      - questionnaire-net
    restart: unless-stopped

networks:
  questionnaire-net:
    driver: bridge

volumes:
  postgres_data:
```

---

### **7. Logging Strutturato**

#### **7.1 Backend**
```python
# backend/app/logging_config.py
import logging
import sys
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# backend/app/main.py
import logging
from app.logging_config import JSONFormatter

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logging.root.addHandler(handler)
logging.root.setLevel(logging.INFO)

logger = logging.getLogger(__name__)

@app.get("/api/students")
def get_student_statistics(db: Session = Depends(get_db)):
    logger.info("Fetching student statistics", extra={
        "endpoint": "/api/students",
        "method": "GET"
    })
    try:
        stats = analytics.get_student_statistics()
        logger.info("Student statistics retrieved successfully", extra={
            "count": stats.get('total_responses', 0)
        })
        return stats
    except Exception as e:
        logger.error("Error fetching student statistics", extra={
            "error": str(e),
            "error_type": type(e).__name__
        }, exc_info=True)
        raise
```

---

### **8. Testing (Opzionale)**

#### **8.1 Backend Unit Tests**
```python
# backend/tests/test_analytics.py
import pytest
from app.analytics import Analytics
from app.models import StudentResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def test_db():
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_student_statistics(test_db):
    # Aggiungi dati di test
    test_db.add(StudentResponse(
        code='TEST001',
        practical_competence=5,
        theoretical_competence=4
    ))
    test_db.commit()

    # Test analytics
    analytics = Analytics(test_db)
    stats = analytics.get_student_statistics()

    assert stats['total_responses'] == 1
    assert stats['competenze']['practical']['mean'] == 5.0

# Esegui con: pytest backend/tests/
```

#### **8.2 Frontend Component Tests**
```javascript
// frontend/src/components/__tests__/Dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import Dashboard from '../Dashboard'

test('renders dashboard header', () => {
  const mockData = {
    students: { total_responses: 270 },
    teachers: { total_responses: 455 }
  }

  render(<Dashboard data={mockData} onRefresh={() => {}} />)

  expect(screen.getByText(/Analisi Questionari AI/i)).toBeInTheDocument()
})

// Esegui con: npm test
```

---

## 📊 **PRIORITÀ & ROADMAP**

### **SPRINT 1: Code Quality (Settimana 1)**
| Task | Priorità | Effort | Impact |
|------|----------|--------|--------|
| Fix ESLint errors | 🔴 Alta | 2h | Alta |
| Rimuovere hardcoded IPs | 🔴 Alta | 1h | Alta |
| Fix Docker Compose | 🟡 Media | 30min | Media |
| Creare .env files | 🔴 Alta | 1h | Alta |

### **SPRINT 2: Performance (Settimana 2)**
| Task | Priorità | Effort | Impact |
|------|----------|--------|--------|
| Implementare caching backend | 🟡 Media | 4h | Alta |
| Aggiungere React Query | 🟡 Media | 3h | Alta |
| Ottimizzare API calls | 🟡 Media | 2h | Media |

### **SPRINT 3: Sicurezza (Settimana 3)**
| Task | Priorità | Effort | Impact |
|------|----------|--------|--------|
| CORS corretto | 🔴 Alta | 1h | Alta |
| Secrets in .env | 🔴 Alta | 1h | Alta |
| Rate limiting | 🟢 Bassa | 2h | Media |
| Logging strutturato | 🟡 Media | 3h | Media |

### **SPRINT 4: Testing (Opzionale)**
| Task | Priorità | Effort | Impact |
|------|----------|--------|--------|
| Backend unit tests | 🟢 Bassa | 8h | Bassa |
| Frontend tests | 🟢 Bassa | 6h | Bassa |
| E2E tests | 🟢 Bassa | 8h | Bassa |

---

## 🎯 **QUICK WINS** (Azioni immediate < 1 ora)

1. **Fix docker-compose.yml version** (5 min)
   ```bash
   # Rimuovere prima riga "version: '3.8'"
   ```

2. **Fix hardcoded IP in App.jsx** (2 min)
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'
   ```

3. **Aggiungere .gitignore per .env** (1 min)
   ```bash
   echo ".env" >> .gitignore
   echo "backend/.env" >> .gitignore
   echo "frontend/.env.local" >> .gitignore
   ```

4. **Creare .env template** (5 min)
   ```bash
   # .env.example
   DB_USER=user
   DB_PASSWORD=password
   VITE_API_URL=http://localhost:8118
   ```

5. **Fix unused variables Dashboard.jsx** (10 min)
   ```javascript
   // Commentare o rimuovere linee non usate
   ```

---

## 📈 **METRICHE DI SUCCESSO**

### **Prima dei miglioramenti**
- ❌ ESLint: 10 errori, 2 warnings
- ❌ Portabilità: IP hardcoded
- ❌ Cache: 0%
- ❌ Test coverage: 0%
- ⚠️ Sicurezza: CORS aperto, password in chiaro

### **Dopo Sprint 1**
- ✅ ESLint: 0 errori, 0 warnings
- ✅ Portabilità: 100% (environment variables)
- ✅ Docker Compose: Standard compliant
- ✅ Secrets: Externalizzati

### **Dopo Sprint 2**
- ✅ Cache hit rate: >80%
- ✅ API calls: -75%
- ✅ Loading time: -60%

### **Dopo Sprint 3**
- ✅ CORS: Configurato correttamente
- ✅ Rate limiting: Attivo
- ✅ Logging: Strutturato e searchable

---

## 🚀 **COMANDI DEPLOY**

### **Dopo ogni Sprint**
```bash
# 1. Pull ultime modifiche
git pull

# 2. Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Verifica
docker-compose ps
docker-compose logs -f

# 4. Test
curl http://localhost:8118/health
curl http://localhost:5180
```

---

## 📚 **DOCUMENTAZIONE DA AGGIORNARE**

Dopo i miglioramenti, aggiornare:
- ✅ `README.md` - Nuove istruzioni setup con .env
- ✅ `CLAUDE.md` - Nuovi pattern (caching, error handling)
- ✅ `QUICKSTART.md` - Steps con .env
- ✅ Creare `TESTING.md` - Se implementati i test
- ✅ Creare `SECURITY.md` - Best practices

---

## ⚠️ **RISCHI & MITIGAZIONE**

| Rischio | Impatto | Probabilità | Mitigazione |
|---------|---------|-------------|-------------|
| Breaking changes durante refactor | Alto | Media | Testare in dev prima di prod |
| Performance degradation da caching | Medio | Bassa | Monitoring e tuning TTL |
| CORS troppo restrittivo | Medio | Media | Allowlist configurabile |
| Secrets leak in git | Alto | Bassa | .gitignore preventivo |

---

## ✅ **CHECKLIST FINALE**

Prima di considerare completato:

### **Code Quality**
- [ ] ESLint passa senza errori/warnings
- [ ] Nessun hardcoded IP/password
- [ ] Environment variables per tutto
- [ ] Docker Compose aggiornato

### **Performance**
- [ ] Caching implementato
- [ ] API calls ottimizzate
- [ ] Loading states granulari

### **Sicurezza**
- [ ] CORS configurato
- [ ] Secrets in .env
- [ ] Rate limiting attivo
- [ ] Logging strutturato

### **Documentation**
- [ ] README aggiornato
- [ ] CLAUDE.md aggiornato
- [ ] .env.example creato
- [ ] CHANGELOG aggiornato

---

**Autore**: Claude Code Analysis
**Status**: Piano Approvato, Pronto per Implementazione
**Next Step**: Iniziare Sprint 1 (Code Quality)
