# Supporto Grafici Multiple Choice

## 📊 Panoramica

Aggiunto supporto completo per visualizzare statistiche e grafici per domande a scelta multipla (multiple_choice).

## ✨ Funzionalità Implementate

### Backend

#### 1. QuestionStatsService (`backend/app/question_stats_service.py`)

**Nuovo metodo: `_get_multiple_choice_stats()`**
- Analizza risposte separate da virgole o punto e virgola
- Conta occorrenze di ogni opzione
- Calcola statistiche complete:
  - **Total responses**: Numero di rispondenti
  - **Total selections**: Numero totale di selezioni
  - **Unique options**: Numero di opzioni uniche
  - **Avg selections per response**: Media di opzioni selezionate per rispondente
  - **Most selected**: Opzione più selezionata
  - **Most selected count**: Numero di volte selezionata

**Distribuzione dati:**
Ogni opzione include:
- `option`: Nome dell'opzione
- `count`: Numero di volte selezionata
- `percentage`: Percentuale rispetto ai rispondenti
- `selection_percentage`: Percentuale rispetto alle selezioni totali

**Mapping campi aggiornati:**

**Studenti (STUDENT_FIELD_MAPPING):**
- Colonna 23: `ai_tools` - Strumenti AI utilizzati
- Colonna 24: `ai_purposes` - Scopi utilizzo AI
- Colonna 25: `not_use_for` - Attività per cui NON usare AI

**Insegnanti (TEACHER_FIELD_MAPPING):**
- Colonna 18: `not_use_for` - Attività per cui NON usare AI
- Colonna 25: `ai_tools` - Strumenti AI utilizzati
- Colonna 26: `ai_purposes` - Scopi utilizzo AI

### Frontend

#### 1. Dashboard.jsx

**Modifiche:**
- Rimosso filtro che escludeva domande `multiple_choice`
- Cambiato da: `hasStats = q.response_format !== 'text' && q.response_format !== 'multiple_choice'`
- A: `hasStats = q.response_format !== 'text'`
- Ora tutte le domande multiple_choice mostrano il pulsante toggle per statistiche

#### 2. QuestionStats.jsx

**Supporto grafici multiple_choice:**

**Bar Chart:**
- Asse X mostra le opzioni (ruotate a -45° per leggibilità)
- Asse Y mostra il conteggio
- Altezza asse X aumentata a 100px per nomi lunghi

**Pie Chart:**
- Visualizza distribuzione percentuale delle opzioni
- Include legenda per identificare le opzioni
- Label mostra percentuale
- Altezza aumentata a 350px per accogliere legenda

**Statistiche visualizzate:**
- **Risposte Totali**: Numero di rispondenti
- **Opzioni Uniche**: Numero di opzioni diverse
- **Selezioni Totali**: Totale selezioni aggregate
- **Media Selezioni**: Media opzioni per rispondente
- **Più Selezionata**: Opzione più popolare con conteggio

## 📈 Esempi di Utilizzo

### Studenti - Strumenti AI (Colonna 23)

**Endpoint:** `GET /api/questions/student/23/stats`

**Risultato:**
```json
{
  "has_data": true,
  "response_count": 406,
  "statistics": {
    "total_responses": 406,
    "total_selections": 788,
    "unique_options": 24,
    "avg_selections_per_response": 1.94,
    "most_selected": "Chatgpt 4",
    "most_selected_count": 214
  },
  "distribution": [
    {
      "option": "Chatgpt 4",
      "count": 214,
      "percentage": 52.71,
      "selection_percentage": 27.16
    },
    ...
  ],
  "chart_types": ["bar", "pie"],
  "recommended_chart": "bar"
}
```

### Insegnanti - Strumenti AI (Colonna 25)

**Endpoint:** `GET /api/questions/teacher/25/stats`

**Risultato:**
```json
{
  "has_data": true,
  "response_count": 378,
  "statistics": {
    "total_responses": 378,
    "total_selections": 710,
    "unique_options": 44,
    "avg_selections_per_response": 1.88,
    "most_selected": "Gemini",
    "most_selected_count": 164
  }
}
```

## 🎨 Visualizzazione UI

### Interfaccia Domande
1. Nella tab "Domande", ogni domanda multiple_choice ora mostra:
   - Badge "Chiusa" con icona
   - Pulsante toggle con icona grafico
   - Quando espansa: statistiche + grafico

### Grafici Disponibili
- **Bar Chart** (raccomandato): Confronto visivo delle opzioni
- **Pie Chart**: Distribuzione percentuale

### Griglia Statistiche
Layout a 4 colonne con:
- Risposte Totali (blu)
- Opzioni Uniche (verde)
- Selezioni Totali (arancione)
- Media Selezioni
- Più Selezionata (spanning 2 colonne, blu)

## 🔧 Dettagli Tecnici

### Parsing Risposte
Il sistema gestisce automaticamente:
- Separatori virgola: `"ChatGPT, Gemini, Claude"`
- Separatori punto e virgola: `"ChatGPT; Gemini; Claude"`
- Trimming spazi bianchi
- Filtraggio stringhe vuote

### Calcoli Percentuali
- **percentage**: `(count / total_responses) * 100`
  - Es: Se 214 su 406 hanno scelto "ChatGPT 4" = 52.71%
- **selection_percentage**: `(count / total_selections) * 100`
  - Es: 214 su 788 selezioni totali = 27.16%

### Performance
- Query ottimizzate su database
- Cache frontend per evitare ricaricamenti
- Rendering condizionale dei grafici

## 📝 Note

- Le domande multiple_choice ora hanno pari priorità con altre domande chiuse
- I grafici si adattano automaticamente al numero di opzioni
- La legenda nel pie chart aiuta con molte opzioni
- Le etichette ruotate nel bar chart migliorano la leggibilità

## 🚀 Testing

Per testare:
1. Aprire http://localhost:5180
2. Navigare alla tab "Domande"
3. Trovare domande come "Quali sono gli strumenti..."
4. Cliccare sul pulsante toggle con icona grafico
5. Visualizzare statistiche e cambiare tipo di grafico

## ✅ Domande Multiple Choice Supportate

### Studenti:
- Col 23: Strumenti AI utilizzati ✅
- Col 24: Scopi utilizzo AI ✅
- Col 25: Attività NON usare AI ✅

### Insegnanti:
- Col 18: Attività NON usare AI ✅
- Col 25: Strumenti AI utilizzati ✅
- Col 26: Scopi utilizzo AI ✅

---

**Data implementazione:** 1 ottobre 2025  
**Versione:** 1.0.0
