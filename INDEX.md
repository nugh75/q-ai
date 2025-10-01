# 📚 Indice Documentazione - Analisi Questionari AI CNR

Guida completa alla navigazione della documentazione del progetto.

---

## 🚀 Quick Links

| Per iniziare | Link |
|--------------|------|
| **Avvio Rapido (3 passi)** | [START_HERE.md](START_HERE.md) |
| **Guida Quick Start** | [QUICKSTART.md](QUICKSTART.md) |
| **Riepilogo Progetto** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |

---

## 📖 Documentazione Principale

### 1. [README.md](README.md)
📄 **Documentazione completa del progetto**
- Panoramica generale
- Caratteristiche
- Architettura
- Installazione e avvio
- Gestione domande chiuse/aperte
- Domande speculari
- Troubleshooting
- Note importanti

### 2. [START_HERE.md](START_HERE.md)
🎯 **Entry point - Inizia qui!**
- Quick start in 3 comandi
- URLs importanti
- Comandi utili
- Dashboard overview
- Troubleshooting rapido

### 3. [QUICKSTART.md](QUICKSTART.md)
⚡ **Guida rapida avvio**
- Avvio in 3 passi
- Cosa troverai nella dashboard
- Comandi utili
- Problemi comuni
- Tips pratici

---

## 🏗️ Architettura e Struttura

### 4. [STRUCTURE.md](STRUCTURE.md)
📁 **Struttura dettagliata progetto**
- Tree completo directory
- Flusso dei dati
- Struttura database
- Componenti frontend
- API endpoints
- Servizi Docker
- File configurazione

### 5. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
🎯 **Riepilogo completo features**
- Cosa è stato creato
- Funzionalità implementate
- Dashboard features
- API endpoints
- Tecnologie utilizzate
- Caratteristiche speciali
- Deliverable

---

## 💻 Sviluppo e API

### 6. [DEVELOPMENT.md](DEVELOPMENT.md)
🛠️ **Guida sviluppo completa**
- Setup ambiente sviluppo
- Aggiungere nuove analisi
- Personalizzare design
- Modificare parsing Excel
- Debug e testing
- Database management
- Build produzione
- Deploy
- Best practices

### 7. [API_EXAMPLES.md](API_EXAMPLES.md)
📡 **Esempi utilizzo API**
- Health check
- Import dati
- Statistiche studenti/insegnanti
- Analisi comparativa
- Strumenti AI
- Esempi Python
- Esempi JavaScript/Axios
- Troubleshooting API

---

## 🔧 File di Configurazione

### Docker
- [docker-compose.yml](docker-compose.yml) - Orchestrazione servizi
- [backend/Dockerfile](backend/Dockerfile) - Container backend
- [frontend/Dockerfile](frontend/Dockerfile) - Container frontend
- [.dockerignore](.dockerignore) - File esclusi da Docker

### Environment
- [backend/.env.example](backend/.env.example) - Config backend esempio
- [frontend/.env.example](frontend/.env.example) - Config frontend esempio

### Automation
- [Makefile](Makefile) - Comandi automatizzati
- [test-setup.sh](test-setup.sh) - Script verifica setup

### Git
- [.gitignore](.gitignore) - File esclusi da Git

---

## 📊 Codice Sorgente

### Backend (Python FastAPI)
- [backend/app/main.py](backend/app/main.py) - API REST endpoints
- [backend/app/models.py](backend/app/models.py) - Modelli database
- [backend/app/database.py](backend/app/database.py) - Config PostgreSQL
- [backend/app/excel_parser.py](backend/app/excel_parser.py) - Parser Excel
- [backend/app/analytics.py](backend/app/analytics.py) - Logica analisi
- [backend/requirements.txt](backend/requirements.txt) - Dipendenze

### Frontend (React + Vite)
- [frontend/src/App.jsx](frontend/src/App.jsx) - App principale
- [frontend/src/App.css](frontend/src/App.css) - Stili globali
- [frontend/src/components/Dashboard.jsx](frontend/src/components/Dashboard.jsx) - Dashboard UI
- [frontend/src/components/Dashboard.css](frontend/src/components/Dashboard.css) - Stili dashboard
- [frontend/package.json](frontend/package.json) - Dipendenze npm

---

## 📂 Dati

### File Excel
- [dati/Studenti - Questionario -CNR.xlsx](dati/Studenti%20-%20Questionario%20-CNR.xlsx)
- [dati/Insegnati - Questionario - CNR.xlsx](dati/Insegnati%20-%20Questionario%20-%20CNR.xlsx)

---

## 🎯 Percorsi Consigliati

### Per Utilizzatori
1. [START_HERE.md](START_HERE.md) - Avvio rapido
2. [QUICKSTART.md](QUICKSTART.md) - Guida uso dashboard
3. [README.md](README.md) - Dettagli funzionalità

### Per Sviluppatori
1. [STRUCTURE.md](STRUCTURE.md) - Comprendere architettura
2. [DEVELOPMENT.md](DEVELOPMENT.md) - Setup sviluppo
3. [API_EXAMPLES.md](API_EXAMPLES.md) - Esempi codice

### Per Project Manager
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview completo
2. [README.md](README.md) - Caratteristiche tecniche
3. [API_EXAMPLES.md](API_EXAMPLES.md) - Capacità API

---

## 📞 Supporto Rapido

### Problemi Comuni
- **Porta occupata**: Vedi [QUICKSTART.md](QUICKSTART.md#troubleshooting)
- **Database non risponde**: Vedi [README.md](README.md#troubleshooting)
- **Import dati fallito**: Vedi [README.md](README.md#troubleshooting)
- **CORS error**: Vedi [API_EXAMPLES.md](API_EXAMPLES.md#troubleshooting-api)

### Debug
- **Logs**: `docker-compose logs -f`
- **Health check**: `curl http://localhost:8000/health`
- **Test setup**: `./test-setup.sh`

### Comandi Frequenti
```bash
# Avvio
make up

# Stop
make down

# Logs
make logs

# Health
make health

# Import
make import
```

---

## 🔍 Cerca per Argomento

### Installazione
- [README.md](README.md#installazione-e-avvio)
- [QUICKSTART.md](QUICKSTART.md#avvio-in-3-passi)
- [START_HERE.md](START_HERE.md#quick-start)

### API
- [API_EXAMPLES.md](API_EXAMPLES.md) - Tutti gli esempi
- [README.md](README.md#api-endpoints) - Lista endpoint
- [STRUCTURE.md](STRUCTURE.md#api-endpoints) - Dettagli tecnici

### Dashboard
- [QUICKSTART.md](QUICKSTART.md#cosa-troverai) - Panoramica tab
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md#dashboard-features) - Features dettagliate
- [README.md](README.md#dashboard-features) - Descrizione completa

### Sviluppo
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guida completa
- [STRUCTURE.md](STRUCTURE.md#sviluppo) - Setup ambiente
- [API_EXAMPLES.md](API_EXAMPLES.md#esempi-python) - Codice esempio

### Docker
- [README.md](README.md#comandi-docker-utili) - Comandi Docker
- [STRUCTURE.md](STRUCTURE.md#servizi-docker) - Architettura
- [DEVELOPMENT.md](DEVELOPMENT.md#docker-production) - Produzione

### Database
- [STRUCTURE.md](STRUCTURE.md#struttura-database) - Schema
- [DEVELOPMENT.md](DEVELOPMENT.md#database) - Gestione
- [README.md](README.md#gestione-domande) - Organizzazione dati

---

## 📝 Changelog e Versioning

**Versione Corrente**: 1.0.0
**Data Rilascio**: 2025-10-01

### v1.0.0 - Rilascio Iniziale
- ✅ Backend FastAPI completo
- ✅ Frontend React con dashboard
- ✅ Database PostgreSQL
- ✅ Docker configuration
- ✅ Documentazione completa
- ✅ Analisi domande chiuse/speculari
- ✅ Filtri insegnanti
- ✅ Top strumenti AI

---

## 🎓 Glossario

- **Domande Chiuse**: Scale numeriche, Sì/No, scelte multiple
- **Domande Aperte**: Testo libero (salvato ma non visualizzato)
- **Domande Speculari**: Presenti in entrambi i questionari
- **Sottocategorie**: Insegnanti attivi vs non attivi
- **Hot Reload**: Aggiornamento automatico durante sviluppo

---

## 🌟 Quick Reference

### URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Comandi Make
```bash
make up       # Avvia
make down     # Ferma
make logs     # Logs
make health   # Status
make clean    # Reset
make test     # Verifica
make import   # Import dati
```

### File Chiave
- Avvio: [START_HERE.md](START_HERE.md)
- Sviluppo: [DEVELOPMENT.md](DEVELOPMENT.md)
- API: [API_EXAMPLES.md](API_EXAMPLES.md)
- Struttura: [STRUCTURE.md](STRUCTURE.md)

---

## 📧 Contatti e Risorse

- **Progetto**: Analisi Questionari AI - CNR
- **Versione**: 1.0.0
- **Data**: 2025-10-01

### Link Esterni
- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- Docker: https://docs.docker.com
- Recharts: https://recharts.org

---

**Naviga la documentazione usando i link sopra!** 📚

Per iniziare subito: [START_HERE.md](START_HERE.md) 🚀
