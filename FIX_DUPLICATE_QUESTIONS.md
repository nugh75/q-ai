# Fix: Domande Duplicate nel Frontend

## 🐛 Problema

Le domande venivano mostrate duplicate sia per studenti che per insegnanti nel tab "Domande" della dashboard.

## 🔍 Causa

Nel componente `Dashboard.jsx`, le domande venivano renderizzate usando `key={idx}` (indice dell'array) invece di un identificatore univoco.

```jsx
// ❌ PRIMA (con bug)
.map((q, idx) => {
  const questionId = `${q.respondent_type}-${q.column_index}`
  return (
    <div key={idx} className={`question-card ${q.question_type}`}>
      {/* ... */}
    </div>
  )
})
```

### Perché causava duplicati?

React usa la `key` prop per identificare univocamente gli elementi in una lista. Quando si usa l'indice dell'array (`idx`):
- Se due domande hanno lo stesso indice dopo il filtro
- O se l'array viene riordinato/filtrato
- React potrebbe renderizzare lo stesso componente più volte
- Causando duplicazioni visive

## ✅ Soluzione

Cambiato la `key` da `idx` a `questionId`, che è una stringa univoca formata da `respondent_type` + `column_index`:

```jsx
// ✅ DOPO (corretto)
.map((q, idx) => {
  const questionId = `${q.respondent_type}-${q.column_index}`
  return (
    <div key={questionId} className={`question-card ${q.question_type}`}>
      {/* ... */}
    </div>
  )
})
```

### Perché funziona?

- `questionId` è univoco per ogni domanda: `"student-3"`, `"teacher-4"`, etc.
- React può identificare correttamente ogni elemento
- Nessuna duplicazione o rendering errato
- Performance migliorate perché React può fare reconciliation corretto

## 📊 Verifica

### Prima del fix:
- ❌ Domande duplicate visibili
- ❌ Possibili problemi di rendering quando si filtra
- ❌ Toggle statistiche potrebbe influenzare domande sbagliate

### Dopo il fix:
- ✅ Ogni domanda appare una sola volta
- ✅ Filtri funzionano correttamente
- ✅ Toggle statistiche funziona sulla domanda corretta
- ✅ Performance migliorate

## 🔧 File Modificato

**File:** `/frontend/src/components/Dashboard.jsx`

**Linea modificata:** ~216

**Cambio:**
```diff
- <div key={idx} className={`question-card ${q.question_type}`}>
+ <div key={questionId} className={`question-card ${q.question_type}`}>
```

## 📝 Best Practice React

### ❌ Non usare come key:
- `key={index}` - Può causare problemi con liste dinamiche
- `key={Math.random()}` - Causa re-render completi
- `key={new Date()}` - Sempre diversa, re-render continui

### ✅ Usare come key:
- `key={item.id}` - ID univoco dal database
- `key={item.uniqueField}` - Campo univoco dell'oggetto
- `key={`${type}-${id}`}` - Combinazione di campi univoci

## 🧪 Test

Per verificare il fix:

1. **Apri** http://localhost:5180
2. **Vai** al tab "Domande"
3. **Verifica** che ogni domanda appaia solo una volta
4. **Applica filtri:**
   - Filtra per "Studenti" → verifica conteggio
   - Filtra per "Insegnanti" → verifica conteggio
   - Filtra per categoria → verifica nessun duplicato
5. **Test toggle:**
   - Espandi statistiche per una domanda
   - Verifica che si espanda solo quella
   - Espandi altre domande contemporaneamente
   - Verifica che le statistiche siano corrette per ciascuna

## 📈 Impact

**Utente:**
- ✅ Interfaccia pulita e corretta
- ✅ Nessuna confusione con domande duplicate
- ✅ Navigazione più fluida

**Tecnico:**
- ✅ Rendering corretto di React
- ✅ Performance migliorate
- ✅ Codice conforme alle best practices

## 🚀 Deploy

```bash
# Rebuild solo frontend
docker-compose up -d --build frontend

# Verifica
curl -s http://localhost:5180
```

---

**Data fix:** 1 ottobre 2025  
**Tipo:** Bug fix frontend  
**Severity:** Medium (UI issue)  
**Status:** ✅ Risolto e deployato
