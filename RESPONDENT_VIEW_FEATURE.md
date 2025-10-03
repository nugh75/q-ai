# Feature: Visualizzazione Risposte Singolo Rispondente

## Descrizione

Questa feature permette di visualizzare tutte le risposte di un singolo rispondente cercando tramite il suo codice identificativo univoco.

Il codice identificativo è composto da **6 caratteri**: 
- Le ultime **4 lettere del cognome della madre**
- Il **giorno di nascita** nel formato `gg` (2 cifre)

**Esempio:** Se il cognome della madre è "ROSSI" e il giorno di nascita è il 15, il codice sarà: `OSSI15`

## Componenti Implementati

### Backend (`/backend/app/main.py`)

#### 1. **GET /api/respondents/list**
Restituisce la lista di tutti i codici rispondenti disponibili.

**Parametri Query:**
- `respondent_type` (opzionale): `student`, `teacher`, `teacher_active`, `teacher_training`, o omesso per tutti

**Risposta:**
```json
{
  "total": 1234,
  "respondents": [
    {"code": "ROSS15", "type": "student"},
    {"code": "BIAN23", "type": "teacher_active"}
  ]
}
```

#### 2. **GET /api/respondent/{code}**
Restituisce tutte le risposte di un singolo rispondente.

**Parametri Path:**
- `code`: Codice identificativo del rispondente

**Risposta (rispondente trovato):**
```json
{
  "found": true,
  "respondent_type": "student",
  "code": "ROSS15",
  "demographics": {
    "age": 17,
    "gender": "Maschio",
    "school_type": "Liceo",
    "education_level": "Quarto anno",
    "study_path": "Scientifico"
  },
  "responses": [
    {
      "question_id": 0,
      "question_text": "Quale è la tua età?",
      "category": "demographic",
      "response_format": "numeric",
      "value": "17",
      "raw_value": 17
    }
  ],
  "timestamp": "2024-10-01T10:30:00"
}
```

**Risposta (rispondente non trovato):**
```json
{
  "found": false,
  "code": "AAAA00",
  "message": "Nessun rispondente trovato con questo codice"
}
```

### Frontend

#### Componente: `RespondentView.jsx`

Nuovo componente React che fornisce:

**Features:**
1. **Campo di ricerca** per il codice rispondente
2. **Filtri** per tipo rispondente (studenti/insegnanti/categoria)
3. **Lista codici disponibili** espandibile per selezione rapida
4. **Visualizzazione completa** di tutte le risposte organizzate per categoria
5. **Dati demografici** del rispondente
6. **Badge colorati** per distinguere il tipo di rispondente
7. **Formato risposte** ottimizzato per sola lettura (no grafici)

**Integrazione Dashboard:**
- Nuovo tab "**Rispondenti**" aggiunto nella navigazione principale
- Posizionato dopo "Domande" per facile accesso

## Utilizzo

### Per l'utente finale:

1. Aprire la dashboard
2. Cliccare sul tab "**Rispondenti**"
3. Opzionale: filtrare per tipo rispondente (Studenti/Insegnanti/etc.)
4. Inserire il codice identificativo nel campo di ricerca (es: `ROSS15`)
5. Premere "Cerca" o premere Invio
6. Visualizzare tutte le risposte del rispondente organizzate per categoria
7. Opzionale: filtrare le risposte per categoria specifica

### Informazioni visualizzate:

- **Header**: codice, tipo rispondente, badge colorato
- **Dati demografici**: età, genere, tipo scuola, etc.
- **Risposte per categoria**: tutte le domande con relative risposte
- **Formato risposta**: indicatore visivo del tipo (scala, sì/no, numerico, testo, multipla)
- **Riepilogo**: conteggio totale risposte e timestamp compilazione

## Caratteristiche tecniche

### Sicurezza e Privacy
- Il codice è un identificativo anonimo (non contiene dati personali diretti)
- Accesso solo tramite codice esatto (nessuna ricerca parziale)
- Nessuna visualizzazione di dati sensibili non autorizzati

### Performance
- Lista codici caricata solo quando necessario
- Ricerca ottimizzata tramite indice database sul campo `code`
- Filtri applicati lato server per efficienza

### UX/UI
- Design responsive e mobile-friendly
- Badge colorati per identificazione rapida tipo rispondente
- Tooltip e icone per guidare l'utente
- Lista codici espandibile per evitare sovraccarico visivo
- Ricerca rapida tramite click su codice nella lista

## Formati Risposta

Le risposte vengono formattate automaticamente in base al tipo:

| Formato | Esempio Visualizzazione | Icona |
|---------|------------------------|-------|
| `scale_1_7` | `5/7` | 📊 |
| `yes_no` | `Sì` / `No` | ✓/✗ |
| `numeric` | `17` | 🔢 |
| `text` | Testo completo | 📝 |
| `multiple_choice` | Lista opzioni | ☑️ |

## Testing

### Test manuali suggeriti:

1. **Ricerca studente esistente**: inserire codice valido studente → verificare risposte corrette
2. **Ricerca insegnante esistente**: inserire codice valido insegnante → verificare tipo corretto
3. **Ricerca codice inesistente**: inserire `ZZZZ99` → verificare messaggio errore
4. **Filtro tipo rispondente**: selezionare "Solo studenti" → verificare lista filtrata
5. **Filtro categoria**: cercare rispondente e filtrare per categoria → verificare risposte filtrate
6. **Click su codice lista**: cliccare codice nella lista espandibile → verificare ricerca automatica

## Estensioni Future

Possibili miglioramenti:
- Export risposte singolo rispondente in PDF/CSV
- Confronto risposte tra più rispondenti
- Visualizzazione statistica: posizione del rispondente rispetto alla media
- Ricerca avanzata con filtri multipli
- Storia ricerche recenti

## Note Tecniche

- Campo database utilizzato: `code` (presente in `StudentResponse` e `TeacherResponse`)
- Indice database: campo `code` è già indicizzato per performance ottimali
- Gestione case-insensitive: codice convertito automaticamente in maiuscolo
- Validazione: nessuna validazione formato per flessibilità (futuro enhancement)
