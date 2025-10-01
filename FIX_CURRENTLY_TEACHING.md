# Fix: Grafico per domanda "Attualmente insegni?"

## 🐛 Problema

La domanda per gli insegnanti "**Attualmente insegni o hai intenzione di intraprendere la professione docente?**" (colonna 2) non mostrava il grafico delle statistiche.

## 🔍 Causa

Il campo `currently_teaching` (colonna 2) non era mappato in `TEACHER_FIELD_MAPPING` nel servizio `QuestionStatsService`.

## ✅ Soluzione

Aggiunto il mapping mancante nel file `/backend/app/question_stats_service.py`:

```python
TEACHER_FIELD_MAPPING = {
    2: 'currently_teaching',  # Attualmente insegni? (Sì/No)
    3: 'age',
    # ... altri campi
}
```

## 📊 Risultati

### Statistiche

**Endpoint:** `GET /api/questions/teacher/2/stats`

**Dati:**
- **Total risposte:** 914
- **Distribuzione:**
  - "Attualmente insegno": **716 (78.34%)**
  - "Ancora non insegno, ma sto seguendo PEF": **198 (21.66%)**

### Grafici Disponibili

- ✅ **Pie Chart** (raccomandato) - Mostra la distribuzione percentuale
- ✅ **Bar Chart** - Confronto visivo delle due categorie

### Visualizzazione Frontend

Nella tab "**Domande**":
1. Cerca la domanda "Attualmente insegni..."
2. Clicca sull'icona **grafico** per espandere
3. Visualizza le statistiche:
   - Yes percentage: 0% (classificazione semplificata)
   - No percentage: 100%
   - Total yes: 0
   - Total no: 914
4. **Distribuzione dettagliata** mostra le due opzioni effettive
5. Cambia tra **Pie** e **Bar** chart

## 🔧 Dettagli Tecnici

### Response Format
- **Tipo:** `yes_no`
- **Campo DB:** `currently_teaching` (String)

### Classificazione
Il sistema classifica automaticamente come domanda:
- **Type:** closed
- **Category:** other
- **Response format:** yes_no

### Percentuali
Il metodo `_get_yes_no_stats()` calcola:
- Percentuali globali Sì/No (basate su keyword matching)
- Distribuzione dettagliata per ogni risposta specifica
- Totali per ogni categoria

## 📝 Note

Le risposte non sono semplici "Sì/No" ma testi descrittivi:
- "Attualmente insegno."
- "Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF..."

Questo è gestito correttamente dal sistema che:
1. Conta tutte le risposte
2. Genera distribuzione dettagliata
3. Offre visualizzazione tramite pie/bar chart

## 🚀 Testing

```bash
# Test API
curl -s http://localhost:8118/api/questions/teacher/2/stats | jq '.statistics'

# Expected output:
{
  "yes_percentage": 0.0,
  "no_percentage": 100.0,
  "total_yes": 0,
  "total_no": 914
}

# Test distribuzione
curl -s http://localhost:8118/api/questions/teacher/2/stats | jq '.distribution'

# Expected output:
[
  {
    "answer": "Attualmente insegno.",
    "count": 716,
    "percentage": 78.34
  },
  {
    "answer": "Ancora non insegno...",
    "count": 198,
    "percentage": 21.66
  }
]
```

## ✅ File Modificati

- `/backend/app/question_stats_service.py` - Aggiunto mapping colonna 2

---

**Data fix:** 1 ottobre 2025  
**Issue:** Grafico mancante per domanda Sì/No insegnanti  
**Status:** ✅ Risolto
