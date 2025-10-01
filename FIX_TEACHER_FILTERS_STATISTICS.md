# Fix: Filtri Statistiche Insegnanti per Tipo

## 🎯 Obiettivo

Implementare filtri funzionali per distinguere le statistiche tra:
1. **Insegnanti Totali** (455): Tutti gli insegnanti
2. **Insegnanti** (356): Solo insegnanti attivi ("Attualmente insegno.")
3. **Insegnanti in Formazione** (99): Solo insegnanti in formazione PEF

## 📊 Numeri Corretti

| Categoria | Conteggio | Filtro Database |
|-----------|-----------|-----------------|
| **Studenti** | 270 | N/A |
| **Insegnanti Totali** | 455 | Tutti i TeacherResponse |
| **Insegnanti Attivi** | 356 | `currently_teaching = 'Attualmente insegno.'` |
| **Insegnanti in Formazione** | 99 | `currently_teaching = 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF...'` |

**Verifica:** 356 + 99 = 455 ✅

## 🔧 Modifiche Backend

### 1. Nuovi Endpoint API

**File:** `/backend/app/main.py`

#### Endpoint `/api/teachers/active`
```python
@app.get("/api/teachers/active")
def get_active_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche solo degli insegnanti attivi (356)"""
    analytics = Analytics(db)
    stats = analytics.get_teacher_statistics(include_non_teaching=False)
    return stats
```

#### Endpoint `/api/teachers/training`
```python
@app.get("/api/teachers/training")
def get_training_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche solo degli insegnanti in formazione (99)"""
    query = db.query(TeacherResponse).filter(
        TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).'
    )
    total_responses = query.count()
    # ...
    return base_stats
```

#### Endpoint `/api/teachers/total`
```python
@app.get("/api/teachers/total")
def get_total_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche di tutti gli insegnanti (455 totali)"""
    analytics = Analytics(db)
    stats = analytics.get_teacher_statistics(include_non_teaching=True)
    return stats
```

### 2. Parametro Query per Statistiche Domande

**Endpoint aggiornato:** `/api/questions/{respondent_type}/{column_index}/stats`

**Nuovo parametro:** `teacher_type` (opzionale)

```python
@app.get("/api/questions/{respondent_type}/{column_index}/stats")
def get_question_statistics(
    respondent_type: str,
    column_index: int,
    teacher_type: Optional[str] = None,  # 'active', 'training', o None
    db: Session = Depends(get_db)
):
    stats_service = QuestionStatsService(db)
    stats = stats_service.get_question_stats(column_index, respondent_type, teacher_type)
    return stats
```

**Esempi di chiamata:**
```bash
# Tutti gli insegnanti
GET /api/questions/teacher/9/stats

# Solo insegnanti attivi
GET /api/questions/teacher/9/stats?teacher_type=active

# Solo insegnanti in formazione
GET /api/questions/teacher/9/stats?teacher_type=training
```

### 3. QuestionStatsService Aggiornato

**File:** `/backend/app/question_stats_service.py`

Tutti i metodi di calcolo statistiche ora accettano `teacher_type`:

```python
def get_question_stats(self, column_index: int, respondent_type: str, teacher_type: Optional[str] = None):
    # ...
    if question_info['response_format'] == 'scale_1_7':
        return self._get_scale_stats(field_name, respondent_type, question_info, teacher_type)
    # ... altri formati
```

**Filtro applicato in ogni metodo statistico:**

```python
def _get_scale_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None):
    query = self.db.query(field).filter(field.isnot(None))
    
    # Applica filtro per tipo insegnante se specificato
    if respondent_type == 'teacher' and teacher_type:
        if teacher_type == 'active':
            query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
        elif teacher_type == 'training':
            query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')
    
    values = query.all()
    # ... calcola statistiche
```

**Metodi aggiornati:**
- ✅ `_get_scale_stats()`
- ✅ `_get_numeric_stats()`
- ✅ `_get_yes_no_stats()`
- ✅ `_get_multiple_choice_stats()`

## 🎨 Modifiche Frontend

### 1. Componente Dashboard

**File:** `/frontend/src/components/Dashboard.jsx`

**Passa il filtro a QuestionStats:**

```jsx
{hasStats && isExpanded && (
  <QuestionStats 
    question={q} 
    teacherFilter={questionFilter.respondent}
  />
)}
```

### 2. Componente QuestionStats

**File:** `/frontend/src/components/QuestionStats.jsx`

**Accetta e usa teacherFilter:**

```jsx
function QuestionStats({ question, teacherFilter }) {
  const fetchStats = async () => {
    // Costruisci URL con filtro per insegnanti
    let url = `http://localhost:8118/api/questions/${question.respondent_type}/${question.column_index}/stats`
    
    // Se è una domanda insegnanti e abbiamo un filtro specifico
    if (question.respondent_type === 'teacher' && teacherFilter) {
      if (teacherFilter === 'teacher_active') {
        url += '?teacher_type=active'
      } else if (teacherFilter === 'teacher_training') {
        url += '?teacher_type=training'
      }
      // 'teacher' o 'all' = tutti gli insegnanti (default)
    }
    
    const response = await fetch(url)
    // ...
  }
}
```

**useEffect aggiornato:**
```jsx
useEffect(() => {
  fetchStats()
}, [question, teacherFilter])  // Ricarica quando cambia il filtro
```

## 📋 Flusso Completo

### Scenario 1: Utente seleziona "Insegnanti"

1. **Frontend**: `questionFilter.respondent = 'teacher_active'`
2. **Dashboard**: Passa `teacherFilter='teacher_active'` a QuestionStats
3. **QuestionStats**: Aggiunge `?teacher_type=active` all'URL
4. **Backend**: Filtra `TeacherResponse.currently_teaching == 'Attualmente insegno.'`
5. **Risultato**: Statistiche calcolate su **356 insegnanti attivi** ✅

### Scenario 2: Utente seleziona "Insegnanti in Formazione"

1. **Frontend**: `questionFilter.respondent = 'teacher_training'`
2. **Dashboard**: Passa `teacherFilter='teacher_training'` a QuestionStats
3. **QuestionStats**: Aggiunge `?teacher_type=training` all'URL
4. **Backend**: Filtra con condizione PEF
5. **Risultato**: Statistiche calcolate su **99 insegnanti in formazione** ✅

### Scenario 3: Utente seleziona "Insegnanti Totali"

1. **Frontend**: `questionFilter.respondent = 'teacher'`
2. **Dashboard**: Passa `teacherFilter='teacher'` a QuestionStats
3. **QuestionStats**: Non aggiunge parametri (default)
4. **Backend**: Nessun filtro applicato
5. **Risultato**: Statistiche calcolate su **455 insegnanti totali** ✅

## 🧪 Test e Verifica

### Test Backend

```bash
# Test overview
curl -s http://localhost:8118/api/overview | jq
# Output: {"students": 270, "active_teachers": 356, "training_teachers": 99, "total_teachers": 455}

# Test domanda insegnanti - tutti
curl -s 'http://localhost:8118/api/questions/teacher/9/stats' | jq '.response_count'
# Output: 455

# Test domanda insegnanti - attivi
curl -s 'http://localhost:8118/api/questions/teacher/9/stats?teacher_type=active' | jq '.response_count'
# Output: 356

# Test domanda insegnanti - formazione
curl -s 'http://localhost:8118/api/questions/teacher/9/stats?teacher_type=training' | jq '.response_count'
# Output: 99
```

### Test Frontend

1. **Aprire** http://localhost:5180
2. **Navigare** alla tab "Domande"
3. **Selezionare filtro** "Insegnanti"
4. **Espandere** una domanda insegnanti con statistiche
5. **Verificare** che `response_count` mostri **356**
6. **Cambiare filtro** a "Insegnanti in Formazione"
7. **Verificare** che `response_count` mostri **99**
8. **Cambiare filtro** a "Insegnanti Totali"
9. **Verificare** che `response_count` mostri **455**

## 📊 Mapping Filtri

| Filtro UI | Valore `questionFilter.respondent` | Parametro API | Response Count |
|-----------|-----------------------------------|---------------|----------------|
| Tutti | `all` | N/A | Varia |
| Studenti | `student` | N/A | 270 |
| Insegnanti Totali | `teacher` | (nessuno) | 455 |
| Insegnanti | `teacher_active` | `?teacher_type=active` | 356 |
| Insegnanti in Formazione | `teacher_training` | `?teacher_type=training` | 99 |

## 🎯 Risultato Finale

### Prima del Fix
```
Filtro: "Insegnanti"
├── Mostra domande insegnanti ✅
└── Statistiche: sempre su 455 ❌ (sbagliato)
```

### Dopo il Fix
```
Filtro: "Insegnanti" (356 attivi)
├── Mostra domande insegnanti ✅
└── Statistiche: calcolate su 356 ✅ (corretto!)

Filtro: "Insegnanti in Formazione" (99)
├── Mostra domande insegnanti ✅
└── Statistiche: calcolate su 99 ✅ (corretto!)

Filtro: "Insegnanti Totali" (455)
├── Mostra domande insegnanti ✅
└── Statistiche: calcolate su 455 ✅ (corretto!)
```

## ✅ Verifica Numeri

### Query Database Diretta

```python
from app.database import SessionLocal
from app.models import TeacherResponse

db = SessionLocal()

# Totale
total = db.query(TeacherResponse).count()
print(f'Totale: {total}')  # 455

# Attivi
active = db.query(TeacherResponse).filter(
    TeacherResponse.currently_teaching == 'Attualmente insegno.'
).count()
print(f'Attivi: {active}')  # 356

# Formazione
training = db.query(TeacherResponse).filter(
    TeacherResponse.currently_teaching.like('%PEF%')
).count()
print(f'Formazione: {training}')  # 99
```

**Output atteso:**
```
Totale: 455
Attivi: 356
Formazione: 99
```

**Verifica matematica:** 356 + 99 = 455 ✅

## 🚀 Deploy

```bash
# Rebuild completo
cd /home/nugh75/q-ai
docker-compose up -d --build

# Verifica backend
curl -s http://localhost:8118/api/overview | jq

# Verifica frontend
# Apri http://localhost:5180 e testa i filtri
```

## 📝 Note Tecniche

### Perché Non Solo Endpoint Separati?

Abbiamo implementato **sia** endpoint separati (`/api/teachers/active`, `/api/teachers/training`) **sia** parametri query (`?teacher_type=...`) per:

1. **Endpoint separati**: Per statistiche aggregate complete (tab insegnanti)
2. **Parametri query**: Per statistiche per singola domanda (componente QuestionStats)

Questo approccio offre **massima flessibilità** e **performance ottimale**.

### Gestione Cache Frontend

Il componente QuestionStats si aggiorna automaticamente quando:
- Cambia la domanda (`question` prop)
- Cambia il filtro (`teacherFilter` prop)

Grazie a: `useEffect(() => { fetchStats() }, [question, teacherFilter])`

### Performance

Le query filtrate sono **efficienti** perché:
- Usano indici su `currently_teaching`
- Filtrano prima di aggregare
- Non caricano dati non necessari

## 🎉 Impact

### Prima
- ❌ Statistiche sempre su 455 insegnanti
- ❌ Impossibile distinguere attivi vs formazione
- ❌ Dati aggregati non rappresentativi

### Dopo
- ✅ Statistiche corrette per ogni gruppo
- ✅ Filtri funzionali (356 attivi, 99 formazione)
- ✅ Dati granulari e rappresentativi
- ✅ UI intuitiva con 5 opzioni filtro

---

**Data fix:** 2 ottobre 2025  
**Tipo:** Backend API + Frontend Filtering  
**Impact:** Critical (correttezza dati)  
**Status:** ✅ Production Ready
