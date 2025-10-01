# Fix: Intestazione con Statistiche Corrette

## 🎯 Obiettivo

Correggere l'intestazione della dashboard per mostrare:
1. **Studenti**: 270 (numero corretto dopo la pulizia dei duplicati)
2. **Insegnanti**: 356 (solo insegnanti attualmente attivi)
3. **Insegnanti in Formazione**: 99 (insegnanti che seguono/hanno concluso percorso PEF)

## 📊 Dati Corretti

### Database (dopo pulizia duplicati)

| Categoria | Conteggio | Descrizione |
|-----------|-----------|-------------|
| **Studenti** | 270 | Totale risposte studenti |
| **Insegnanti Attivi** | 356 | "Attualmente insegno." |
| **Insegnanti in Formazione** | 99 | "Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF" |
| **Totale Insegnanti** | 455 | Attivi + In formazione |

### Fonte Dati - Domanda di Riferimento

**Domanda:** "Attualmente insegni o hai intenzione di intraprendere la professione docente?"

**Risposte possibili:**
1. ✅ **"Attualmente insegno."** → 356 insegnanti
2. 📚 **"Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti)."** → 99 insegnanti
3. ❌ Altre risposte (non insegna e non intende insegnare) → 0 insegnanti

**Campo database:** `currently_teaching` (colonna 2 del file Excel insegnanti)

## 🔧 Modifiche Implementate

### 1. Backend - Nuovo Endpoint `/api/overview`

**File:** `/backend/app/main.py`

**Nuovo endpoint:**
```python
@app.get("/api/overview")
def get_overview_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche di overview per l'intestazione"""
    try:
        # Conta studenti
        total_students = db.query(StudentResponse).count()
        
        # Conta insegnanti attivi
        active_teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Attualmente insegno.'
        ).count()
        
        # Conta insegnanti in formazione
        training_teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).'
        ).count()
        
        return {
            'students': total_students,
            'active_teachers': active_teachers,
            'training_teachers': training_teachers,
            'total_teachers': active_teachers + training_teachers
        }
    except Exception as e:
        logger.error(f"Error getting overview statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

**Response:**
```json
{
  "students": 270,
  "active_teachers": 356,
  "training_teachers": 99,
  "total_teachers": 455
}
```

### 2. Frontend - Dashboard Component

**File:** `/frontend/src/components/Dashboard.jsx`

#### Modifiche:

**A. Aggiunto stato per overview stats:**
```jsx
const [overviewStats, setOverviewStats] = useState(null)
```

**B. Aggiunto useEffect per caricare statistiche:**
```jsx
// Carica statistiche overview
useEffect(() => {
  const loadOverviewStats = async () => {
    try {
      const response = await fetch('http://localhost:8118/api/overview')
      const result = await response.json()
      setOverviewStats(result)
      console.log('Overview stats:', result)
    } catch (error) {
      console.error('Errore nel caricamento overview:', error)
    }
  }
  
  loadOverviewStats()
}, [])
```

**C. Aggiornato header con 3 card:**
```jsx
<div className="header-stats">
  <div className="stat-card">
    <span className="stat-label">Studenti</span>
    <span className="stat-value">{overviewStats?.students || 0}</span>
  </div>
  <div className="stat-card">
    <span className="stat-label">Insegnanti</span>
    <span className="stat-value">{overviewStats?.active_teachers || 0}</span>
  </div>
  <div className="stat-card">
    <span className="stat-label">Insegnanti in Formazione</span>
    <span className="stat-value">{overviewStats?.training_teachers || 0}</span>
  </div>
  <button className="refresh-btn" onClick={onRefresh}>
    <Icons.Refresh className="w-5 h-5" />
    Aggiorna
  </button>
</div>
```

## ✅ Risultato Finale

### Prima del Fix
```
┌─────────────────────────────────────────────┐
│  Analisi Questionari AI - CNR               │
├─────────────────────────────────────────────┤
│  Studenti: 544  │  Insegnanti: 0  │ [Agg]  │ ❌ Numeri sbagliati
└─────────────────────────────────────────────┘
```

### Dopo il Fix
```
┌───────────────────────────────────────────────────────────────┐
│  Analisi Questionari AI - CNR                                 │
├───────────────────────────────────────────────────────────────┤
│  Studenti: 270  │  Insegnanti: 356  │  In Formazione: 99  │  │ ✅ Corretto!
└───────────────────────────────────────────────────────────────┘
```

## 🧪 Test e Verifica

### Test Backend

```bash
# Test endpoint overview
curl -s http://localhost:8118/api/overview | jq
```

**Output atteso:**
```json
{
  "students": 270,
  "active_teachers": 356,
  "training_teachers": 99,
  "total_teachers": 455
}
```

### Verifica Database

```bash
docker exec questionnaire_backend python -c "
from app.database import SessionLocal
from app.models import TeacherResponse
from sqlalchemy import func

db = SessionLocal()

# Verifica valori
values = db.query(TeacherResponse.currently_teaching, func.count(TeacherResponse.id))\
    .group_by(TeacherResponse.currently_teaching)\
    .all()

for val, count in values:
    print(f'{count:3d} - {val}')
"
```

**Output atteso:**
```
356 - Attualmente insegno.
 99 - Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).
```

### Test Frontend

1. Aprire http://localhost:5180
2. Verificare l'intestazione mostra:
   - **Studenti:** 270
   - **Insegnanti:** 356
   - **Insegnanti in Formazione:** 99

## 📝 Note Tecniche

### Differenza tra Endpoint

| Endpoint | Scopo | Dati Restituiti |
|----------|-------|-----------------|
| `/api/overview` | Statistiche intestazione | Conteggi semplici (studenti, insegnanti attivi, in formazione) |
| `/api/students` | Analisi studenti | Statistiche complete studenti (competenze, utilizzo, etc.) |
| `/api/teachers` | Analisi insegnanti | Statistiche complete insegnanti (solo attivi per default) |
| `/api/teachers?include_non_teaching=true` | Analisi tutti | Include anche insegnanti in formazione nelle statistiche |

### Perché un Endpoint Separato?

1. **Performance**: `/api/overview` è molto veloce (solo COUNT queries)
2. **Separazione logica**: L'intestazione non ha bisogno di tutte le statistiche dettagliate
3. **Chiarezza**: Distingue tra "statistiche header" e "analisi dettagliate"
4. **Flessibilità**: Permette di aggiungere altri dati all'overview in futuro

## 🚀 Deploy

```bash
# 1. Rebuild backend
cd /home/nugh75/q-ai
docker-compose up -d --build backend

# 2. Test endpoint
curl -s http://localhost:8118/api/overview | jq

# 3. Rebuild frontend
docker-compose up -d --build frontend

# 4. Verifica su browser
# Aprire http://localhost:5180
```

## 🎯 Impact

### Prima
- ❌ Numeri sbagliati (duplicati)
- ❌ Solo 2 statistiche
- ❌ Non distingue insegnanti attivi da formazione

### Dopo
- ✅ Numeri corretti (270, 356, 99)
- ✅ 3 statistiche chiare
- ✅ Distinzione tra insegnanti attivi e in formazione
- ✅ Dati allineati con database pulito

## 📚 Riferimenti

- **Documento pulizia database:** `FIX_DATABASE_DUPLICATES.md`
- **File Excel insegnanti:** `dati/Insegnati - Questionario - CNR.xlsx`
- **Colonna currently_teaching:** Colonna 2 del file Excel
- **API Documentation:** http://localhost:8118/docs

---

**Data fix:** 2 ottobre 2025  
**Tipo:** UI Enhancement + API Endpoint  
**Impact:** High (visibilità dati corretti)  
**Status:** ✅ Production Ready
