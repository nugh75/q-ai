# Fix: Selezione Domanda in Analisi Qualitativa

## 🐛 Problema Risolto

**Sintomo**: Quando si selezionava una domanda nel tab "Analisi Qualitativa", l'interfaccia tornava indietro e non mostrava il pulsante "Avvia Analisi".

## 🔍 Causa

Il componente `QualitativeAnalysis.jsx` aveva due problemi:

1. **Bug nel parsing del valore del select**: 
   - Usava `.split('_', 2)` per separare `field_key` e `respondent_type`
   - Falliva quando `field_key` conteneva underscore (es: `learning_improvement`)
   - Esempio: `learning_improvement_students` → split sbagliato

2. **UI confusa**:
   - Mancava un pannello chiaro che mostrasse la domanda selezionata
   - Il pulsante "Avvia Analisi" era posizionato accanto al select (poco visibile)

## ✅ Soluzione

### 1. Parsing Robusto con JSON
Invece di usare string split, ora uso `JSON.stringify/parse`:

```jsx
// PRIMA (bug)
value={`${selectedQuestion.field_key}_${selectedQuestion.respondent_type}`}
onChange={(e) => {
  const [field_key, respondent_type] = e.target.value.split('_', 2)
  // ❌ Falliva con field_key che contiene underscore
}}

// DOPO (funzionante)
value={JSON.stringify({ 
  field_key: selectedQuestion.field_key, 
  respondent_type: selectedQuestion.respondent_type 
})}
onChange={(e) => {
  const { field_key, respondent_type } = JSON.parse(e.target.value)
  // ✅ Parsing robusto e affidabile
}}
```

### 2. UI Migliorata

Ora quando si seleziona una domanda:
1. Il select mostra la scelta
2. Appare un **pannello viola** con:
   - Testo completo della domanda
   - Numero di risposte disponibili
   - Tipo di rispondente
   - **Pulsante grande "Avvia Analisi Qualitativa"**

```jsx
{selectedQuestion && !results && (
  <div style={{
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    borderLeft: '4px solid #8b5cf6'
  }}>
    {/* Dettagli domanda */}
    <button onClick={analyzeQuestion}>
      Avvia Analisi Qualitativa
    </button>
  </div>
)}
```

## 🎯 Risultato

**PRIMA**:
```
[Select Domanda ▼] [Avvia Analisi] ← Pulsante piccolo, poco visibile
                                      Ritornava a select dopo scelta
```

**DOPO**:
```
[Select Domanda ▼]

╔══════════════════════════════════════════╗
║ 📝 Domanda selezionata:                  ║
║ "In che modo l'intelligenza artificiale  ║
║  ha influito sul tuo apprendimento?"     ║
║                                          ║
║ 📊 150 risposte  👥 Studenti            ║
║                                          ║
║ [▶ Avvia Analisi Qualitativa]          ║
╚══════════════════════════════════════════╝
```

## 🔧 File Modificato

- `/home/nugh75/q-ai/frontend/src/components/QualitativeAnalysis.jsx`

## ✅ Verifiche

- [x] Selezione domanda funziona con qualsiasi `field_key` (anche con underscore)
- [x] Pannello dettagli domanda visibile e chiaro
- [x] Pulsante "Avvia Analisi" grande e ben visibile
- [x] Messaggio durante analisi: "può richiedere 30-60 secondi"
- [x] Nessun errore in console

## 🚀 Test

1. Vai su **Analisi Qualitativa**
2. Seleziona una domanda dal dropdown
3. Verifica che appaia il pannello viola con dettagli
4. Clicca **"Avvia Analisi Qualitativa"**
5. Attendi il completamento (30-60 secondi)
6. Visualizza i risultati

---

**Status**: ✅ RISOLTO
**Data**: 8 ottobre 2025, 12:55
