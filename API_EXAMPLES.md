# 📡 API Examples - Esempi di Utilizzo

Questa guida mostra come utilizzare l'API del sistema di analisi questionari.

---

## 🏥 Health Check

Verifica stato del sistema e dati importati.

### Request
```bash
curl http://localhost:8000/health
```

### Response
```json
{
  "status": "healthy",
  "database": "connected",
  "student_responses": 45,
  "teacher_responses": 32
}
```

---

## 📥 Importa Dati Excel

Importa o aggiorna i dati dai file Excel nel database.

### Request
```bash
curl -X POST http://localhost:8000/api/import
```

### Response
```json
{
  "status": "success",
  "students_imported": 45,
  "teachers_imported": 32
}
```

---

## 📊 Statistiche Studenti

Ottieni analisi complete delle risposte studenti.

### Request
```bash
curl http://localhost:8000/api/students
```

### Response Esempio
```json
{
  "total_responses": 45,
  "competenze": {
    "practical": {
      "mean": 4.5,
      "median": 5,
      "distribution": {
        "1": 2,
        "2": 3,
        "3": 5,
        "4": 8,
        "5": 12,
        "6": 10,
        "7": 5
      }
    },
    "theoretical": {
      "mean": 3.8,
      "median": 4,
      "distribution": {...}
    }
  },
  "impatto_fiducia": {
    "ai_change_study": {
      "mean": 5.2,
      "median": 5,
      "distribution": {...}
    },
    "training_adequacy": {...},
    "trust_integration": {...}
  },
  "preoccupazioni": {
    "concern_ai_school": {...},
    "concern_ai_peers": {...}
  },
  "utilizzo": {
    "uses_ai_daily_count": 38,
    "uses_ai_daily_percentage": 84.4,
    "uses_ai_study_count": 35,
    "uses_ai_study_percentage": 77.8,
    "hours_daily_avg": 3.5,
    "hours_study_avg": 2.8
  },
  "demographics": {
    "age_avg": 23.5,
    "age_min": 18,
    "age_max": 35,
    "gender_distribution": {
      "Maschio": 20,
      "Femmina": 25
    },
    "school_type_distribution": {...}
  }
}
```

---

## 👨‍🏫 Statistiche Insegnanti

Ottieni analisi complete delle risposte insegnanti.

### Request (solo insegnanti attivi)
```bash
curl http://localhost:8000/api/teachers
```

### Request (includi non insegnanti)
```bash
curl "http://localhost:8000/api/teachers?include_non_teaching=true"
```

### Response Esempio
```json
{
  "total_responses": 32,
  "competenze": {
    "practical": {
      "mean": 3.9,
      "median": 4,
      "distribution": {...}
    },
    "theoretical": {
      "mean": 3.5,
      "median": 3,
      "distribution": {...}
    }
  },
  "impatto": {
    "ai_change_teaching": {
      "mean": 5.5,
      "median": 6,
      "distribution": {...}
    },
    "ai_change_my_teaching": {...},
    "training_adequacy": {...}
  },
  "fiducia": {
    "trust_integration": {...},
    "trust_students": {...}
  },
  "preoccupazioni": {
    "concern_ai_education": {...},
    "concern_ai_students": {...}
  },
  "utilizzo": {
    "uses_ai_daily_count": 25,
    "uses_ai_daily_percentage": 78.1,
    "uses_ai_teaching_count": 20,
    "uses_ai_teaching_percentage": 62.5,
    "hours_daily_avg": 2.5,
    "hours_training_avg": 1.5,
    "hours_planning_avg": 2.0
  },
  "demographics": {...}
}
```

---

## 🔄 Analisi Comparativa

Confronta studenti e insegnanti sulle domande speculari.

### Request
```bash
curl http://localhost:8000/api/comparison
```

### Response Esempio
```json
{
  "comparisons": [
    {
      "question": "Competenza pratica AI",
      "category": "competenze",
      "students": {
        "mean": 4.5,
        "median": 5,
        "distribution": {...}
      },
      "teachers": {
        "mean": 3.9,
        "median": 4,
        "distribution": {...}
      },
      "difference": -0.6
    },
    {
      "question": "Competenza teorica AI",
      "category": "competenze",
      "students": {
        "mean": 3.8,
        "median": 4,
        "distribution": {...}
      },
      "teachers": {
        "mean": 3.5,
        "median": 3,
        "distribution": {...}
      },
      "difference": -0.3
    },
    {
      "question": "Fiducia integrazione AI",
      "category": "fiducia",
      "students": {...},
      "teachers": {...},
      "difference": 0.5
    }
  ],
  "summary": {
    "total_students": 45,
    "total_teachers": 32
  }
}
```

---

## 🛠️ Strumenti AI Utilizzati

Analizza gli strumenti AI più utilizzati.

### Request
```bash
curl http://localhost:8000/api/tools
```

### Response Esempio
```json
{
  "student_tools": {
    "Chatgpt 4": 25,
    "Claude": 15,
    "Gemini": 12,
    "Perplexity": 8,
    "Copilot": 5
  },
  "teacher_tools": {
    "ChatGPT": 18,
    "Claude": 10,
    "Gemini": 8,
    "Notion AI": 6,
    "Canva AI": 4
  }
}
```

---

## 🐍 Esempi Python

### Importa e ottieni dati
```python
import requests

BASE_URL = "http://localhost:8000"

# Import data
response = requests.post(f"{BASE_URL}/api/import")
print(f"Imported: {response.json()}")

# Get student stats
students = requests.get(f"{BASE_URL}/api/students").json()
print(f"Average practical competence: {students['competenze']['practical']['mean']}")

# Get comparison
comparison = requests.get(f"{BASE_URL}/api/comparison").json()
for comp in comparison['comparisons']:
    print(f"{comp['question']}: Difference = {comp['difference']}")
```

### Analisi personalizzata
```python
import requests
import pandas as pd

# Get all data
students = requests.get("http://localhost:8000/api/students").json()
teachers = requests.get("http://localhost:8000/api/teachers").json()

# Create DataFrame
data = {
    'Gruppo': ['Studenti', 'Insegnanti'],
    'Competenza Pratica': [
        students['competenze']['practical']['mean'],
        teachers['competenze']['practical']['mean']
    ],
    'Ore Settimanali': [
        students['utilizzo']['hours_daily_avg'],
        teachers['utilizzo']['hours_daily_avg']
    ]
}

df = pd.DataFrame(data)
print(df)
```

---

## 🌐 Esempi JavaScript/Fetch

### Frontend React/Vanilla JS
```javascript
const API_URL = 'http://localhost:8000';

// Import data
async function importData() {
  const response = await fetch(`${API_URL}/api/import`, {
    method: 'POST'
  });
  const data = await response.json();
  console.log('Imported:', data);
}

// Get statistics
async function getStats() {
  const [students, teachers, comparison] = await Promise.all([
    fetch(`${API_URL}/api/students`).then(r => r.json()),
    fetch(`${API_URL}/api/teachers`).then(r => r.json()),
    fetch(`${API_URL}/api/comparison`).then(r => r.json())
  ]);

  console.log('Students avg competence:',
    students.competenze.practical.mean);
  console.log('Teachers avg competence:',
    teachers.competenze.practical.mean);
}

// Get tools
async function getTools() {
  const response = await fetch(`${API_URL}/api/tools`);
  const tools = await response.json();

  console.log('Top student tool:',
    Object.keys(tools.student_tools)[0]);
}
```

---

## 📈 Esempi Axios (React)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000'
});

// Component example
function AnalysisComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const response = await api.get('/api/students');
      setData(response.data);
    }
    loadData();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Competenza Media: {data.competenze.practical.mean}</h2>
      <p>Risposte totali: {data.total_responses}</p>
    </div>
  );
}
```

---

## 🔍 Filtraggio e Query Parameters

### Filtra insegnanti
```bash
# Solo insegnanti attivi (default)
curl http://localhost:8000/api/teachers

# Includi anche non insegnanti
curl "http://localhost:8000/api/teachers?include_non_teaching=true"
```

---

## 📊 Swagger UI

Per testare interattivamente tutti gli endpoint:

👉 **http://localhost:8000/docs**

Features Swagger UI:
- Test endpoint direttamente nel browser
- Visualizza schemi request/response
- Genera codice esempio
- Valida parametri

---

## ⚡ Tips

1. **JSON Pretty Print**: Usa `| python3 -m json.tool` per formattare
   ```bash
   curl http://localhost:8000/api/students | python3 -m json.tool
   ```

2. **Save to file**: Salva risposta in file
   ```bash
   curl http://localhost:8000/api/comparison > comparison.json
   ```

3. **Headers**: Aggiungi headers custom
   ```bash
   curl -H "Content-Type: application/json" http://localhost:8000/api/students
   ```

4. **Verbose**: Debug con output dettagliato
   ```bash
   curl -v http://localhost:8000/health
   ```

---

## 🐛 Troubleshooting API

### Errore CORS
Verifica che il backend abbia CORS configurato (già fatto in `main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica domini
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Errore 500 - Database
```bash
# Verifica connessione DB
curl http://localhost:8000/health

# Controlla logs
docker-compose logs backend
```

### Errore 404 - Endpoint non trovato
Verifica URL e porta:
```bash
# Lista tutti gli endpoint disponibili
curl http://localhost:8000/
```

---

**Happy Coding! 🚀**
