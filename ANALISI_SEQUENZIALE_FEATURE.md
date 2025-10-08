# 🚀 Analisi Sequenziale - Nuova Funzionalità

**Data implementazione:** 8 ottobre 2025  
**Componente:** `frontend/src/components/QualitativeAnalysis.jsx`

## 📋 Descrizione

Aggiunta la possibilità di **analizzare automaticamente più domande in sequenza** utilizzando lo stesso template/prompt, risparmiando tempo nell'analisi qualitativa.

## ✨ Funzionalità

### Tab "Analisi Sequenziale"

Nuovo tab accanto a "Analisi Singola" che permette di:

1. **Selezionare 2 o più domande** con checkbox
   - Visualizzazione chiara di tutte le domande disponibili
   - Riepilogo automatico: numero domande e totale risposte

2. **Applicare un template condiviso**
   - Il template scelto viene applicato a TUTTE le domande selezionate
   - Nessuna necessità di ripetere la selezione

3. **Esecuzione automatica sequenziale**
   Per ogni domanda:
   - ✅ Genera tassonomia (automatica, senza revisione manuale)
   - ✅ Classifica tutte le risposte (batch processing)
   - ✅ Salva i risultati
   - ➡️ Passa alla domanda successiva

4. **Monitoraggio progresso in tempo reale**
   - Progresso generale: "Domanda 2 di 5"
   - Progresso domanda corrente: "Classificazione 45%"
   - Stati per ogni domanda:
     - ⏳ In attesa
     - 🔄 In elaborazione
     - ✅ Completata
     - ❌ Errore

5. **Gestione errori robusta**
   - Se una domanda fallisce, continua con le altre
   - Alla fine mostra riepilogo: completate/errori
   - Possibilità di visualizzare i risultati delle domande completate

## 🎯 Caso d'uso

**Scenario tipico:**
Voglio analizzare i PRO e CONTRO dell'IA per:
- Studenti
- Insegnanti in servizio
- Insegnanti non in servizio

**Prima:**
- Seleziona domanda 1 → genera tassonomia → revisiona → classifica → salva
- Seleziona domanda 2 → genera tassonomia → revisiona → classifica → salva
- Seleziona domanda 3 → genera tassonomia → revisiona → classifica → salva
- **Tempo:** ~15-20 minuti di lavoro manuale

**Adesso (Analisi Sequenziale):**
- Seleziona tutte e 3 le domande
- Scegli template "PRO e CONTRO"
- Click "Avvia Analisi Sequenziale"
- ☕ Vai a prendere un caffè
- **Tempo:** ~5 minuti (tutto automatico)

## 🛠️ Implementazione Tecnica

### Nuovo Stato React

```javascript
// Tab management
const [activeTab, setActiveTab] = useState('single')

// Analisi sequenziale
const [selectedQuestions, setSelectedQuestions] = useState([])
const [sequenceTemplate, setSequenceTemplate] = useState('custom')
const [sequenceRunning, setSequenceRunning] = useState(false)
const [sequenceProgress, setSequenceProgress] = useState({
  current: 0,
  total: 0,
  currentQuestion: null,
  phase: 'taxonomy' | 'classification',
  phaseProgress: 0
})
const [sequenceResults, setSequenceResults] = useState([])
```

### Funzioni Principali

1. **`toggleQuestionSelection(fieldKey, respondentType)`**
   - Gestisce selezione/deselezione domande

2. **`runSequentialAnalysis()`**
   - Loop principale che processa ogni domanda
   - Per ogni domanda:
     - Chiama API generazione tassonomia
     - Chiama API classificazione (batch)
     - Salva risultati
     - Aggiorna progresso

### API Utilizzate

- `POST /api/qualitative-analysis/generate-taxonomy`
- `POST /api/qualitative-analysis/classify-responses` (chiamata in batch loop)

**Nota:** Nessuna modifica backend richiesta! Usa le API esistenti.

## 🎨 UI/UX

### Layout

```
┌────────────────────────────────────┐
│ [Analisi Singola] [Analisi Sequenziale 🚀] ← Tabs
└────────────────────────────────────┘

┌─ Step 1: Seleziona Domande ────────┐
│ ☑ PRO-CONTRO - Studenti (1.234)    │
│ ☑ PRO-CONTRO - Ins. Attivi (567)   │
│ □ Suggerimenti - Studenti (1.100)  │
│                                     │
│ ✓ Selezionate 2 domande            │
│   Totale: 1.801 risposte           │
└─────────────────────────────────────┘

┌─ Step 2: Template Condiviso ───────┐
│ [▼] PRO e CONTRO                    │
└─────────────────────────────────────┘

┌─ Step 3: Avvia ────────────────────┐
│ [▶ Avvia Analisi Sequenziale]      │
└─────────────────────────────────────┘
```

### Durante Esecuzione

```
🔄 Analisi in corso...

Domanda 2 di 2
████████████████░░░░ 50%

Elaborando:
├─ PRO e CONTRO (Insegnanti Attivi)
└─ 🔍 Classificazione risposte... 45%

Lista domande:
✅ PRO-CONTRO Studenti
🔄 PRO-CONTRO Ins.Attivi (classificazione 45%)
```

### Risultati Finali

```
🎉 Analisi Sequenziale Completata

┌─────────┬─────────┐
│    2    │    0    │
│Completate│ Errori │
└─────────┴─────────┘

✅ PRO-CONTRO Studenti     [Vedi Risultati]
✅ PRO-CONTRO Ins.Attivi   [Vedi Risultati]

[Nuova Analisi Sequenziale]
```

## 📊 Vantaggi

1. **⏱️ Risparmio tempo:** Da 15-20 min a 5 min per analisi multiple
2. **🎯 Coerenza:** Stesso prompt applicato a tutte le domande
3. **🔄 Automazione:** Nessun intervento manuale richiesto
4. **👁️ Trasparenza:** Monitoraggio progresso in tempo reale
5. **💪 Resilienza:** Gestione errori senza bloccare l'intera sequenza
6. **🔧 Semplicità:** Nessuna modifica backend necessaria

## 🔄 Flusso Utente Completo

1. User apre "Analisi Qualitativa"
2. Clicca tab "Analisi Sequenziale 🚀"
3. Seleziona 2+ domande con checkbox
4. Vede riepilogo: "✓ Selezionate 3 domande - 5.432 risposte"
5. Sceglie template dal dropdown
6. Click "Avvia Analisi Sequenziale"
7. Vede progresso in tempo reale
8. Alla fine vede riepilogo con link ai risultati
9. Click "Vedi Risultati" → passa al tab singolo con analisi caricata

## 🧪 Test

### Test Manuale

1. Aprire http://localhost:8119/dashboard
2. Click "Analisi Qualitativa"
3. Click tab "Analisi Sequenziale"
4. Selezionare 2-3 domande
5. Scegliere template
6. Avviare analisi
7. Verificare:
   - ✅ Progresso aggiornato in tempo reale
   - ✅ Stato domande corretto (⏳→🔄→✅)
   - ✅ Risultati salvati correttamente
   - ✅ Link "Vedi Risultati" funzionante

### Casi Edge

- ✅ Selezione 0 domande → Warning
- ✅ Selezione 1 domanda → "Seleziona almeno 2 domande"
- ✅ Errore su domanda singola → Continua con le altre
- ✅ Tutte le domande falliscono → Mostra riepilogo errori

## 📝 Note Implementazione

### Differenze tra Tab Singolo e Sequenziale

| Aspetto | Analisi Singola | Analisi Sequenziale |
|---------|----------------|---------------------|
| Selezione | 1 domanda | 2+ domande (checkbox) |
| Template | Per domanda | Condiviso per tutte |
| Revisione tassonomia | ✅ Manuale | ❌ Automatica |
| Classificazione | Manuale | ✅ Automatica |
| Tempo | 5-7 min/domanda | ~2 min/domanda |
| Intervento utente | Alto | Basso (solo setup) |

### Stato Condiviso

- La lista delle tassonomie salvate è condivisa tra i due tab
- I risultati possono essere aperti dal tab singolo anche se creati dal sequenziale
- Ricaricamento automatico lista dopo completamento sequenza

## 🚀 Prossimi Miglioramenti (Opzionali)

- [ ] Possibilità di mettere in pausa la sequenza
- [ ] Salvataggio stato sequenza (resume dopo reload)
- [ ] Export batch risultati (CSV/JSON)
- [ ] Confronto automatico tra gruppi (es: studenti vs insegnanti)
- [ ] Schedulazione analisi (run notturno)

## 🎉 Conclusione

La funzionalità **Analisi Sequenziale** rende l'analisi qualitativa molto più efficiente quando si devono analizzare domande simili per gruppi diversi, mantenendo la semplicità di utilizzo e la robustezza del sistema esistente.

**Pronto per l'uso! 🚀**
