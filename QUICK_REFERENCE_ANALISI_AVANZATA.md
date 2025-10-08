# Quick Reference - Sistema Analisi Qualitativa Avanzato

## 🎯 Due Miglioramenti Principali

### 1. **Minimo 20 Categorie** (prima: 6-8)
- Tassonomia più dettagliata e granulare
- Maggiore precisione nella classificazione
- Cattura sotto-temi e sfumature

### 2. **Report Narrativo con Citazioni** (prima: non esisteva)
- Analisi discorsiva stile accademico
- Citazioni dirette dalle risposte
- 1500-3000 parole strutturate

---

## 🚀 Come Usare

### Generare Analisi con 20+ Categorie

1. Vai su **Analisi Qualitativa**
2. Seleziona **domanda** + **gruppo rispondenti**
3. Click **"Avvia Analisi Qualitativa"**
4. Attendi 2-4 minuti
5. Visualizza **20+ categorie dettagliate**

### Generare Report Narrativo

1. Apri un'**analisi salvata**
2. Scorri fino a vedere il pulsante:
   ```
   📝 Vuoi un report discorsivo con citazioni delle risposte?
   [Genera Report Narrativo]
   ```
3. Click sul pulsante
4. Attendi **30-60 secondi** (LLM lavora)
5. Report appare automaticamente sopra

**Nota:** Il report viene salvato → richieste successive sono **istantanee**

---

## 📊 Esempio Output

### Tassonomia (22 categorie)
```
1.  PRO: Efficienza e Velocità (183 risposte, 68%)
2.  PRO: Efficienza nella Ricerca (124 risposte, 46%)
3.  PRO: Risparmio Tempo (98 risposte, 37%)
4.  PRO: Accessibilità 24/7 (156 risposte, 58%)
5.  PRO: Accessibilità Geografica (87 risposte, 32%)
6.  PRO: Personalizzazione Contenuti (124 risposte, 46%)
7.  PRO: Personalizzazione Ritmo (93 risposte, 35%)
8.  PRO: Supporto Immediato (167 risposte, 62%)
9.  CONTRO: Dipendenza Tecnologica (142 risposte, 53%)
10. CONTRO: Dipendenza Cognitiva (98 risposte, 37%)
...
22. CONTRO: Rischi Privacy (45 risposte, 17%)
```

### Report Narrativo (estratto)

```markdown
## Panoramica Generale

L'analisi qualitativa delle 268 risposte ha rivelato 22 categorie 
tematiche principali...

## PRO: Efficienza e Risparmio Tempo

Un tema dominante riguarda l'efficienza, presente in 183 risposte 
(68% del campione). Come sottolineato: *"L'AI mi aiuta a risolvere 
problemi in pochi secondi invece di ore"* (Codice STU_042).

Un altro studente osserva: *"Posso concentrarmi sulla comprensione 
invece di perdere tempo nella ricerca"* (Codice STU_089)...
```

---

## 🔧 Modifiche Tecniche (Sviluppatori)

### Backend

**File:** `backend/app/qualitative_service.py`
- `adjusted_max_categories = max(max_categories, 20)` (linea ~305)
- `generate_narrative_report()` metodo (linee ~620-720)
- `_generate_fallback_report()` metodo (linee ~722-750)

**File:** `backend/app/models.py`
- `narrative_report = Column(Text, nullable=True)` (linea ~166)

**File:** `backend/app/main.py`
- Endpoint: `POST /api/qualitative-analysis/taxonomy/{id}/generate-report` (linee ~3780-3860)
- Modificato: `GET /api/qualitative-analysis/taxonomy/{id}` (include `narrative_report`)

### Frontend

**File:** `frontend/src/components/QualitativeAnalysis.jsx`
- Sezione visualizzazione report (linee ~840-860)
- Pulsante genera report (linee ~862-895)
- Rendering Markdown → HTML (linee ~852-857)

### Database

```sql
ALTER TABLE qualitative_taxonomies 
ADD COLUMN narrative_report TEXT;
```

---

## 📈 API Endpoint

### Genera Report

**Request:**
```bash
POST /api/qualitative-analysis/taxonomy/{taxonomy_id}/generate-report
```

**Response:**
```json
{
  "taxonomy_id": 1,
  "report": "## Panoramica Generale\n\nL'analisi...",
  "cached": false
}
```

**Timing:**
- Prima chiamata: 30-60 secondi (genera + salva)
- Successive: <0.1 secondi (cached)

### Ottieni Dettagli Tassonomia

**Request:**
```bash
GET /api/qualitative-analysis/taxonomy/{taxonomy_id}
```

**Response:**
```json
{
  "id": 1,
  "taxonomy": [...],  // 20+ categorie
  "narrative_report": "...",  // Report se generato, altrimenti null
  "summary": {
    "category_counts": [...],
    "cooccurrence": [...]
  }
}
```

---

## 🧪 Test Rapidi

### 1. Verifica Campo Database
```bash
docker exec questionnaire_db psql -U user -d questionnaire_db -c \
  "SELECT narrative_report FROM qualitative_taxonomies LIMIT 1;"
```

### 2. Test Generazione Report
```bash
# Ottieni ID tassonomia
ID=$(curl -s http://localhost:8118/api/qualitative-analysis/taxonomies | \
     python3 -c "import sys, json; print(json.load(sys.stdin)['taxonomies'][0]['id'])")

# Genera report
curl -X POST http://localhost:8118/api/qualitative-analysis/taxonomy/$ID/generate-report
```

### 3. Test UI
1. `http://localhost:5180` → Analisi Qualitativa
2. Click analisi salvata
3. Verifica pulsante "Genera Report Narrativo"
4. Click → attendi → verifica report

---

## ⚠️ Troubleshooting

### Report non si genera
**Sintomi:** Pulsante non risponde o errore

**Soluzioni:**
1. Verifica backend logs: `docker logs questionnaire_backend --tail 50`
2. Check LLM configurato: Vai su Amministrazione → LLM Config
3. Verifica timeout: LLM potrebbe essere lento (attendi 90s)

### Report troncato
**Sintomi:** Report incompleto o malformato

**Soluzioni:**
1. Usa modello più potente (es: `mistral:7b` invece di `qwen2.5:1.5b`)
2. Aumenta `num_predict` nel prompt LLM
3. Controlla logs per errori JSON parsing

### Categorie < 20
**Sintomi:** Tassonomia con solo 10-15 categorie

**Cause:**
- LLM ignora istruzione (modello piccolo)
- Risposte troppo simili (pochi temi)

**Soluzioni:**
1. Usa modello migliore: `qwen2.5:7b`, `mistral:7b`, `llama3.1:8b`
2. Aumenta pool risposte analizzate
3. Prova prompt più esplicito

---

## 💡 Tips & Best Practices

### Quando Generare Report
✅ **Genera report se:**
- Presentazione risultati a stakeholder
- Inserimento in paper accademico
- Condivisione esterna analisi
- Sintesi narrativa necessaria

❌ **Evita report se:**
- Solo esplorazione preliminare dati
- Analisi statistica numerica sufficiente
- Budget computazionale limitato

### Ottimizzare Qualità Report
1. **Usa modelli grandi:** `mistral:7b` o `llama3.1:8b` per report migliori
2. **Risposte abbondanti:** Minimo 50 risposte per report significativo
3. **Categorie chiare:** Tassonomia ben definita → report più coerente
4. **Cache intelligente:** Rigenera solo se necessario (modifica tassonomia)

### Formato Report per Export
```jsx
// Copia report per Word/Google Docs
const plainText = report
  .replace(/\*\*(.+?)\*\*/g, '$1')  // Rimuovi grassetto
  .replace(/\*"(.+?)"\*/g, '"$1"')   // Rimuovi corsivo markdown
  .replace(/## /g, '')                // Rimuovi header markdown

// Oppure mantieni formattazione e usa Markdown editor
```

---

## 📚 Risorse

### File Documentazione Completa
- `ANALISI_QUALITATIVA_AVANZATA_20_CATEGORIE_REPORT.md` - Doc dettagliata (5000+ parole)
- Questo file - Quick reference

### Codice Sorgente Rilevante
- `backend/app/qualitative_service.py:620-750` - Logica generazione report
- `backend/app/main.py:3780-3860` - Endpoint API
- `frontend/src/components/QualitativeAnalysis.jsx:838-910` - UI

### Comandi Docker Utili
```bash
# Logs in tempo reale durante generazione
docker logs -f questionnaire_backend | grep -i "report\|narrative"

# Riavvio veloce solo backend
docker-compose restart backend

# Check database
docker exec questionnaire_db psql -U user -d questionnaire_db
```

---

**Ultimo aggiornamento:** 8 Ottobre 2025  
**Versione:** 3.2 (Advanced Qualitative Analysis)  
**Status:** ✅ Operativo e Testato
