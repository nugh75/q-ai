# Sistema Analisi Qualitativa Avanzato - 20+ Categorie + Report Narrativo

## 🎯 Richiesta Utente

**"fai in modo che l'ai generi almeno 20 categorie. Inoltre, sempre con l'ai crea un report discorsivo che con usando citazioni delle risposte spieghi le risposte dei rispondenti"**

---

## ✨ Implementazione Completa

### 1. Generazione Minimo 20 Categorie ✅

**Obiettivo:** L'AI deve creare tassonomie più dettagliate con almeno 20 categorie invece di ~8

#### Modifiche: `backend/app/qualitative_service.py`

```python
# PRIMA (linea ~300)
max_categories=min(max_categories, 8)  # Max 8 categorie

# DOPO
adjusted_max_categories = max(max_categories, 20)
logger.info(f"Richiedendo almeno {adjusted_max_categories} categorie")
# Usa adjusted_max_categories nel prompt
```

**Effetto:**
- Prima: 6-8 categorie per analisi
- Dopo: **Minimo 20 categorie** per analisi più granulare
- Esempio: PRO/CONTRO passa da 8 a 20+ categorie

---

### 2. Report Narrativo Discorsivo con Citazioni ✅

**Obiettivo:** Generare analisi testuale in stile accademico con citazioni dirette

#### A. Nuovo Metodo: `generate_narrative_report()`

**File:** `backend/app/qualitative_service.py` (linee ~620-750)

```python
def generate_narrative_report(
    self,
    taxonomy: List[Dict[str, Any]],
    annotations: List[QualitativeAnnotation],
    question_text: str = "la domanda analizzata"
) -> str:
    """
    Genera un report narrativo discorsivo con citazioni dalle risposte
    
    Returns:
        Report in formato Markdown con analisi discorsiva e citazioni
    """
```

**Funzionalità:**
1. **Raggruppa risposte per categoria** con confidence > 0.6
2. **Seleziona top 5 citazioni** per categoria (migliori per confidence)
3. **Calcola statistiche** (count, percentuale)
4. **Genera prompt per LLM** con istruzioni per stile narrativo
5. **Chiama LLM** per creare report discorsivo
6. **Fallback automatico** se LLM fallisce

**Prompt LLM per Report:**

```
STILE RICHIESTO:
- Narrativo e discorsivo (NON elenchi puntati)
- Citazioni integrate nel testo: *"citazione testuale"* (Codice XXX)
- Paragrafi ben strutturati con transizioni fluide
- Linguaggio accademico ma accessibile
- TUTTO IN ITALIANO

FORMATO OUTPUT:
Markdown con intestazioni (##) per le sezioni principali
```

**Esempio Output Report:**

```markdown
## Panoramica Generale

L'analisi qualitativa delle 268 risposte ha rivelato 22 categorie 
tematiche principali che emergono dalle narrazioni degli studenti.

## PRO: Efficienza e Velocità

Un tema significativo emerso riguarda l'efficienza, presente in 183 
risposte (68% del campione). Come evidenziato da uno studente: 
*"L'AI mi aiuta a risolvere problemi in pochi secondi invece di 
ore"* (Codice STU_042), sottolineando il valore del risparmio 
temporale nelle attività di apprendimento.

Un altro rispondente osserva: *"Posso concentrarmi sulla 
comprensione invece di perdere tempo nella ricerca"* (Codice 
STU_089), evidenziando come l'intelligenza artificiale permetta 
di ottimizzare il processo di studio...

## Considerazioni Conclusive

Le categorie emerse rivelano la complessità e la varietà delle 
prospettive, evidenziando sia convergenze che divergenze...
```

#### B. Metodo Fallback: `_generate_fallback_report()`

Se l'LLM fallisce, genera automaticamente un report semplice ma strutturato:

```python
def _generate_fallback_report(
    self,
    question_text: str,
    total_responses: int,
    top_categories: List[Dict[str, Any]]
) -> str:
    """Genera report semplice in caso di errore LLM"""
```

---

### 3. Persistenza nel Database

#### Migrazione SQL

**File:** `backend/migrations/add_narrative_report.sql`

```sql
ALTER TABLE qualitative_taxonomies 
ADD COLUMN IF NOT EXISTS narrative_report TEXT;
```

**Applicata:**
```bash
✅ Campo narrative_report aggiunto alla tabella qualitative_taxonomies
```

#### Modello Database Aggiornato

**File:** `backend/app/models.py`

```python
class QualitativeTaxonomy(Base):
    # ... campi esistenti ...
    narrative_report = Column(Text, nullable=True)  # NUOVO
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

### 4. Endpoint API per Generazione Report

#### Nuovo Endpoint: `POST /api/qualitative-analysis/taxonomy/{taxonomy_id}/generate-report`

**File:** `backend/app/main.py` (linee ~3780-3860)

```python
@app.post("/api/qualitative-analysis/taxonomy/{taxonomy_id}/generate-report")
def generate_narrative_report(taxonomy_id: int, db: Session = Depends(get_db)):
    """Genera report narrativo discorsivo con citazioni per una tassonomia"""
```

**Funzionalità:**

1. **Verifica esistenza tassonomia**
2. **Check cache:** Se report già esiste → ritorna cached
3. **Ottieni annotazioni** associate
4. **Genera report** con LLM
5. **Salva nel database** (cache per future richieste)
6. **Ritorna JSON:**

```json
{
  "taxonomy_id": 42,
  "report": "## Panoramica Generale\n\n...",
  "cached": false
}
```

**Cache intelligente:**
- Primo accesso: genera report (30-60 secondi)
- Accessi successivi: ritorna report salvato (istantaneo)

#### Endpoint Modificato: `GET /api/qualitative-analysis/taxonomy/{taxonomy_id}`

```python
return {
    # ... campi esistenti ...
    'narrative_report': taxonomy.narrative_report,  # NUOVO
    # ...
}
```

---

### 5. Interfaccia Utente Frontend

#### Sezione Report Narrativo

**File:** `frontend/src/components/QualitativeAnalysis.jsx` (linee ~838-910)

**UI Component 1: Report Visualizzato**

```jsx
{results.narrative_report && (
  <div style={{
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '12px',
    border: '2px solid #3b82f6'
  }}>
    <h4>📝 Report Analitico Narrativo</h4>
    <div dangerouslySetInnerHTML={{
      __html: results.narrative_report
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*"(.+?)"\*/g, '<em>"$1"</em>')
        .replace(/## (.+)/g, '<h3>$1</h3>')
    }} />
  </div>
)}
```

**Rendering Markdown:**
- `**testo**` → **grassetto**
- `*"citazione"*` → *"citazione in corsivo"*
- `## Titolo` → `<h3>Titolo</h3>`
- `\n\n` → paragrafi separati

**UI Component 2: Pulsante Genera Report**

```jsx
{!results.narrative_report && (
  <div style={{ textAlign: 'center', border: '1px dashed #3b82f6' }}>
    <p>📝 Vuoi un report discorsivo con citazioni delle risposte?</p>
    <button onClick={generateReport}>
      {loading ? 'Generazione in corso...' : 'Genera Report Narrativo'}
    </button>
  </div>
)}
```

**Funzionalità:**
- Mostra se report non esiste ancora
- Click → chiama API POST
- Loading state durante generazione
- Aggiorna UI automaticamente quando completo

---

## 📊 Confronto Prima/Dopo

### Numero Categorie

| Aspetto | Prima | Dopo |
|---------|-------|------|
| **Categorie min** | 6-8 | **20+** |
| **Granularità** | Bassa | **Alta** |
| **Esempio PRO/CONTRO** | 8 categorie | **22 categorie** |
| **Dettaglio** | Generico | **Specifico** |

**Esempio Concreto:**

**Prima (8 categorie):**
```
1. PRO: Efficienza
2. PRO: Accessibilità
3. CONTRO: Dipendenza
4. CONTRO: Qualità
...
```

**Dopo (22 categorie):**
```
1. PRO: Efficienza e Velocità
2. PRO: Efficienza nella Ricerca
3. PRO: Risparmio Tempo
4. PRO: Accessibilità 24/7
5. PRO: Accessibilità Geografica
6. PRO: Personalizzazione Contenuti
7. PRO: Personalizzazione Ritmo
8. CONTRO: Dipendenza Tecnologica
9. CONTRO: Dipendenza Cognitiva
10. CONTRO: Qualità Informazioni
11. CONTRO: Superficialità
12. CONTRO: Bias Algoritmici
...
```

### Report Narrativo

| Aspetto | Prima | Dopo |
|---------|-------|------|
| **Formato** | ❌ Non esisteva | ✅ **Report discorsivo** |
| **Citazioni** | ❌ No | ✅ **Dirette dalle risposte** |
| **Stile** | - | ✅ **Accademico-narrativo** |
| **Integrazione** | - | ✅ **Citazioni nel testo** |
| **Lunghezza** | - | **1500-3000 parole** |

---

## 🎨 Design Patterns Implementati

### 1. Cache Pattern
- Report salvato in DB dopo prima generazione
- Richieste successive istantanee
- Flag `cached: true/false` nella response

### 2. Fallback Pattern
- Se LLM fallisce → report semplice automatico
- Garantisce sempre un risultato
- Log dettagliati per debugging

### 3. Lazy Loading
- Report generato solo on-demand
- Pulsante "Genera Report" visibile se non esiste
- Risparmio risorse computazionali

### 4. Progressive Rendering
- Markdown → HTML in tempo reale
- Citazioni formattate automaticamente
- Responsive e accessibile

---

## 🔧 Struttura Tecnica

### Flusso Completo

```
┌─────────────────────────────────────────────────────┐
│ 1. UTENTE RICHIEDE ANALISI                         │
│    - Seleziona domanda + gruppo                    │
│    - Click "Avvia Analisi"                         │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 2. GENERAZIONE TASSONOMIA                          │
│    - LLM genera minimo 20 categorie                │
│    - Salva in DB (qualitative_taxonomies)          │
│    - narrative_report = NULL                       │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 3. CLASSIFICAZIONE RISPOSTE                        │
│    - Per ogni risposta → categorie + confidence    │
│    - Salva in DB (qualitative_annotations)         │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 4. VISUALIZZAZIONE RISULTATI                       │
│    - Mostra 20+ categorie                          │
│    - Mostra pulsante "Genera Report"               │
└─────────────────────────────────────────────────────┘
                        │
                        ▼ (click pulsante)
┌─────────────────────────────────────────────────────┐
│ 5. GENERAZIONE REPORT NARRATIVO                    │
│    - POST /generate-report                         │
│    - LLM genera report con citazioni               │
│    - Salva in narrative_report                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ 6. VISUALIZZAZIONE REPORT                          │
│    - Rendering Markdown → HTML                     │
│    - Citazioni in corsivo                          │
│    - Paragrafi strutturati                         │
└─────────────────────────────────────────────────────┘
```

### File Modificati

| File | Modifiche | Linee |
|------|-----------|-------|
| `backend/app/qualitative_service.py` | +2 metodi (`generate_narrative_report`, `_generate_fallback_report`) | ~150 |
| `backend/app/models.py` | +1 campo (`narrative_report`) | ~1 |
| `backend/app/main.py` | +1 endpoint POST, modificato GET | ~90 |
| `frontend/src/components/QualitativeAnalysis.jsx` | +2 sezioni UI (report + pulsante) | ~80 |
| `backend/migrations/add_narrative_report.sql` | Migrazione SQL | ~10 |

**Totale:** ~331 linee aggiunte

---

## 🧪 Test e Verifica

### Test 1: Verifica Campo Database

```bash
docker exec -i questionnaire_db psql -U user -d questionnaire_db -c \
  "SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'qualitative_taxonomies';"
```

**Output atteso:**
```
 column_name
-----------------
 id
 question_field
 respondent_type
 taxonomy_data
 n_clusters
 n_responses
 quality_score
 created_at
 narrative_report  ← NUOVO
```

### Test 2: Verifica Endpoint API

```bash
# Ottieni ID tassonomia
curl -s http://localhost:8118/api/qualitative-analysis/taxonomies | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['taxonomies'][0]['id'])"

# Genera report (sostituisci {id})
curl -X POST http://localhost:8118/api/qualitative-analysis/taxonomy/{id}/generate-report
```

**Output atteso:**
```json
{
  "taxonomy_id": 1,
  "report": "## Panoramica Generale\n\nL'analisi...",
  "cached": false
}
```

### Test 3: UI - Generazione Report

1. Vai su `http://localhost:5180`
2. Naviga a "Analisi Qualitativa"
3. Click su un'analisi salvata
4. Verifica pulsante "Genera Report Narrativo"
5. Click → attendi 30-60 secondi
6. Verifica visualizzazione report con citazioni

**Checklist UI:**
- ✅ Pulsante visibile se report non esiste
- ✅ Loading state durante generazione
- ✅ Report appare con bordo blu
- ✅ Citazioni formattate in corsivo
- ✅ Paragrafi ben spaziati
- ✅ Titoli H3 visibili

### Test 4: Cache Report

```bash
# Prima richiesta (genera)
time curl -X POST http://localhost:8118/.../generate-report
# Output: ~30-60 secondi

# Seconda richiesta (cache)
time curl -X POST http://localhost:8118/.../generate-report  
# Output: ~0.1 secondi, "cached": true
```

---

## 💡 Esempi Output

### Esempio Report Completo (Estratto)

```markdown
## Panoramica Generale

L'analisi qualitativa delle 268 risposte degli studenti alla domanda 
"Quali sono i PRO e i CONTRO dell'utilizzo dell'intelligenza artificiale 
nella didattica?" ha rivelato 22 categorie tematiche principali, 
suddivise equamente tra aspetti positivi e criticità emerse.

## PRO: Efficienza e Risparmio Tempo

Un tema dominante emerso dall'analisi riguarda l'efficienza operativa 
dell'intelligenza artificiale, presente in 183 risposte (68% del campione). 
Gli studenti evidenziano come l'AI permetta di ottimizzare le attività 
di studio riducendo significativamente i tempi necessari.

Come sottolineato da un rispondente: *"L'AI mi aiuta a risolvere 
problemi matematici complessi in pochi secondi invece di ore di 
tentativi"* (Codice STU_042). Questa osservazione è emblematica di 
una percezione diffusa dell'intelligenza artificiale come strumento 
di accelerazione dei processi di apprendimento.

Un altro studente osserva: *"Posso concentrarmi sulla comprensione 
dei concetti invece di perdere tempo nella ricerca di informazioni 
di base"* (Codice STU_089), evidenziando come l'AI permetta di 
focalizzare l'attenzione cognitiva su aspetti più complessi e 
significativi del processo di apprendimento.

## PRO: Personalizzazione dell'Apprendimento

La categoria della personalizzazione emerge con 124 risposte (46% 
del campione), rivelando un apprezzamento per la capacità dell'AI 
di adattarsi alle esigenze individuali. Come evidenziato: *"L'AI 
capisce il mio livello e mi propone esercizi adatti, non troppo 
facili né impossibili"* (Codice STU_156).

[... continua per altre 15 categorie ...]

## Considerazioni Conclusive

L'analisi rivela una consapevolezza articolata e sfumata degli studenti 
riguardo l'intelligenza artificiale nell'educazione. Le 22 categorie 
emerse evidenziano sia un apprezzamento per i vantaggi operativi 
(efficienza, personalizzazione, accessibilità) sia preoccupazioni 
significative relative alla dipendenza tecnologica, alla qualità delle 
informazioni e agli aspetti etici.

Le narrazioni degli studenti suggeriscono la necessità di un approccio 
equilibrato che integri le potenzialità dell'AI con il mantenimento 
di competenze critiche e autonome di pensiero.
```

---

## 📈 Vantaggi Sistema Avanzato

### 1. Analisi Più Granulare
- **20+ categorie** vs 8 precedenti
- Maggiore precisione nella classificazione
- Cattura sfumature e sotto-temi

### 2. Insight Qualitativi
- Report narrativo sostituisce tabelle
- Citazioni dirette aumentano credibilità
- Contestualizzazione delle risposte

### 3. Stile Accademico
- Adatto per presentazioni e paper
- Linguaggio professionale
- Struttura rigorosa

### 4. Efficienza Operativa
- Cache riduce tempi successivi (60s → 0.1s)
- Fallback garantisce sempre risultato
- Generazione on-demand risparmia risorse

### 5. User Experience
- Pulsante intuitivo
- Loading state chiaro
- Rendering elegante

---

## 🚀 Workflow Completo

### Per Ricercatori/Docenti

1. **Avvia analisi qualitativa** (domanda + gruppo)
2. **Attendi generazione tassonomia** (~2-3 min per 20+ categorie)
3. **Esplora categorie dettagliate** (distribuzione, keywords, esempi)
4. **Genera report narrativo** (click pulsante, attendi ~1 min)
5. **Leggi analisi discorsiva** con citazioni integrate
6. **Esporta/copia report** per presentazioni o documenti

### Caso d'Uso: Paper Accademico

```
Sezione Metodi:
"Le risposte aperte sono state analizzate utilizzando un approccio 
di analisi tematica assistita da intelligenza artificiale, generando 
una tassonomia di 22 categorie..."

Sezione Risultati:
[Copia-incolla report narrativo generato dall'AI]

Sezione Discussione:
"Come emerge dalle narrazioni degli studenti, l'intelligenza 
artificiale è percepita come..."
```

---

## 🔮 Sviluppi Futuri (Opzionali)

### 1. Export Report
```jsx
<button onClick={() => downloadPDF(report)}>
  📄 Esporta Report PDF
</button>
```

### 2. Report Comparativi
```
Genera report che confronta PRO/CONTRO Studenti vs Insegnanti
```

### 3. Report Personalizzabili
```jsx
<select onChange={setReportStyle}>
  <option>Stile Accademico</option>
  <option>Stile Giornalistico</option>
  <option>Stile Executive Summary</option>
</select>
```

### 4. Citazioni Interattive
```jsx
<span 
  className="citation"
  onClick={() => showFullResponse(code)}
>
  (Codice STU_042)
</span>
```

### 5. Visualizzazioni Report
- Word cloud dalle citazioni
- Timeline delle categorie più citate
- Network graph co-occorrenze

---

## ✅ Checklist Completamento

- [x] Backend: Minimo 20 categorie (`adjusted_max_categories = max(20, ...)`)
- [x] Backend: Metodo `generate_narrative_report()` con prompt discorsivo
- [x] Backend: Metodo `_generate_fallback_report()` per resilienza
- [x] Database: Campo `narrative_report TEXT` aggiunto
- [x] Database: Migrazione SQL applicata con successo
- [x] API: Endpoint POST `/generate-report` creato
- [x] API: Endpoint GET `/taxonomy/{id}` include `narrative_report`
- [x] Frontend: Sezione visualizzazione report con rendering Markdown
- [x] Frontend: Pulsante "Genera Report" con loading state
- [x] Frontend: Formattazione citazioni (`*"..."*` → corsivo)
- [x] Deploy: File copiati nei container
- [x] Deploy: Servizi riavviati correttamente
- [x] Test: Campo database presente
- [x] Test: Endpoint API funzionante
- [x] Documentazione: File completo creato

---

## 📞 Comandi Utili

### Verifica Stato Sistema

```bash
# Check database field
docker exec questionnaire_db psql -U user -d questionnaire_db -c \
  "SELECT COUNT(*), SUM(CASE WHEN narrative_report IS NOT NULL THEN 1 ELSE 0 END) 
   FROM qualitative_taxonomies;"

# Check backend logs
docker logs questionnaire_backend --tail 50

# Check frontend logs
docker logs questionnaire_frontend --tail 20
```

### Debug Report Generation

```bash
# Tail backend logs while generating
docker logs -f questionnaire_backend | grep -i "report\|narrative"
```

---

**Data Implementazione:** 8 Ottobre 2025  
**Funzionalità:** ✅ Almeno 20 categorie + Report discorsivo con citazioni  
**Status:** 🚀 Completato e Operativo  
**Impatto:** 🔥 Alto - Trasforma l'analisi qualitativa in insight narrativi profondi
