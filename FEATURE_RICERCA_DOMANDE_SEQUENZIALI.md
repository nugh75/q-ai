# 🔍 Box di Ricerca Domande - Analisi Sequenziale

**Data implementazione:** 8 ottobre 2025  
**Feature:** Ricerca e filtro domande nell'analisi sequenziale

---

## ✨ Funzionalità

Aggiunto un **box di ricerca** nella sezione "Analisi Sequenziale" che permette di filtrare rapidamente le domande disponibili.

### 🎯 Caratteristiche

1. **Ricerca in tempo reale**
   - Filtra mentre digiti
   - Cerca in: testo domanda, gruppo respondent, tipo domanda

2. **Interfaccia intuitiva**
   - Icona lente di ingrandimento 🔍
   - Pulsante X per cancellare rapidamente
   - Contatore risultati

3. **Smart filtering**
   - Case-insensitive (maiuscole/minuscole)
   - Cerca in tutti i campi rilevanti
   - Mostra "Nessuna domanda trovata" se non ci sono match

---

## 🎨 UI/UX

### Box di Ricerca

```
┌──────────────────────────────────────────────┐
│ 🔍 Cerca domande... (es: PRO, studenti)    ✕│
└──────────────────────────────────────────────┘
ℹ️ Trovate 3 domande su 12
```

### Stati

1. **Normale** - Bordo grigio
2. **Focus** - Bordo blu (#3b82f6)
3. **Con testo** - Mostra pulsante X per cancellare
4. **Con risultati** - Mostra contatore

### Caso "Nessun risultato"

```
┌────────────────────────────────────┐
│           🔍                       │
│    Nessuna domanda trovata         │
│                                    │
│  Prova con un termine diverso o    │
│  cancella la ricerca               │
└────────────────────────────────────┘
```

---

## 🔍 Esempi di Ricerca

| Query | Risultati |
|-------|-----------|
| `PRO` | Tutte le domande "PRO e CONTRO" |
| `studenti` | Tutte le domande del gruppo Studenti |
| `insegnanti` | Domande di Insegnanti attivi + non attivi |
| `suggerimenti` | Domande "Suggerimenti per l'utilizzo" |
| `attivi` | Solo Insegnanti in servizio |
| `IA` | Domande che contengono "IA" nel testo |

---

## 💻 Implementazione Tecnica

### Nuovo Stato

```javascript
const [searchQuery, setSearchQuery] = useState('')
```

### Funzione di Filtro

```javascript
const getFilteredQuestions = () => {
  if (!searchQuery.trim()) return questions
  
  const query = searchQuery.toLowerCase()
  return questions.filter(q => {
    const questionText = q.question_text.toLowerCase()
    const respondentLabel = getRespondentLabel(q.respondent_type).toLowerCase()
    const fieldLabel = getQuestionLabel(q.field_key).toLowerCase()
    
    return questionText.includes(query) || 
           respondentLabel.includes(query) || 
           fieldLabel.includes(query)
  })
}
```

### Campi Cercati

1. **question_text** - Testo completo della domanda
2. **respondent_type** - Studenti, Insegnanti Attivi, Insegnanti Non Attivi
3. **field_key** - PRO e CONTRO, Suggerimenti, Pratiche, etc.

---

## 🎯 Casi d'uso

### Scenario 1: Analisi per Gruppo
```
Ricerca: "studenti"
→ Mostra solo domande del gruppo Studenti
→ Seleziona tutte quelle rilevanti
→ Avvia analisi sequenziale
```

### Scenario 2: Analisi per Tipo Domanda
```
Ricerca: "PRO"
→ Mostra solo domande "PRO e CONTRO"
→ Seleziona per tutti i gruppi
→ Confronta PRO/CONTRO tra studenti e insegnanti
```

### Scenario 3: Ricerca Specifica
```
Ricerca: "suggerimenti insegnanti"
→ Mostra suggerimenti solo per insegnanti
→ Focus su analisi mirata
```

---

## 🎨 Dettagli Stilistici

### Input Box
- **Border normale:** `#e2e8f0` (grigio chiaro)
- **Border focus:** `#3b82f6` (blu)
- **Padding sinistra:** 2.75rem (spazio per icona)
- **Border radius:** 8px
- **Transition:** 0.2s smooth

### Icone
- **Search:** Sinistra, colore `#94a3b8`
- **X (clear):** Destra, compare solo con testo
- **Info:** Accanto al contatore risultati

### Messaggio "No results"
- Icona lente grande (12x12)
- Colore testo: `#64748b`
- Background: `#f8fafc`
- Border: `1px dashed #cbd5e1`

---

## ✅ Benefici

1. **⚡ Velocità** - Trova domande istantaneamente
2. **🎯 Precisione** - Focus solo su domande rilevanti
3. **🧠 UX migliore** - Meno scroll, più efficienza
4. **📊 Scalabilità** - Utile quando ci sono molte domande

---

## 🧪 Test

### Test 1: Ricerca Basica
1. Vai su "Analisi Sequenziale"
2. Digita "studenti" nel box
3. ✅ Mostra solo domande studenti

### Test 2: Cancellazione
1. Scrivi qualcosa nella ricerca
2. Click sulla X
3. ✅ Torna a mostrare tutte le domande

### Test 3: Nessun risultato
1. Digita "xyz123" (qualcosa che non esiste)
2. ✅ Mostra messaggio "Nessuna domanda trovata"
3. Click "cancella la ricerca"
4. ✅ Torna alla lista completa

### Test 4: Case-insensitive
1. Prova: "STUDENTI", "studenti", "Studenti"
2. ✅ Tutti danno gli stessi risultati

### Test 5: Selezione con Filtro
1. Cerca "PRO"
2. Seleziona alcune domande
3. Cancella ricerca
4. ✅ Le domande selezionate rimangono selezionate

---

## 📁 File Modificati

- `/home/nugh75/q-ai/frontend/src/components/QualitativeAnalysis.jsx`
  - Aggiunto stato `searchQuery`
  - Aggiunta funzione `getFilteredQuestions()`
  - Aggiunto UI box di ricerca
  - Aggiunto messaggio "no results"

---

## 🚀 Deployment

```bash
docker-compose build frontend
docker-compose restart frontend
```

✅ **Feature disponibile su http://localhost:5180/dashboard**

---

## 🎉 Risultato

Box di ricerca funzionale e intuitivo che migliora significativamente l'usabilità dell'analisi sequenziale, specialmente quando ci sono molte domande disponibili.

**Perfetto per analisi mirate e veloci! 🚀**
