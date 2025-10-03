# 🐛 Bug Report - CNR Questionari AI

**Data Analisi**: 2 Ottobre 2025
**Versione Analizzata**: 2.0.0
**Servizi Analizzati**: Backend (FastAPI), Frontend (React), Database (PostgreSQL)

---

## 📊 **SUMMARY**

| Categoria | Critici | Alti | Medi | Bassi | Totale |
|-----------|---------|------|------|-------|--------|
| Code Quality | 0 | 3 | 7 | 2 | 12 |
| Configuration | 0 | 2 | 1 | 0 | 3 |
| Security | 1 | 2 | 1 | 0 | 4 |
| Performance | 0 | 1 | 2 | 0 | 3 |
| **TOTALE** | **1** | **8** | **11** | **2** | **22** |

---

## 🔴 **BUG CRITICI** (1)

### **BUG-001: CORS Aperto a Tutti gli Origins**
**Severity**: 🔴 Critico
**Categoria**: Security
**File**: `backend/app/main.py:26`

**Descrizione**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ❌ PERICOLOSO
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Rischio**:
- Qualsiasi sito web può fare richieste al backend
- Possibile CSRF attack
- Data leakage

**Fix**:
```python
import os

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5180").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

**Priority**: Immediata
**Effort**: 15 minuti

---

## 🟠 **BUG ALTI** (8)

### **BUG-002: React Hooks Violazione Rules of Hooks**
**Severity**: 🟠 Alta
**Categoria**: Code Quality
**File**: `frontend/src/components/Dashboard.jsx:22,38`

**Descrizione**:
```javascript
function Dashboard({ data, onRefresh }) {
  const [activeTab, setActiveTab] = useState('questions')

  if (!data) return null  // ❌ Return prima degli hooks

  // Hooks chiamati DOPO return condizionale
  useEffect(() => {
    const loadOverviewStats = async () => { ... }
    loadOverviewStats()
  }, [])  // ❌ Violazione regole React
```

**Errore**:
```
React Hook "useEffect" is called conditionally.
React Hooks must be called in the exact same order in every component render
```

**Impatto**:
- Possibili errori runtime in produzione
- Comportamento imprevedibile
- State corruption

**Fix**:
```javascript
function Dashboard({ data, onRefresh }) {
  const [activeTab, setActiveTab] = useState('questions')
  const [overviewStats, setOverviewStats] = useState(null)

  // ✅ Hooks PRIMA del return
  useEffect(() => {
    const loadOverviewStats = async () => { ... }
    loadOverviewStats()
  }, [])

  useEffect(() => {
    const loadQuestions = async () => { ... }
    loadQuestions()
  }, [activeTab, questionsData])

  // ✅ Return condizionale DOPO
  if (!data) return null

  return (...)
}
```

**Priority**: Alta
**Effort**: 30 minuti

---

### **BUG-003: Hardcoded IP Address Non Portabile**
**Severity**: 🟠 Alta
**Categoria**: Configuration
**File**: `docker-compose.yml:44`, `frontend/src/App.jsx:6`

**Descrizione**:
```yaml
# docker-compose.yml
frontend:
  environment:
    VITE_API_URL: http://192.168.129.14:8118  # ❌ IP specifico WSL
```

```javascript
// App.jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.129.14:8118'
```

**Impatto**:
- ❌ Non funziona su altre macchine
- ❌ Fallisce in production
- ❌ Problemi in CI/CD

**Fix**:
```yaml
# docker-compose.yml
frontend:
  environment:
    VITE_API_URL: ${VITE_API_URL:-http://localhost:8118}
```

```javascript
// App.jsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'
```

**Priority**: Alta
**Effort**: 10 minuti

---

### **BUG-004: Password Database in Chiaro**
**Severity**: 🟠 Alta
**Categoria**: Security
**File**: `docker-compose.yml:8-10`

**Descrizione**:
```yaml
db:
  environment:
    POSTGRES_USER: user
    POSTGRES_PASSWORD: password  # ❌ Password in chiaro nel repo
    POSTGRES_DB: questionnaire_db
```

**Rischio**:
- Credenziali esposte in git history
- Security audit failure
- Non production-ready

**Fix**:
```yaml
# docker-compose.yml
db:
  environment:
    POSTGRES_USER: ${DB_USER:-user}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
    POSTGRES_DB: ${DB_NAME:-questionnaire_db}

# .env (NON committato)
DB_USER=cnr_user
DB_PASSWORD=strong_random_password_XYZ123
DB_NAME=questionnaire_db

# .gitignore
.env
backend/.env
frontend/.env.local
```

**Priority**: Alta
**Effort**: 20 minuti

---

### **BUG-005: Variabili State Non Utilizzate**
**Severity**: 🟠 Alta (Code Quality)
**Categoria**: Code Quality
**File**: `frontend/src/components/Dashboard.jsx:11`

**Descrizione**:
```javascript
const [teacherFilter, setTeacherFilter] = useState('current')  // ❌ Mai usate
```

**Errore ESLint**:
```
'teacherFilter' is assigned a value but never used
'setTeacherFilter' is assigned a value but never used
```

**Impatto**:
- Dead code nel bundle
- Confusione per altri developer
- Aumenta bundle size

**Fix**:
```javascript
// Opzione 1: Rimuovere completamente
// const [teacherFilter, setTeacherFilter] = useState('current')

// Opzione 2: Implementare filtro insegnanti
const [teacherFilter, setTeacherFilter] = useState('current')

// Nel rendering
<select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
  <option value="current">Insegnanti Attivi</option>
  <option value="all">Tutti</option>
  <option value="training">In Formazione</option>
</select>
```

**Priority**: Alta
**Effort**: 5 minuti (rimozione) o 1 ora (implementazione)

---

### **BUG-006: Dichiarazioni Lexical in Case Blocks**
**Severity**: 🟠 Alta
**Categoria**: Code Quality
**File**: `frontend/src/components/QuestionStats.jsx:84-85`

**Descrizione**:
```javascript
switch(question.response_format) {
  case 'scale_1_7':
    const chartData = ...  // ❌ Unexpected lexical declaration
    const totalResponses = ...  // ❌ Unexpected lexical declaration
    break
}
```

**Errore**:
```
Unexpected lexical declaration in case block
```

**Impatto**:
- Potenziali scope issues
- Variable hoisting problems
- Linting errors

**Fix**:
```javascript
switch(question.response_format) {
  case 'scale_1_7': {  // ✅ Wrappare in block
    const chartData = distribution.map(...)
    const totalResponses = ...
    return <BarChart data={chartData} />
    break
  }
  case 'yes_no': {
    const pieData = ...
    return <PieChart data={pieData} />
    break
  }
}
```

**Priority**: Alta
**Effort**: 15 minuti

---

### **BUG-007: Missing useEffect Dependency**
**Severity**: 🟠 Alta
**Categoria**: Code Quality
**File**: `frontend/src/App.jsx:16`, `frontend/src/components/QuestionStats.jsx:15`

**Descrizione**:
```javascript
// App.jsx
useEffect(() => {
  checkHealth()  // ❌ checkHealth non è in dependency array
}, [])

// QuestionStats.jsx
useEffect(() => {
  fetchStats()  // ❌ fetchStats non è in dependency array
}, [questionId])
```

**Warning**:
```
React Hook useEffect has a missing dependency: 'checkHealth'.
Either include it or remove the dependency array
```

**Impatto**:
- Stale closures
- Unexpected behavior on re-renders
- Difficile debugging

**Fix**:
```javascript
// Opzione 1: Aggiungere dipendenza
useEffect(() => {
  checkHealth()
}, [checkHealth])  // ✅ Dependency inclusa

// Opzione 2: Usare useCallback
const checkHealth = useCallback(async () => {
  try {
    const response = await axios.get(`${API_URL}/health`)
    ...
  }
}, [API_URL])

useEffect(() => {
  checkHealth()
}, [checkHealth])
```

**Priority**: Alta
**Effort**: 20 minuti

---

### **BUG-008: Nessun Error Retry Logic**
**Severity**: 🟠 Alta
**Categoria**: Performance
**File**: `frontend/src/App.jsx:45-65`

**Descrizione**:
```javascript
const loadData = async () => {
  try {
    const [students, teachers, comparison, tools] = await Promise.all([
      axios.get(`${API_URL}/api/students`),
      axios.get(`${API_URL}/api/teachers`),
      axios.get(`${API_URL}/api/comparison`),
      axios.get(`${API_URL}/api/tools`)
    ])
  } catch (err) {
    setError('Errore: ' + err.message)  // ❌ Nessun retry
  }
}
```

**Impatto**:
- UX scadente su network issues temporanei
- Utente deve manualmente ricaricare
- Persa opportunità di recovery automatico

**Fix**:
```javascript
const loadDataWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const [students, teachers, comparison, tools] = await Promise.all([...])
      setData({ students, teachers, comparison, tools })
      return
    } catch (err) {
      if (i === retries - 1) {
        setError(`Errore dopo ${retries} tentativi: ${err.message}`)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
}
```

**Priority**: Alta
**Effort**: 30 minuti

---

### **BUG-009: Docker Compose Version Deprecato**
**Severity**: 🟠 Alta
**Categoria**: Configuration
**File**: `docker-compose.yml:1`

**Descrizione**:
```yaml
version: '3.8'  # ❌ Deprecato in Docker Compose v2+
```

**Warning**:
```
/home/nugh75/q-ai/docker-compose.yml: the attribute `version` is obsolete,
it will be ignored, please remove it to avoid potential confusion
```

**Impatto**:
- Warning continui nei log
- Non conforme a standard moderni
- Potenziali problemi futuri

**Fix**:
```yaml
# Rimuovere completamente la riga "version"
# docker-compose.yml

services:
  db:
    image: postgres:15-alpine
    ...
```

**Priority**: Alta
**Effort**: 1 minuto

---

## 🟡 **BUG MEDI** (11)

### **BUG-010: Variabili Non Utilizzate in Map**
**Severity**: 🟡 Media
**Categoria**: Code Quality
**File**: `frontend/src/components/QuestionStats.jsx:136,177`

**Descrizione**:
```javascript
distribution.map(([name, count]) => (  // ❌ 'name' defined but never used
  <Cell key={`cell-${count}`} fill={COLORS[Math.floor(Math.random() * COLORS.length)]} />
))
```

**Fix**:
```javascript
distribution.map(([_name, count], idx) => (
  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
))
```

**Priority**: Media
**Effort**: 5 minuti

---

### **BUG-011: isNumericQuestion Non Utilizzata**
**Severity**: 🟡 Media
**Categoria**: Code Quality
**File**: `frontend/src/components/QuestionStats.jsx:78`

**Descrizione**:
```javascript
const isNumericQuestion = question.response_format === 'numeric'  // ❌ Mai usata
```

**Fix**:
```javascript
// Rimuovere o utilizzare
// const isNumericQuestion = ...
```

**Priority**: Media
**Effort**: 2 minuti

---

### **BUG-012: Idx Definito Ma Non Usato**
**Severity**: 🟡 Media
**Categoria**: Code Quality
**File**: `frontend/src/components/Dashboard.jsx:241`

**Descrizione**:
```javascript
filteredQuestions.map((question, idx) => {  // ❌ idx defined but never used
  const questionId = `${question.respondent_type}-${question.column_index}`
  return <div key={questionId}>...</div>
})
```

**Fix**:
```javascript
filteredQuestions.map((question) => {
  const questionId = `${question.respondent_type}-${question.column_index}`
  return <div key={questionId}>...</div>
})
```

**Priority**: Media
**Effort**: 2 minuti

---

### **BUG-013: Nessun Caching Statistiche**
**Severity**: 🟡 Media
**Categoria**: Performance
**File**: `backend/app/main.py:100-108`

**Descrizione**:
Ogni chiamata a `/api/students` ricalcola tutte le statistiche da zero.

**Impatto**:
- Spreco risorse CPU/DB
- Latenza alta (~200-500ms)
- Scalability issues

**Fix**:
Implementare caching come descritto in `IMPROVEMENT_PLAN.md` sezione 3.

**Priority**: Media
**Effort**: 2-4 ore

---

### **BUG-014: Frontend Fa 4+ Chiamate API Parallele all'Avvio**
**Severity**: 🟡 Media
**Categoria**: Performance
**File**: `frontend/src/App.jsx:48-53`

**Descrizione**:
```javascript
const [students, teachers, comparison, tools] = await Promise.all([
  axios.get(`${API_URL}/api/students`),
  axios.get(`${API_URL}/api/teachers`),
  axios.get(`${API_URL}/api/comparison`),
  axios.get(`${API_URL}/api/tools`)
])
```

**Impatto**:
- 4 connessioni simultanee al backend
- Backend overload su molti utenti
- Possibile rate limiting issues

**Fix Opzionale**:
Creare endpoint aggregato `/api/dashboard` che restituisce tutto:
```python
@app.get("/api/dashboard")
async def get_dashboard_data(db: Session = Depends(get_db)):
    analytics = Analytics(db)
    return {
        "students": analytics.get_student_statistics(),
        "teachers": analytics.get_teacher_statistics(),
        "comparison": analytics.get_comparison(),
        "tools": analytics.get_tools()
    }
```

**Priority**: Bassa (funziona correttamente con Promise.all)
**Effort**: 1 ora

---

### **BUG-015: Nessun Rate Limiting**
**Severity**: 🟡 Media
**Categoria**: Security
**File**: `backend/app/main.py` (mancante)

**Descrizione**:
Nessuna protezione contro abuse/DDoS.

**Rischio**:
- Possibili attacchi DoS
- Resource exhaustion
- Database overload

**Fix**:
Implementare come in `IMPROVEMENT_PLAN.md` sezione 5.3 (slowapi).

**Priority**: Media
**Effort**: 2 ore

---

### **BUG-016: Logging Non Strutturato**
**Severity**: 🟡 Media
**Categoria**: Code Quality
**File**: `backend/app/main.py:14,60,96,107`

**Descrizione**:
```python
logger.error(f"Health check failed: {str(e)}")  # ❌ String logging
logger.error(f"Import failed: {str(e)}")
```

**Impatto**:
- Difficile parsing dei log
- Non searchable in log aggregators
- Mancano metadata contestuali

**Fix**:
Implementare JSON logging come in `IMPROVEMENT_PLAN.md` sezione 7.

**Priority**: Media
**Effort**: 3 ore

---

### **BUG-017: Nessun .env File, Solo .env.example Menzionato**
**Severity**: 🟡 Media
**Categoria**: Configuration
**File**: Mancante

**Descrizione**:
Nessun file `.env` reale, tutto hardcoded in `docker-compose.yml`.

**Fix**:
```bash
# Creare .env
cat > .env << EOF
DB_USER=user
DB_PASSWORD=password
DB_NAME=questionnaire_db
DB_PORT=5433
BACKEND_PORT=8118
FRONTEND_PORT=5180
VITE_API_URL=http://localhost:8118
CORS_ORIGINS=http://localhost:5180,http://localhost:5173
EOF

# Aggiungere a .gitignore
echo ".env" >> .gitignore
```

**Priority**: Media
**Effort**: 15 minuti

---

### **BUG-018: Vite Config Minimale**
**Severity**: 🟡 Media
**Categoria**: Configuration
**File**: `frontend/vite.config.js`

**Descrizione**:
```javascript
export default defineConfig({
  plugins: [react()],
})
// ❌ Nessuna configurazione proxy, build optimization, etc.
```

**Fix**:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8118',
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts']
        }
      }
    }
  }
})
```

**Priority**: Media
**Effort**: 30 minuti

---

### **BUG-019: Nessun Health Check Periodic**
**Severity**: 🟡 Media
**Categoria**: Code Quality
**File**: `frontend/src/App.jsx`

**Descrizione**:
Health check fatto solo all'avvio, mai più verificato.

**Impatto**:
- Se backend muore, frontend non lo sa
- Nessun auto-reconnect
- UX scadente

**Fix**:
```javascript
useEffect(() => {
  const healthInterval = setInterval(async () => {
    try {
      await axios.get(`${API_URL}/health`)
    } catch (err) {
      console.warn('Backend unreachable, retrying...')
      setError('Backend non raggiungibile. Riconnessione in corso...')
    }
  }, 30000) // Ogni 30 secondi

  return () => clearInterval(healthInterval)
}, [])
```

**Priority**: Bassa
**Effort**: 20 minuti

---

### **BUG-020: Mancanza Pagination per Domande**
**Severity**: 🟡 Media
**Categoria**: Performance
**File**: `frontend/src/components/Dashboard.jsx`

**Descrizione**:
Tutte le ~75 domande caricate e renderizzate insieme.

**Impatto**:
- Rendering pesante
- Scroll performance issues con molte domande
- Memory usage alto

**Fix Opzionale**:
```javascript
const [currentPage, setCurrentPage] = useState(1)
const ITEMS_PER_PAGE = 10

const paginatedQuestions = filteredQuestions.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
)

return (
  <>
    {paginatedQuestions.map(question => ...)}
    <Pagination current={currentPage} onChange={setCurrentPage} />
  </>
)
```

**Priority**: Bassa
**Effort**: 2 ore

---

## 🟢 **BUG BASSI** (2)

### **BUG-021: Console.log in Produzione**
**Severity**: 🟢 Bassa
**Categoria**: Code Quality
**File**: `frontend/src/components/Dashboard.jsx:28,45`

**Descrizione**:
```javascript
console.log('Overview stats:', result)
console.log('Domande caricate:', result)
```

**Impatto**:
- Espone informazioni in browser console
- Aumenta leggermente bundle size
- Non professionale

**Fix**:
```javascript
// Rimuovere o usare logger condizionale
if (import.meta.env.DEV) {
  console.log('Overview stats:', result)
}
```

**Priority**: Bassa
**Effort**: 5 minuti

---

### **BUG-022: Mancanza Favicon**
**Severity**: 🟢 Bassa
**Categoria**: UX
**File**: `frontend/public/` (mancante)

**Descrizione**:
Nessun favicon configurato, browser mostra icona default.

**Fix**:
```bash
# Aggiungere favicon
cp logo.png frontend/public/favicon.ico

# Aggiornare index.html
<link rel="icon" type="image/png" href="/favicon.ico" />
```

**Priority**: Bassa
**Effort**: 10 minuti

---

## 📊 **PRIORITÀ DI RISOLUZIONE**

### **Settimana 1: Critici + Alti**
1. BUG-001: CORS aperto ⚡ **15 min**
2. BUG-009: Docker version ⚡ **1 min**
3. BUG-003: Hardcoded IP ⚡ **10 min**
4. BUG-004: Password in chiaro ⚡ **20 min**
5. BUG-005: Variabili non usate ⚡ **5 min**
6. BUG-002: React hooks violation **30 min**
7. BUG-006: Lexical declarations **15 min**
8. BUG-007: Missing dependencies **20 min**
9. BUG-008: Retry logic **30 min**

**Totale**: ~2.5 ore

### **Settimana 2: Medi (selezionati)**
10. BUG-010-012: Code cleanup **15 min**
11. BUG-017: .env setup **15 min**
12. BUG-013: Caching **2-4 ore**
13. BUG-015: Rate limiting **2 ore**
14. BUG-016: Structured logging **3 ore**

**Totale**: ~8 ore

### **Opzionali: Bassi**
- BUG-021: Console.log **5 min**
- BUG-022: Favicon **10 min**

---

## ✅ **TESTING CHECKLIST**

Dopo ogni fix, verificare:

```bash
# 1. ESLint
cd frontend && npm run lint

# 2. Backend health
curl http://localhost:8118/health

# 3. Frontend build
cd frontend && npm run build

# 4. Docker
docker-compose down
docker-compose up -d --build
docker-compose ps

# 5. API Tests
curl http://localhost:8118/api/students
curl http://localhost:8118/api/teachers
curl http://localhost:8118/api/comparison
curl http://localhost:8118/api/tools

# 6. Frontend
open http://localhost:5180
```

---

## 📈 **METRICHE POST-FIX**

### **Obiettivi**
- ✅ 0 errori ESLint
- ✅ 0 warnings ESLint
- ✅ 0 security issues critiche
- ✅ 100% portabilità (no hardcoded IPs)
- ✅ Retry logic implementato
- ✅ Caching attivo (>80% hit rate)

### **KPI**
| Metrica | Attuale | Target | Miglioramento |
|---------|---------|--------|---------------|
| ESLint errors | 10 | 0 | -100% |
| ESLint warnings | 2 | 0 | -100% |
| Hardcoded configs | 3 | 0 | -100% |
| API latency | 200-500ms | 50-100ms | -75% |
| Cache hit rate | 0% | 80% | +80% |

---

**Status**: Bug report completo, pronto per fixing
**Next Step**: Iniziare risoluzione da BUG-001 (CORS)
