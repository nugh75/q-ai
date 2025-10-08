# Analisi Qualitativa - Setup e Utilizzo

## 🎯 Panoramica
Sistema di analisi qualitativa per domande aperte con supporto LLM multi-provider (Ollama, Gemini, OpenAI).

## 🔧 Modifiche Implementate

### Backend
1. **Modelli Database** (`backend/app/models.py`):
   - `LLMConfig`: Configurazione LLM attiva
   - `QualitativeTaxonomy`: Tassonomie generate
   - `QualitativeAnnotation`: Classificazioni risposte

2. **Servizio Qualitativo** (`backend/app/qualitative_service.py`):
   - Supporto Ollama (locale), Gemini API, OpenAI API
   - Generazione tassonomia (max 12 categorie)
   - Classificazione multi-label
   - Calcolo co-occorrenze
   - Estrazione esempi top per categoria

3. **Endpoint API** (`backend/app/main.py`):
   - `GET /api/admin/llm-config` - Ottieni configurazione
   - `POST /api/admin/llm-config` - Salva configurazione
   - `GET /api/admin/ollama-models` - Lista modelli Ollama
   - `GET /api/qualitative-analysis/available-questions` - Domande aperte disponibili
   - `POST /api/qualitative-analysis/analyze-question` - Avvia analisi
   - `GET /api/qualitative-analysis/taxonomies` - Lista analisi salvate
   - `GET /api/qualitative-analysis/taxonomy/{id}` - Dettagli tassonomia

4. **CORS** aggiornato:
   - Aggiunto supporto per `https://ai-q-2.ai4educ.org`
   - Metodi: GET, POST, PUT, DELETE, OPTIONS
   - Headers: `*` (tutti)

### Frontend
1. **LLMAdminPanel** (`frontend/src/components/LLMAdminPanel.jsx`):
   - Autenticazione con password: `Lagom192.`
   - Configurazione provider (Ollama/Gemini/OpenAI)
   - Caricamento automatico modelli Ollama
   - Endpoint predefinito: `http://192.168.129.14:11434`

2. **QualitativeAnalysis** (`frontend/src/components/QualitativeAnalysis.jsx`):
   - Selezione domanda aperta
   - Avvio analisi con LLM
   - Visualizzazione tassonomia
   - Statistiche distribuzione categorie
   - Matrice co-occorrenze
   - Top esempi per categoria

3. **Icons** (`frontend/src/components/Icons.jsx`):
   - Aggiunte icone: Settings, Play, Tags, Star

4. **Dashboard** (`frontend/src/components/Dashboard.jsx`):
   - Tab "Analisi Qualitativa"
   - Tab "Amministrazione"

## 🚀 Setup Iniziale

### 1. Installa Dipendenze Backend
```bash
cd /home/nugh75/q-ai/backend
pip install -r requirements.txt
```

### 2. Configura Ambiente (opzionale)
Crea file `.env` in `backend/`:
```bash
DATABASE_URL=sqlite:///./questionnaire.db
CORS_ORIGINS=http://localhost:5173,https://ai-q-2.ai4educ.org
OLLAMA_HOST=http://192.168.129.14:11434
```

### 3. Avvia Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8118
```

### 4. Avvia Frontend
```bash
cd frontend
npm install  # Solo prima volta
npm run dev
```

## 📋 Come Usare

### Passo 1: Configura LLM
1. Apri Dashboard → **Amministrazione**
2. Inserisci password: `Lagom192.`
3. Seleziona provider:
   - **Ollama** (locale): Endpoint `http://192.168.129.14:11434`
   - **Gemini**: Inserisci API Key da [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **OpenAI**: Inserisci API Key da [OpenAI Platform](https://platform.openai.com/api-keys)
4. Seleziona modello (per Ollama caricamento automatico)
5. **Salva Configurazione**

### Passo 2: Analizza Domanda Aperta
1. Apri Dashboard → **Analisi Qualitativa**
2. Seleziona tipo rispondente (Studenti/Insegnanti)
3. Seleziona domanda dalla lista
4. Clicca **Avvia Analisi**
5. Attendi generazione tassonomia (30-60 secondi)

### Passo 3: Visualizza Risultati
- **Tassonomia**: Categorie con definizioni e parole chiave
- **Distribuzione**: Grafico a barre frequenza categorie
- **Co-occorrenze**: Matrice categorie che appaiono insieme
- **Top Esempi**: Migliori esempi per categoria con confidence score

## 🐳 Docker Setup

### Backend
Il backend deve avere accesso a Ollama su `192.168.129.14:11434`.

Verifica connettività:
```bash
curl http://192.168.129.14:11434/api/tags
```

### Variabili Ambiente Docker
In `docker-compose.yml` o `.env`:
```yaml
environment:
  - CORS_ORIGINS=https://ai-q-2.ai4educ.org,http://localhost:5173
  - DATABASE_URL=sqlite:///./questionnaire.db
```

## 🔍 Troubleshooting

### Errore CORS
- Verifica che il backend includa l'origine corretta in `CORS_ORIGINS`
- Controlla logs backend per richieste bloccate

### Modelli Ollama Non Caricati
1. Verifica Ollama sia in esecuzione: `curl http://192.168.129.14:11434/api/tags`
2. Controlla endpoint nel pannello admin
3. Verifica firewall non blocchi porta 11434

### Analisi Fallisce
1. Verifica configurazione LLM salvata
2. Controlla logs backend per errori API
3. Per Gemini/OpenAI: verifica API key valida e quota disponibile
4. Per Ollama: verifica modello sia scaricato (`ollama list`)

## 📊 Domande Aperte Disponibili

### Studenti (9 domande)
- `learning_improvement`: Miglioramento apprendimento con IA
- `difficulties`: Difficoltà incontrate
- `pros_cons`: Pro e contro uso IA
- Altre 6 domande...

### Insegnanti (11 domande)
- `didactics_change`: Come è cambiata la didattica
- `future_role`: Ruolo futuro dell'IA
- `concerns`: Preoccupazioni
- Altre 8 domande...

## 🔐 Sicurezza
- Password admin: `Lagom192.` (hardcoded)
- API Keys salvate in database (non esposte nel frontend)
- Validazione password su tutti endpoint admin

## 📝 Note Tecniche
- Timeout LLM: 300 secondi
- Max categorie tassonomia: 12
- Multi-label: Ogni risposta può appartenere a più categorie
- Co-occorrenza: Minimo 2 occorrenze per coppia
