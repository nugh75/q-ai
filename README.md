# 📊 Analisi Questionari AI - CNR

Sistema completo per l'analisi di questionari studenti e insegnanti sull'utilizzo dell'Intelligenza Artificiale in ambito educativo.

## 🎯 Caratteristiche

- **Backend Python (FastAPI)**: API REST per elaborazione dati Excel e analisi statistica
- **Frontend React (Vite)**: Dashboard moderna e interattiva con grafici dinamici
- **Database PostgreSQL**: Archiviazione strutturata delle risposte
- **Docker**: Configurazione completa per deployment rapido
- **Analisi Avanzate**:
  - Statistiche descrittive (media, mediana, distribuzione)
  - Analisi comparativa tra studenti e insegnanti
  - Identificazione domande speculari
  - Analisi strumenti AI utilizzati
  - Filtraggio insegnanti attivi/non attivi

## 🏗️ Architettura

```
q-ai/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── main.py      # Entry point API
│   │   ├── models.py    # Modelli database
│   │   ├── database.py  # Configurazione DB
│   │   ├── excel_parser.py  # Parser Excel
│   │   └── analytics.py # Logica analisi
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/            # React Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.css
│   │   ├── App.jsx
│   │   └── App.css
│   ├── Dockerfile
│   └── package.json
├── dati/               # File Excel questionari
│   ├── Studenti - Questionario -CNR.xlsx
│   └── Insegnati - Questionario - CNR.xlsx
├── docker-compose.yml
└── README.md
```

## 🚀 Installazione e Avvio

### Prerequisiti

- Docker 20.10+
- Docker Compose 2.0+

### Avvio Rapido

1. **Clone del repository** (se applicabile):
   ```bash
   git clone <repository-url>
   cd q-ai
   ```

2. **Avvia tutti i servizi con Docker Compose**:
   ```bash
   docker-compose up -d
   ```

   Questo comando:
   - Avvia PostgreSQL sulla porta 5432
   - Avvia il backend FastAPI sulla porta 8000
   - Avvia il frontend React sulla porta 5173
   - Importa automaticamente i dati dai file Excel

3. **Accedi all'applicazione**:
   - **Frontend Dashboard**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Docs (Swagger)**: http://localhost:8000/docs

### Verifica Servizi

```bash
# Controlla lo stato dei container
docker-compose ps

# Visualizza i log
docker-compose logs -f

# Log specifici per servizio
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Verifica stato database e numero di risposte importate.

### Import Dati
```http
POST /api/import
```
Importa dati dai file Excel nel database.

### Statistiche Studenti
```http
GET /api/students
```
Restituisce statistiche complete per gli studenti.

### Statistiche Insegnanti
```http
GET /api/teachers?include_non_teaching=false
```
Restituisce statistiche per gli insegnanti.
- `include_non_teaching`: include anche chi non insegna ancora (default: false)

### Analisi Comparativa
```http
GET /api/comparison
```
Confronto tra studenti e insegnanti sulle domande speculari.

### Analisi Strumenti
```http
GET /api/tools
```
Top strumenti AI utilizzati da studenti e insegnanti.

## 📊 Dashboard Features

### Tab Panoramica
- Competenze AI: confronto pratico/teorico studenti vs insegnanti
- Fiducia e formazione: livelli di fiducia nell'integrazione AI
- Utilizzo AI: percentuali di utilizzo quotidiano
- Ore settimanali: analisi tempo dedicato

### Tab Confronto
- Domande speculari in dettaglio
- Visualizzazione differenze studenti/insegnanti
- Grafici comparativi per ogni domanda

### Tab Studenti
- Dati demografici (età, genere, tipo scuola)
- Competenze specifiche
- Preoccupazioni sull'AI

### Tab Insegnanti
- Dati demografici (età, genere, livello scuola)
- Status insegnamento
- Competenze e preoccupazioni

### Tab Strumenti
- Top 5 strumenti AI più utilizzati
- Confronto utilizzo studenti/insegnanti
- Grafici a barre orizzontali

## 🔧 Gestione Domande

### Domande Chiuse (Analizzate)
Il sistema analizza **solo domande chiuse** con:
- Scale numeriche (1-7)
- Risposte Sì/No
- Scelte multiple predefinite
- Ore di utilizzo

### Domande Aperte (Archiviate)
Le domande aperte sono salvate nel database ma **non analizzate** nei grafici:
- Esempi di prompt
- Motivazioni d'uso
- Pro e contro
- Suggerimenti miglioramento questionario

### Domande Speculari
Domande presenti in entrambi i questionari:
- Competenza pratica AI
- Competenza teorica AI
- Fiducia integrazione AI
- Adeguatezza formazione
- Utilizzo quotidiano AI
- Ore settimanali utilizzo

### Sottocategorie Insegnanti
- **Insegnanti attivi**: "Sì, insegno attualmente"
- **Non ancora insegnanti**: Altri status
- Filtro applicabile via query parameter `include_non_teaching`

## 🛠️ Sviluppo Locale

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
# Avvia solo PostgreSQL
docker-compose up -d db

# Connessione diretta
psql postgresql://user:password@localhost:5432/questionnaire_db
```

## 🐳 Comandi Docker Utili

```bash
# Ricostruisci le immagini
docker-compose build

# Riavvia un servizio specifico
docker-compose restart backend

# Ferma tutti i servizi
docker-compose down

# Ferma e rimuovi volumi (elimina dati DB)
docker-compose down -v

# Accedi al container backend
docker-compose exec backend bash

# Accedi al container database
docker-compose exec db psql -U user -d questionnaire_db
```

## 📈 Tecnologie Utilizzate

### Backend
- **FastAPI**: Framework web moderno per Python
- **SQLAlchemy**: ORM per database
- **Pandas**: Elaborazione dati Excel
- **PostgreSQL**: Database relazionale
- **Uvicorn**: Server ASGI

### Frontend
- **React 18**: Libreria UI
- **Vite**: Build tool veloce
- **Recharts**: Libreria grafici interattivi
- **Axios**: HTTP client

### DevOps
- **Docker**: Containerizzazione
- **Docker Compose**: Orchestrazione multi-container

## 🔍 Troubleshooting

### Errore connessione database
```bash
# Verifica che PostgreSQL sia avviato
docker-compose ps db

# Controlla i log
docker-compose logs db
```

### Errore import dati
```bash
# Verifica presenza file Excel
ls -la dati/

# Controlla permessi
chmod 644 dati/*.xlsx
```

### Frontend non si connette al backend
```bash
# Verifica CORS nel backend (già configurato)
# Controlla variabile ambiente
cat frontend/.env
```

### Porta già in uso
```bash
# Cambia porte in docker-compose.yml
# Esempio: "8001:8000" invece di "8000:8000"
```

## 📝 Note Importanti

1. **Privacy**: I dati sono anonimizzati tramite codici identificativi
2. **Domande Aperte**: Non vengono analizzate nei grafici ma sono disponibili nel database
3. **Filtri Insegnanti**: Di default analizza solo insegnanti attualmente attivi
4. **Aggiornamento Dati**: Usa il pulsante "Aggiorna" nella dashboard o richiama `/api/import`

## 🎨 Personalizzazione

### Cambiare colori dashboard
Modifica `frontend/src/components/Dashboard.css`:
```css
background: linear-gradient(135deg, #tuocolore1 0%, #tuocolore2 100%);
```

### Aggiungere nuove analisi
1. Aggiungi metodo in `backend/app/analytics.py`
2. Crea endpoint in `backend/app/main.py`
3. Consuma nel frontend via `axios`

## 📄 Licenza

Questo progetto è stato creato per CNR - Analisi questionari AI in ambito educativo.

---

**Creato con** ❤️ **utilizzando FastAPI, React e Docker**
