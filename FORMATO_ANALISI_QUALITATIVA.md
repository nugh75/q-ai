# Formato Risposta Analisi Qualitativa

## Panoramica
Questo documento descrive il formato completo della risposta dell'endpoint `/api/qualitative-analysis/taxonomy/{id}` dopo i miglioramenti del 8 ottobre 2025.

---

## Struttura Risposta

### 1. Metadati Tassonomia
```json
{
  "id": 25,
  "field_key": "pros_cons",
  "respondent_type": "teachers_active",
  "n_responses": 355,
  "created_at": "2025-10-08 13:34:37.938097+00:00"
}
```

### 2. Tassonomia Completa
Array di categorie con tutte le informazioni semantiche:

```json
"taxonomy": [
  {
    "name": "PRO: Efficienza",
    "definition": "L'IA accelera compiti e ricerche, riducendo tempi.",
    "keywords": ["veloce", "risparmio tempo", "automatizzazione"],
    "examples": ["snellisce la burocrazia", "velocizza la ricerca"]
  },
  {
    "name": "CONTRO: Superficialità",
    "definition": "Promuove apprendimento superficiale, limitando la profondità.",
    "keywords": ["superficiale", "memoria", "creatività"],
    "examples": ["facilita ma non aiuta la memoria", "facilita ma non stimola"]
  }
  // ... altre categorie
]
```

**Campi:**
- `name`: Nome semanticamente rilevante (NON "Categoria 1")
- `definition`: Descrizione completa della categoria
- `keywords`: Parole chiave associate
- `examples`: Esempi tipici di questa categoria

---

## 3. Summary - Statistiche Complete

### 3.1 Category Counts (Conteggi per Categoria)
Statistiche dettagliate per ogni categoria con **esempi di testo reali**:

```json
"category_counts": [
  {
    "category": "PRO: Efficienza",
    "description": "L'IA accelera compiti e ricerche, riducendo tempi.",
    "keywords": ["veloce", "risparmio tempo", "automatizzazione"],
    "n_questions": 191,
    "percentage": 53.8,
    "examples": [
      {
        "code": "anco27",
        "text": "PRO: Un enorme risparmio di tempo ed energie, spendibili per altri strumenti didattici. Creazione di schemi e lavori di supporto per ogni aspetto della vita scolastica...",
        "confidence": 0.95
      },
      {
        "code": "chio08",
        "text": "Credo sia un ottimo strumento soprattutto dal punto di vista burocratico...",
        "confidence": 0.95
      },
      {
        "code": "eggi21",
        "text": "Pro: ottimizzazione dei tempi e velocità di esecuzione di procedure standard...",
        "confidence": 0.95
      }
    ]
  }
]
```

**Campi:**
- `category`: Nome categoria
- `description`: Descrizione semantica (NUOVA - prima era vuota)
- `keywords`: Parole chiave (NUOVA - prima era vuota)
- `n_questions`: Numero risposte classificate in questa categoria
- `percentage`: Percentuale sul totale
- `examples`: **Top 3 esempi** di risposte reali con:
  - `code`: Codice rispondente
  - `text`: Testo risposta (prime 200 caratteri)
  - `confidence`: Livello di confidenza classificazione (0-1)

### 3.2 Cooccurrence (Co-occorrenze Categorie)
Coppie di categorie che compaiono insieme nelle stesse risposte, con **descrizione testuale**:

```json
"cooccurrence": [
  {
    "categories": "CONTRO: Superficialità + PRO: Efficienza",
    "cat_i": "CONTRO: Superficialità",
    "cat_j": "PRO: Efficienza",
    "count": 78,
    "description": "Le categorie 'CONTRO: Superficialità' e 'PRO: Efficienza' compaiono insieme 78 volte (22.0%)"
  },
  {
    "categories": "CONTRO: Dipendenza + PRO: Efficienza",
    "cat_i": "CONTRO: Dipendenza",
    "cat_j": "PRO: Efficienza",
    "count": 49,
    "description": "Le categorie 'CONTRO: Dipendenza' e 'PRO: Efficienza' compaiono insieme 49 volte (13.8%)"
  }
  // ... top 15 co-occorrenze
]
```

**Prima (ERRATO):**
```
+ : volte
+ : volte
```

**Ora (CORRETTO):**
- `categories`: Stringa leggibile "Cat1 + Cat2"
- `cat_i`, `cat_j`: Nomi categorie individuali
- `count`: Numero volte compaiono insieme
- `description`: Frase completa in italiano

### 3.3 Total Annotations
```json
"total_annotations": 355
```

Numero totale di risposte analizzate.

---

## Interpretazione Risultati

### Co-occorrenze
Le co-occorrenze più frequenti indicano pattern di pensiero:

**Esempio analisi PRO/CONTRO IA:**
- **78 risposte (22%)** citano sia l'efficienza dell'IA (PRO) che i rischi di superficialità (CONTRO)
- Interpretazione: Gli insegnanti riconoscono che l'IA velocizza il lavoro ma temono apprendimento superficiale

### Esempi di Testo
Per ogni categoria, i 3 esempi mostrano:
- **Risposte autentiche** dei rispondenti
- **Contesto reale** della categoria
- **Livello di certezza** della classificazione (confidence)

---

## Come Usare i Dati

### 1. Visualizzazione Co-occorrenze
```javascript
// Frontend
cooccurrence.forEach(co => {
  console.log(co.description);
  // Output: "Le categorie 'X' e 'Y' compaiono insieme 78 volte (22.0%)"
});
```

### 2. Mostrare Esempi per Categoria
```javascript
category_counts.forEach(cat => {
  console.log(`\n## ${cat.category}`);
  console.log(`Descrizione: ${cat.description}`);
  console.log(`Parole chiave: ${cat.keywords.join(', ')}`);
  console.log(`\nEsempi (${cat.n_questions} risposte, ${cat.percentage}%):`);
  
  cat.examples.forEach(ex => {
    console.log(`- [${ex.code}] ${ex.text} (confidence: ${ex.confidence})`);
  });
});
```

### 3. Esportare Report
Le descrizioni e gli esempi possono essere usati per:
- Report PDF automatici
- Presentazioni per stakeholder
- Analisi qualitativa approfondita

---

## Test

### Endpoint
```bash
# Lista tassonomie (solo quelle con risultati)
curl http://localhost:8118/api/qualitative-analysis/taxonomies

# Dettagli tassonomia completa
curl http://localhost:8118/api/qualitative-analysis/taxonomy/25 | python3 -m json.tool
```

### Verifica Qualità
✅ **Categorie con nomi semantici** (non "Categoria 1")
✅ **Descrizioni in italiano** (non in inglese)
✅ **Esempi di testo reali** per ogni categoria
✅ **Co-occorrenze con descrizione testuale** (non "+ : volte")
✅ **Keywords** per contestualizzare le categorie

---

## Fix Applicati (8 ottobre 2025)

### Problema Originale
1. ❌ Co-occorrenze mostravano "+ : volte" senza nomi categorie
2. ❌ Descrizioni categorie perse dopo analisi
3. ❌ Nessun esempio di testo collegato alle categorie

### Soluzione
1. ✅ Formattazione esplicita co-occorrenze con `description` testuale
2. ✅ `category_counts` include `description` e `keywords` dalla tassonomia
3. ✅ `examples` array con top 3 risposte per categoria (codice + testo + confidence)

### File Modificati
- `backend/app/main.py` (linee 3723-3769)
  - Arricchimento `category_stats` con descrizioni e keywords
  - Aggiunta `examples` per ogni categoria
  - Formattazione `cooccurrence` con descrizione testuale

---

## Prossimi Passi

### Frontend
1. Visualizzare tabella co-occorrenze con descrizioni
2. Mostrare esempi di testo cliccabili per ogni categoria
3. Export PDF con tutte le informazioni

### Backend (opzionale)
- Aggiungere filtro per confidence minima negli esempi
- Paginazione esempi (attualmente top 3)
- Statistiche temporali (evolution over time)

---

## Contatti
Per domande o modifiche: vedere `FIX_QUALITATIVE_ANALYSIS.md` e `SISTEMA_COMPLETO.md`
