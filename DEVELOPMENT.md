# 🛠️ Development Guide - Guida Sviluppo

Questa guida spiega come sviluppare, estendere e personalizzare l'applicazione.

---

## 🔧 Setup Ambiente Sviluppo

### Backend (Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Frontend (React)
```bash
cd frontend
npm install
```

### Database
```bash
# Avvia solo PostgreSQL
docker-compose up -d db
```

---

## 🚀 Avvio Sviluppo

### Opzione 1: Docker Compose (Raccomandato)
```bash
docker-compose up -d
# Hot reload attivo per frontend e backend
```

### Opzione 2: Locale
```bash
# Terminal 1: Database
docker-compose up -d db

# Terminal 2: Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm run dev
```

---

## 📊 Aggiungere Nuova Analisi

### 1. Backend - Logica Analisi

**File**: `backend/app/analytics.py`

```python
class Analytics:
    # ... codice esistente ...

    def get_custom_analysis(self) -> Dict[str, Any]:
        """Nuova analisi personalizzata"""
        students = self.db.query(StudentResponse).all()

        # Implementa la tua logica
        result = {}

        return result
```

### 2. Backend - Nuovo Endpoint

**File**: `backend/app/main.py`

```python
@app.get("/api/custom-analysis")
def get_custom_analysis(db: Session = Depends(get_db)):
    """Endpoint per nuova analisi"""
    try:
        analytics = Analytics(db)
        result = analytics.get_custom_analysis()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. Frontend - Consuma API

**File**: `frontend/src/App.jsx`

```javascript
const loadData = async () => {
  const customData = await axios.get(`${API_URL}/api/custom-analysis`)

  setData({
    ...data,
    custom: customData.data
  })
}
```

### 4. Frontend - Visualizza Dati

**File**: `frontend/src/components/Dashboard.jsx`

```javascript
// Aggiungi nuovo tab
<button
  className={activeTab === 'custom' ? 'active' : ''}
  onClick={() => setActiveTab('custom')}
>
  Nuova Analisi
</button>

// Aggiungi sezione contenuto
{activeTab === 'custom' && (
  <div className="custom-tab">
    <h2>Nuova Analisi</h2>
    {/* I tuoi componenti qui */}
  </div>
)}
```

---

## 🎨 Personalizzare Design

### Cambiare Colori Dashboard

**File**: `frontend/src/components/Dashboard.css`

```css
.dashboard {
  /* Cambia gradiente */
  background: linear-gradient(135deg, #tuocolore1 0%, #tuocolore2 100%);
}

.chart-section h2 {
  /* Cambia colore titoli */
  color: #tuocolore;
}
```

### Aggiungere Nuovo Tipo Grafico

```javascript
import { PieChart, Pie, Cell } from 'recharts'

// Nel componente Dashboard
<PieChart width={400} height={400}>
  <Pie
    data={data}
    cx={200}
    cy={200}
    labelLine={false}
    outerRadius={80}
    fill="#8884d8"
    dataKey="value"
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

---

## 📝 Modificare Parsing Excel

### Aggiungere Nuova Colonna

**File**: `backend/app/excel_parser.py`

```python
def parse_student_responses(self) -> List[Dict[str, Any]]:
    df = pd.read_excel(self.student_file, sheet_name='Risposte del modulo 1')

    for _, row in df.iterrows():
        response = {
            # ... campi esistenti ...
            'new_field': str(row.iloc[N]) if pd.notna(row.iloc[N]) else None,
        }
        responses.append(response)
```

### Aggiornare Modello Database

**File**: `backend/app/models.py`

```python
class StudentResponse(Base):
    # ... campi esistenti ...
    new_field = Column(String)
```

### Ricostruire Database
```bash
docker-compose down -v  # Rimuovi volumi
docker-compose up -d    # Ricrea tutto
```

---

## 🔍 Debug e Testing

### Backend - Debug con Logs

```python
import logging

logger = logging.getLogger(__name__)

@app.get("/api/endpoint")
def endpoint(db: Session = Depends(get_db)):
    logger.info("Processing request...")
    logger.debug(f"Data: {data}")
    return result
```

### Frontend - Debug con Console

```javascript
useEffect(() => {
  console.log('Data loaded:', data)
  console.log('Active tab:', activeTab)
}, [data, activeTab])
```

### Visualizza Logs Docker

```bash
# Tutti i servizi
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend

# Solo database
docker-compose logs -f db
```

---

## 🗄️ Database

### Accedere a PostgreSQL

```bash
# Via Docker
docker-compose exec db psql -U user -d questionnaire_db

# Via locale (se hai psql installato)
psql postgresql://user:password@localhost:5432/questionnaire_db
```

### Query Utili

```sql
-- Conta risposte
SELECT COUNT(*) FROM student_responses;
SELECT COUNT(*) FROM teacher_responses;

-- Vedi struttura tabella
\d student_responses

-- Query esempio
SELECT age, gender, practical_competence
FROM student_responses
WHERE practical_competence > 5;

-- Cancella tutti i dati
TRUNCATE student_responses, teacher_responses CASCADE;
```

### Export Dati

```bash
# Export a CSV
docker-compose exec db psql -U user -d questionnaire_db -c "\COPY student_responses TO '/tmp/students.csv' WITH CSV HEADER"

# Backup database
docker-compose exec db pg_dump -U user questionnaire_db > backup.sql
```

---

## 🧪 Testing

### Test Backend con pytest

**File**: `backend/tests/test_analytics.py`

```python
import pytest
from app.analytics import Analytics

def test_student_statistics():
    # Setup
    # ...

    # Execute
    stats = analytics.get_student_statistics()

    # Assert
    assert stats['total_responses'] > 0
    assert 'competenze' in stats
```

### Test API con curl

```bash
# Health check
curl http://localhost:8000/health

# Import data
curl -X POST http://localhost:8000/api/import

# Get students
curl http://localhost:8000/api/students | python -m json.tool
```

### Test Frontend

```javascript
// Test component render
import { render, screen } from '@testing-library/react'
import Dashboard from './components/Dashboard'

test('renders dashboard', () => {
  render(<Dashboard data={mockData} />)
  expect(screen.getByText(/Panoramica/i)).toBeInTheDocument()
})
```

---

## 🔄 Hot Reload

### Backend
Il backend usa `--reload` di uvicorn:
- Modifica file Python → ricarica automatica
- Controlla logs: `docker-compose logs -f backend`

### Frontend
Vite ha hot reload nativo:
- Modifica JSX/CSS → aggiornamento istantaneo
- No refresh necessario

---

## 📦 Build Produzione

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
# Output in: dist/
```

### Docker Production
```yaml
# docker-compose.prod.yml
services:
  backend:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build:
      target: production
    command: npm run preview
```

---

## 🔐 Sicurezza Produzione

### Backend
```python
# Limita CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tuo-dominio.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Aggiungi autenticazione
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.get("/api/protected")
def protected(credentials: HTTPAuthorizationCredentials = Security(security)):
    # Verifica token
    pass
```

### Database
```yaml
# docker-compose.prod.yml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}  # Da variabile ambiente
```

### HTTPS
```yaml
# nginx.conf
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://frontend:5173;
    }

    location /api {
        proxy_pass http://backend:8000;
    }
}
```

---

## 📊 Monitoring

### Prometheus + Grafana

**File**: `backend/app/main.py`

```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Metriche automatiche
Instrumentator().instrument(app).expose(app)
```

### Logs Strutturati

```python
import structlog

logger = structlog.get_logger()

@app.get("/api/endpoint")
def endpoint():
    logger.info("request_received", endpoint="/api/endpoint")
    # ...
    logger.info("request_completed", duration=0.5)
```

---

## 🚢 Deploy

### Docker Hub
```bash
# Build
docker build -t username/questionnaire-backend:latest ./backend
docker build -t username/questionnaire-frontend:latest ./frontend

# Push
docker push username/questionnaire-backend:latest
docker push username/questionnaire-frontend:latest
```

### Kubernetes
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: username/questionnaire-backend:latest
        ports:
        - containerPort: 8000
```

### Cloud Run (GCP)
```bash
gcloud run deploy backend \
  --image gcr.io/project/backend \
  --platform managed \
  --region europe-west1
```

---

## 🎯 Best Practices

### Code Style

**Python (Backend)**
```bash
# Formattazione
black backend/app/

# Linting
flake8 backend/app/

# Type checking
mypy backend/app/
```

**JavaScript (Frontend)**
```bash
# Formattazione
npm run format

# Linting
npm run lint
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/nuova-analisi

# Commit
git add .
git commit -m "feat: aggiungi analisi personalizzata"

# Push
git push origin feature/nuova-analisi
```

### Documentazione
- Commenta funzioni complesse
- Aggiorna README per nuove features
- Documenta API con docstrings

---

## 📚 Risorse Utili

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev
- **Recharts**: https://recharts.org
- **Docker**: https://docs.docker.com
- **PostgreSQL**: https://www.postgresql.org/docs

---

## 🤝 Contributing

1. Fork del progetto
2. Crea feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

**Happy Coding! 🚀**
