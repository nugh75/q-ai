# Prompt Editor - Sistema di Gestione Prompt Personalizzati

## 📋 Panoramica

È stato implementato un sistema completo per la gestione dei prompt utilizzati nell'analisi qualitativa con LLM. Il sistema permette agli amministratori di:

- Visualizzare i 7 template predefiniti in italiano
- Creare nuovi prompt personalizzati
- Modificare prompt esistenti
- Disattivare/riattivare prompt
- Eliminare prompt personalizzati

## 🎯 Funzionalità Implementate

### Backend (✅ Completato e Testato)

#### 1. Database Model (`QualitativePrompt`)
```python
class QualitativePrompt(Base):
    id = Column(Integer, primary_key=True)
    template_key = Column(String, unique=True)
    template_name = Column(String)
    description = Column(Text)
    system_prompt = Column(Text)
    user_prompt_template = Column(Text)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### 2. Template Predefiniti (`qualitative_templates.py`)

7 template completamente tradotti in italiano:

1. **sentiment** - Analisi del Sentiment
2. **thematic** - Analisi Tematica
3. **suggestions** - Analisi Suggerimenti
4. **problems** - Analisi Problemi/Criticità
5. **learning_outcomes** - Analisi Risultati di Apprendimento
6. **expectations** - Analisi Aspettative
7. **custom** - Analisi Personalizzata

#### 3. API Endpoints

**GET `/api/admin/qualitative-prompts`**
- Autenticazione: Password `Lagom192.`
- Ritorna: `default_prompts` + `custom_prompts`
- Test: ✅ OK (7 template + 0 custom inizialmente)

**POST `/api/admin/qualitative-prompts`**
- Crea nuovo prompt o aggiorna esistente
- Validazione: template_key univoca
- Test: ✅ OK (creazione e modifica)

**DELETE `/api/admin/qualitative-prompts/{id}`**
- Cancellazione soft (is_active=0)
- Test: ✅ OK

#### 4. Integrazione con Analisi

Il servizio `qualitative_service.py` controlla prima il database per prompt personalizzati:

```python
def generate_taxonomy(responses, question_field, max_categories=12, template_name="custom"):
    # 1. Cerca prompt personalizzato attivo nel DB
    custom_prompt = db.query(QualitativePrompt).filter(
        QualitativePrompt.template_key == template_name,
        QualitativePrompt.is_active == 1
    ).first()
    
    # 2. Se non trovato, usa template predefinito
    if not custom_prompt:
        from .qualitative_templates import ANALYSIS_TEMPLATES
        template = ANALYSIS_TEMPLATES.get(template_name, ANALYSIS_TEMPLATES['custom'])
```

### Frontend (✅ Completato)

#### Componente `PromptAdminPanel.jsx`

**Funzionalità UI:**

1. **Lista Prompt Personalizzati**
   - Visualizzazione con stato (attivo/disattivato)
   - Badge colorati per stato
   - Pulsanti modifica/elimina

2. **Form di Creazione/Modifica**
   - Campo `template_key` (readonly in modifica)
   - Campo `template_name`
   - Campo `description` (textarea)
   - Campo `system_prompt` (textarea monospace)
   - Campo `user_prompt_template` (textarea monospace con istruzioni variabili)
   - Checkbox `is_active`

3. **Lista Template Predefiniti**
   - Visualizzazione read-only dei 7 template
   - Pulsante "Copia e Modifica" per ogni template
   - Permette di creare custom prompt basati su template

4. **Messaggi di Feedback**
   - Successo (verde)
   - Errore (rosso)
   - Validazione campi obbligatori

**Navigazione:**
- Nuovo tab "Prompt Editor" nel menu principale
- Icona Edit (✏️)
- Separato da "Config LLM" per chiarezza

## 🧪 Test Eseguiti

### Test Backend (tutti passati ✅)

1. **Health Check**
   ```bash
   curl http://localhost:8118/health
   # Status: healthy, database connected
   ```

2. **GET Prompts**
   ```bash
   curl "http://localhost:8118/api/admin/qualitative-prompts?password=Lagom192."
   # Ritornati 7 default_prompts + 0 custom_prompts
   ```

3. **POST Create**
   ```bash
   # Creato prompt "sentiment_test"
   # Ritornato: {"success": true, "prompt": {"id": 1, ...}}
   ```

4. **POST Update**
   ```bash
   # Modificato prompt id=1
   # Campi aggiornati: template_name, description, is_active
   ```

5. **DELETE**
   ```bash
   # Eliminato prompt id=1
   # Verificato: custom_prompts = 0
   ```

### Test Frontend (⚠️ Bloccato da Node.js)

- **Problema**: Vite richiede Node.js 20.19+ o 22.12+
- **Versione Attuale**: 18.19.1
- **Soluzione**: Upgrade Node.js necessario per test UI

## 📝 Variabili nei Prompt

I prompt possono usare queste variabili che vengono sostituite automaticamente:

- `{n_responses}` - Numero di risposte da analizzare
- `{responses_text}` - Testo delle risposte (prime 50)
- `{max_categories}` - Numero massimo di categorie da generare

Esempio:
```
Analizza queste {n_responses} risposte IN ITALIANO:
{responses_text}

Crea ESATTAMENTE {max_categories} categorie...
```

## 🔒 Sicurezza

- **Autenticazione**: Password hardcoded `Lagom192.`
- **Validazione**: Template_key deve essere univoca
- **Soft Delete**: I prompt eliminati mantengono `is_active=0` per tracciabilità

## 🚀 Prossimi Passi

### Priorità Alta
1. **Upgrade Node.js** (20.19+ o 22.12+) per testare UI
2. **Test End-to-End** con analisi qualitativa reale usando prompt custom
3. **Export/Import** template in formato JSON

### Priorità Media
4. **Preview Prompt** - Testare prompt prima di salvare
5. **Versioning** - Storico modifiche ai prompt
6. **Clonazione** - Duplicare prompt esistenti

### Priorità Bassa
7. **Validazione Avanzata** - Syntax check per variabili
8. **Template Categories** - Organizzare per tipo di analisi
9. **Condivisione** - Esportare/importare tra istanze

## 📚 Struttura File

```
backend/
├── app/
│   ├── models.py                    # Modello QualitativePrompt
│   ├── qualitative_templates.py     # 7 template predefiniti IT
│   ├── qualitative_service.py       # Logica analisi + lookup DB
│   └── main.py                      # Endpoints API
frontend/
└── src/
    └── components/
        ├── PromptAdminPanel.jsx     # UI amministrazione
        ├── Dashboard.jsx            # Navigazione + tab
        └── Icons.jsx                # Icona Edit
```

## 💡 Esempio di Utilizzo

### Scenario 1: Creare Analisi Sentiment Personalizzata

1. Andare su tab "Prompt Editor"
2. Cliccare su template predefinito "Analisi del Sentiment"
3. Cliccare "Copia e Modifica"
4. Modificare:
   - `template_key`: `sentiment_custom`
   - `template_name`: `Sentiment per Valutazioni Corso`
   - Aggiungere categorie specifiche nel prompt
5. Salvare
6. Andare su "Analisi Qualitativa"
7. Nel dropdown template, selezionare il nuovo "Sentiment per Valutazioni Corso"
8. Generare tassonomia

### Scenario 2: Disattivare Template Temporaneamente

1. Tab "Prompt Editor"
2. Trovare prompt in lista custom
3. Cliccare "Modifica"
4. Deselezionare checkbox "Attivo"
5. Salvare
6. Il prompt non apparirà più nel dropdown dell'analisi qualitativa

## 🐛 Troubleshooting

### Errore: "Password non valida"
- Verificare che la password sia esattamente `Lagom192.` (con punto finale)

### Template non appare nel dropdown
- Verificare che `is_active=true`
- Verificare che il backend sia stato riavviato dopo modifiche al DB

### LLM non usa il prompt custom
- Verificare che `template_key` corrisponda al nome selezionato
- Verificare la priorità: DB > template predefiniti

### JSON troncato durante analisi
- Ridurre `max_categories`
- Semplificare i prompt per ridurre token output

## 📊 Statistiche

- **Template Predefiniti**: 7
- **Lingue**: Italiano
- **Endpoint API**: 3
- **Campi Editabili**: 6
- **Autenticazione**: Password-based
- **Test Backend**: 5/5 ✅
- **Test Frontend**: Pending (upgrade Node.js)

## 🎉 Conclusione

Il sistema di gestione prompt è completamente funzionale a livello backend. Gli amministratori possono:

✅ Visualizzare tutti i template
✅ Creare prompt personalizzati  
✅ Modificare prompt esistenti
✅ Gestire lo stato attivo/inattivo
✅ Eliminare prompt

L'interfaccia frontend è completa ma richiede upgrade di Node.js per il test finale. Il sistema è pronto per l'uso in produzione dopo la verifica UI.
