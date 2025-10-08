# 📂 Feature: Archivio Analisi con Confronto

**Data Implementazione:** 8 Ottobre 2025  
**Componente:** `QualitativeAnalysis.jsx`  
**Status:** ✅ Completato e Deployato

---

## 🎯 Obiettivo

Implementare un sistema completo di gestione dell'archivio delle analisi qualitative che permette di:
- Visualizzare tutte le analisi salvate in una lista organizzata
- Cercare e filtrare le analisi per domanda e gruppo
- Visualizzare singole analisi direttamente nell'archivio
- Confrontare due analisi affiancate (side-by-side)
- Eliminare analisi obsolete

**IMPORTANTE:** Tutte le operazioni rimangono nel tab "Archivio Analisi" senza cambiare tab.

---

## 📋 Funzionalità Implementate

### 1️⃣ **Modalità Lista** (`archiveViewMode = 'list'`)

#### 🔍 Sistema di Ricerca e Filtri
```javascript
// Stati
const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
const [archiveFilterQuestion, setArchiveFilterQuestion] = useState('all')
const [archiveFilterGroup, setArchiveFilterGroup] = useState('all')
```

**Funzionalità:**
- **Box di ricerca** con icona Search e pulsante X per cancellare
- Ricerca nel testo completo delle domande
- **Filtro per tipo domanda:**
  - Tutte le domande
  - PRO e CONTRO
  - Suggerimenti
  - Pratiche e strumenti
  - Preoccupazioni
  - Benefici
  - Sfide
- **Filtro per gruppo:**
  - Tutti i gruppi
  - Studenti
  - Insegnanti in Servizio
  - Insegnanti Non in Servizio

#### 📊 Lista Analisi

Ogni card visualizza:
- ✅ **Checkbox** per selezione confronto (max 2)
- 📝 **Etichetta domanda** abbreviata
- 📅 **Data creazione** formattata in italiano
- 💬 **Testo completo** della domanda in corsivo
- 📊 **Statistiche:**
  - N° categorie identificate (con icona Tag)
  - N° risposte analizzate (con icona MessageSquare)

**Azioni disponibili:**
- 👁️ **Visualizza** - Carica analisi in modalità single view
- 🗑️ **Elimina** - Richiede password admin e conferma
- ☑️ **Seleziona** - Per confronto (max 2 contemporanee)

#### 🔵 Banner Confronto

Appare quando almeno 1 analisi è selezionata:
- Icona CheckCircle blu
- Conteggio "X analisi selezionate per il confronto"
- Pulsante **"Confronta"** (abilitato solo con 2 selezioni)
- Icona ArrowLeftRight

---

### 2️⃣ **Modalità Single** (`archiveViewMode = 'single'`)

Visualizzazione completa di una singola analisi:

#### 📌 Header Informativo Sticky
```javascript
// Stato
const [archiveSelectedAnalysis, setArchiveSelectedAnalysis] = useState(null)
```

**Contenuto header:**
- 🎨 **Stile:** Background azzurro (`#f0f9ff`), bordo blu (`#3b82f6`)
- 📄 **Icona FileText** + Titolo "Analisi Qualitativa"
- 📝 **Domanda completa** tra virgolette (font-weight: 600)
- **Metadati con icone:**
  - 👥 **Users:** Gruppo respondenti
  - 📅 **Calendar:** Data formattata (es: "08 ottobre 2025")
  - 🏷️ **Tag:** N° categorie
  - 💬 **MessageSquare:** N° risposte totali
- ⬅️ **Pulsante "Torna all'Archivio"** (ArrowLeft icon)

#### 📊 Sezione Risultati

Per ogni categoria:
```javascript
archiveSelectedAnalysis.summary?.category_counts?.map((cat, idx) => {
  return (
    <div>
      <h4>{cat.category}</h4>
      <div>
        <span>{cat.n_questions} risposte</span>
        <span>{cat.percentage}%</span>
      </div>
      // Barra percentuale blu
      // Lista esempi (max 3)
    </div>
  )
})
```

**Visualizzazione categoria:**
- **Nome categoria** (font-size: 1.1rem, font-weight: 700)
- **Statistiche:** N° risposte + percentuale
- **Barra progressiva** blu (#3b82f6) con larghezza = percentage%
- **Esempi di risposte** (max 3):
  - Background bianco
  - Bordo grigio chiaro
  - Testo in corsivo tra virgolette

---

### 3️⃣ **Modalità Comparison** (`archiveViewMode = 'comparison'`)

Vista affiancata di 2 analisi per confronto diretto:

#### 🔄 Header Confronto
- **Titolo:** "Confronto Analisi" con icona ArrowLeftRight
- **Pulsante "Chiudi Confronto":**
  - Reset `comparisonView = null`
  - Reset `selectedForComparison = []`
  - Ritorno a `archiveViewMode = 'list'`

#### 🔀 Layout Split-Screen

**Griglia 2 colonne** (`display: grid, gridTemplateColumns: '1fr 1fr'`)

**Colonna Sinistra (Analisi 1):**
- 🔵 Header blu (`#f0f9ff`, border: `#3b82f6`)
- Label "ANALISI 1" uppercase
- Nome domanda + gruppo + statistiche
- Lista categorie con barre blu

**Colonna Destra (Analisi 2):**
- 🟢 Header verde (`#f0fdf4`, border: `#10b981`)
- Label "ANALISI 2" uppercase
- Nome domanda + gruppo + statistiche
- Lista categorie con barre verdi

**Ogni categoria mostra:**
- Nome categoria (font-weight: 600)
- N° risposte + percentuale
- Barra colorata (blu per analisi 1, verde per analisi 2)

---

## 🔧 Funzioni Chiave

### `loadComparisonView()`
```javascript
const loadComparisonView = async () => {
  if (selectedForComparison.length !== 2) return
  
  // Fetch entrambe le analisi
  const [response1, response2] = await Promise.all([
    fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${id1}`),
    fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${id2}`)
  ])
  
  // Salva dati e cambia view
  setComparisonView({ analysis1: data1, analysis2: data2 })
  setArchiveViewMode('comparison')
}
```

### `toggleComparisonSelection()`
```javascript
const toggleComparisonSelection = (taxonomyId) => {
  if (selectedForComparison.includes(taxonomyId)) {
    // Deseleziona
    setSelectedForComparison(
      selectedForComparison.filter(id => id !== taxonomyId)
    )
  } else {
    // Seleziona (max 2)
    if (selectedForComparison.length < 2) {
      setSelectedForComparison([...selectedForComparison, taxonomyId])
    }
  }
}
```

### `getFilteredArchive()`
```javascript
const getFilteredArchive = () => {
  return savedTaxonomies.filter(tax => {
    // Filtro ricerca
    if (archiveSearchQuery) {
      const searchLower = archiveSearchQuery.toLowerCase()
      const questionText = getQuestionFullText(tax.field_key).toLowerCase()
      if (!questionText.includes(searchLower)) return false
    }
    
    // Filtro tipo domanda
    if (archiveFilterQuestion !== 'all') {
      if (!tax.field_key.includes(archiveFilterQuestion)) return false
    }
    
    // Filtro gruppo
    if (archiveFilterGroup !== 'all') {
      if (tax.respondent_type !== archiveFilterGroup) return false
    }
    
    return true
  })
}
```

---

## 🎨 Design System

### Colori
```css
/* Primary Blue */
--primary: #3b82f6
--primary-light: #dbeafe
--primary-bg: #f0f9ff

/* Success Green */
--success: #10b981
--success-light: #d1fae5
--success-bg: #f0fdf4

/* Neutral Gray */
--gray-50: #f8fafc
--gray-100: #f1f5f9
--gray-200: #e2e8f0
--gray-400: #94a3b8
--gray-500: #64748b
--gray-600: #475569
--gray-900: #1e293b

/* Danger Red */
--danger: #dc2626
--danger-light: #fee2e2
--danger-border: #fecaca
```

### Icone SVG Utilizzate
- 📂 **Archive** - Tab archivio, stato vuoto
- 🔍 **Search** - Box di ricerca
- ❌ **X** - Cancella ricerca, chiudi confronto
- ✅ **CheckCircle** - Banner selezione
- 🔄 **ArrowLeftRight** - Confronto
- ⬅️ **ArrowLeft** - Torna indietro
- 👁️ **Eye** - Visualizza analisi
- 🗑️ **Trash2** - Elimina analisi
- 🏷️ **Tag** - Numero categorie
- 💬 **MessageSquare** - Numero risposte
- 📄 **FileText** - Header singola analisi
- 👥 **Users** - Gruppo respondenti
- 📅 **Calendar** - Data creazione

---

## 🚀 Flusso Utente

### Scenario 1: Visualizzare una singola analisi
```
1. Utente clicca tab "Archivio Analisi"
2. Vede lista completa analisi salvate
3. Clicca pulsante "Visualizza" su un'analisi
4. → archiveViewMode = 'single'
5. → Carica dati analisi via API
6. → Visualizza header sticky + categorie complete
7. Clicca "Torna all'Archivio"
8. → archiveViewMode = 'list'
```

### Scenario 2: Confrontare due analisi
```
1. Utente clicca tab "Archivio Analisi"
2. Seleziona checkbox prima analisi
3. → Banner blu appare "1 analisi selezionata"
4. Seleziona checkbox seconda analisi
5. → Banner aggiorna "2 analisi selezionate"
6. → Pulsante "Confronta" si abilita
7. Clicca "Confronta"
8. → loadComparisonView() viene chiamata
9. → archiveViewMode = 'comparison'
10. → Vista split-screen con colori differenziati
11. Clicca "Chiudi Confronto"
12. → archiveViewMode = 'list'
13. → Checkbox deselezionate
```

### Scenario 3: Cercare e filtrare
```
1. Utente clicca tab "Archivio Analisi"
2. Digita "PRO" nel box ricerca
3. → getFilteredArchive() filtra in real-time
4. → Mostra solo analisi con "PRO" nel testo
5. Seleziona "Studenti" nel filtro gruppo
6. → Ulteriore filtraggio per respondent_type
7. Clicca X nel box ricerca
8. → archiveSearchQuery = ''
9. → Lista si aggiorna automaticamente
```

---

## 🔗 Integrazione Backend

### Endpoint Utilizzati

#### GET `/api/qualitative-analysis/taxonomies`
```javascript
// Carica lista tutte le analisi salvate
loadSavedTaxonomies()
setSavedTaxonomies(data.taxonomies || [])
```

**Response:**
```json
{
  "taxonomies": [
    {
      "id": 123,
      "field_key": "pros_cons",
      "respondent_type": "students",
      "created_at": "2025-10-08T10:30:00Z",
      "n_clusters": 8,
      "n_responses": 156
    }
  ]
}
```

#### GET `/api/qualitative-analysis/taxonomy/{id}`
```javascript
// Carica analisi singola con tutti i dettagli
const response = await fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${tax.id}`)
const data = await response.json()
setArchiveSelectedAnalysis(data)
```

**Response:**
```json
{
  "id": 123,
  "field_key": "pros_cons",
  "respondent_type": "students",
  "created_at": "2025-10-08T10:30:00Z",
  "taxonomy": [...],
  "summary": {
    "total_responses": 156,
    "category_counts": [
      {
        "category": "Efficienza e produttività",
        "n_questions": 45,
        "percentage": 28.8,
        "examples": ["risposta 1", "risposta 2", "risposta 3"]
      }
    ]
  }
}
```

#### DELETE `/api/qualitative-analysis/taxonomy/{id}?password={pwd}`
```javascript
// Elimina analisi (richiede password admin)
fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${tax.id}?password=${pwd}`, {
  method: 'DELETE'
})
```

---

## 📱 Responsive Design

### Desktop (> 768px)
- **Confronto:** Griglia 2 colonne fluide
- **Lista:** Card a larghezza piena
- **Filtri:** Griglia 2 colonne (50% - 50%)

### Mobile (< 768px) - DA IMPLEMENTARE
```css
/* Suggerimenti per futuro miglioramento */
@media (max-width: 768px) {
  /* Confronto diventa verticale */
  gridTemplateColumns: '1fr';
  
  /* Filtri diventano verticali */
  gridTemplateColumns: '1fr';
  
  /* Header sticky ridotto */
  fontSize: 0.9rem;
}
```

---

## ✅ Checklist Funzionalità

- [x] Tab "Archivio Analisi" nel switcher
- [x] Badge conteggio analisi sul tab
- [x] Box ricerca con icone Search e X
- [x] Filtro tipo domanda (dropdown)
- [x] Filtro gruppo respondenti (dropdown)
- [x] Funzione `getFilteredArchive()` real-time
- [x] Lista analisi con card informative
- [x] Checkbox selezione per confronto (max 2)
- [x] Banner blu selezione con conteggio
- [x] Pulsante "Confronta" (enabled con 2 selezioni)
- [x] Pulsante "Visualizza" carica in single view
- [x] Pulsante "Elimina" con conferma e password
- [x] Modalità single con header sticky
- [x] Header mostra: domanda, gruppo, data, stats
- [x] Pulsante "Torna all'Archivio"
- [x] Visualizzazione categorie complete
- [x] Barre percentuali colorate
- [x] Esempi risposte (max 3 per categoria)
- [x] Modalità comparison split-screen
- [x] Colori differenziati (blu vs verde)
- [x] Pulsante "Chiudi Confronto"
- [x] Nessun cambio di tab automatico
- [x] Tutte le icone SVG (no emoji)
- [x] Stati gestiti correttamente
- [x] Loading e error handling
- [x] Build e deploy completato

---

## 🐛 Bug Fix Applicati

### 1. Cambio Tab Indesiderato
**Problema:** Cliccando "Visualizza" l'analisi veniva caricata nel tab "Analisi Singola"

**Soluzione:**
```javascript
// PRIMA (sbagliato)
onClick={() => {
  loadTaxonomy(tax.id)
  setActiveTab('single') // ❌ Cambia tab
}}

// DOPO (corretto)
onClick={async () => {
  const response = await fetch(`${API_URL}/.../taxonomy/${tax.id}`)
  const data = await response.json()
  setArchiveSelectedAnalysis(data) // ✅ Carica nell'archivio
  setArchiveViewMode('single')     // ✅ Cambia solo view mode
}}
```

### 2. Ternary Operator Incompleto
**Problema:** Sintassi ternaria con 3 condizioni ma solo 2 rami

**Soluzione:**
```javascript
// Aggiunto ramo else finale
{archiveViewMode === 'list' ? (
  // Lista
) : archiveViewMode === 'single' && archiveSelectedAnalysis ? (
  // Singola
) : archiveViewMode === 'comparison' && comparisonView ? (
  // Confronto
) : null} // ✅ Aggiunto else null
```

---

## 📊 Metriche Performance

**Build Time:** ~7.7s  
**Chunk Size:** ~890 KB  
**HMR Update Time:** < 1s  
**API Response Time:** < 200ms (locale)

---

## 🔮 Possibili Miglioramenti Futuri

1. **Export Confronto**
   - Pulsante per esportare confronto in PDF/CSV
   - Include grafici comparativi

2. **Ordinamento Avanzato**
   - Per data (più recenti/vecchi)
   - Per numero categorie
   - Per numero risposte

3. **Tag/Etichette Personalizzate**
   - Utente può etichettare analisi
   - Filtro per tag custom

4. **Confronto Multi-Analisi**
   - Estendere da 2 a N analisi
   - Vista tabellare comparativa

5. **Grafici Visuali**
   - Chart.js per barre e torte
   - Comparazione visiva percentuali

6. **Mobile Responsive**
   - Layout verticale per schermi piccoli
   - Touch gestures per confronto

7. **Annotazioni e Note**
   - Commenti su categorie specifiche
   - Note personali sull'analisi

8. **Cronologia Modifiche**
   - Log delle modifiche alla tassonomia
   - Versioning delle analisi

---

## 📝 Note Tecniche

### Stati React Utilizzati
```javascript
const [activeTab, setActiveTab] = useState('single')
const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
const [archiveFilterQuestion, setArchiveFilterQuestion] = useState('all')
const [archiveFilterGroup, setArchiveFilterGroup] = useState('all')
const [selectedForComparison, setSelectedForComparison] = useState([])
const [comparisonView, setComparisonView] = useState(null)
const [archiveViewMode, setArchiveViewMode] = useState('list')
const [archiveSelectedAnalysis, setArchiveSelectedAnalysis] = useState(null)
const [savedTaxonomies, setSavedTaxonomies] = useState([])
```

### Helper Functions
```javascript
getQuestionLabel(fieldKey)      // Etichetta abbreviata
getQuestionFullText(fieldKey)   // Testo completo domanda
getRespondentLabel(type)        // Label gruppo (IT/EN)
getFilteredArchive()            // Filtraggio real-time
toggleComparisonSelection(id)   // Toggle checkbox
loadComparisonView()            // Carica confronto
```

---

## ✅ Conclusione

La feature **Archivio Analisi con Confronto** è stata implementata con successo e deployata. L'interfaccia permette una gestione completa delle analisi qualitative con:
- 🔍 Ricerca e filtri avanzati
- 👁️ Visualizzazione dettagliata single-view
- ⚖️ Confronto affiancato di 2 analisi
- 🗑️ Eliminazione sicura con autenticazione
- 🎨 Design pulito con icone SVG professionali
- 🚀 Nessun cambio di tab indesiderato

**Tutto funziona correttamente e resta nel tab "Archivio Analisi"! ✨**
