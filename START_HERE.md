# 🚀 START HERE - Avvio Rapido Progetto

## ⚡ Quick Start (3 comandi)

```bash
# 1. Verifica setup
./test-setup.sh

# 2. Avvia applicazione
docker-compose up -d

# 3. Apri browser
open http://localhost:5173
# oppure visita manualmente: http://localhost:5173
```

**Fatto!** La dashboard sarà disponibile in ~30 secondi 🎉

---

## 📚 Documentazione Disponibile

| File | Descrizione |
|------|-------------|
| [README.md](README.md) | 📖 Documentazione completa del progetto |
| [QUICKSTART.md](QUICKSTART.md) | 🚀 Guida rapida avvio in 3 passi |
| [STRUCTURE.md](STRUCTURE.md) | 📁 Struttura dettagliata del progetto |
| [API_EXAMPLES.md](API_EXAMPLES.md) | 📡 Esempi utilizzo API con curl/Python/JS |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 🎯 Riepilogo completo features |

---

## 🔗 URLs Importanti

Dopo aver avviato con `docker-compose up -d`:

- **📊 Dashboard Frontend**: http://localhost:5173
- **🔌 API Backend**: http://localhost:8000
- **📚 API Docs (Swagger)**: http://localhost:8000/docs
- **🏥 Health Check**: http://localhost:8000/health

---

## 📦 Cosa Include Questo Progetto

### Backend (Python FastAPI)
- ✅ API REST per analisi questionari
- ✅ Parser Excel intelligente (domande chiuse/aperte)
- ✅ Database PostgreSQL
- ✅ Analisi statistiche (media, mediana, distribuzione)
- ✅ Confronto studenti vs insegnanti

### Frontend (React + Vite)
- ✅ Dashboard moderna con 5 tab
- ✅ Grafici interattivi (Recharts)
- ✅ Design accattivante (gradiente viola)
- ✅ Responsive mobile/tablet

### Docker
- ✅ 3 servizi: PostgreSQL, Backend, Frontend
- ✅ Volumi persistenti
- ✅ Hot reload per sviluppo

---

## 🎯 Funzionalità Principali

1. **Analisi Domande Chiuse** (scale 1-7, Sì/No, ore)
2. **Domande Speculari** (confronto studenti/insegnanti)
3. **Sottocategorie Insegnanti** (attivi vs non attivi)
4. **Top Strumenti AI** (ChatGPT, Claude, Gemini, ecc.)
5. **Statistiche Demografiche** (età, genere, scuola)

---

## 🛠️ Comandi Utili

### Makefile (Raccomandato)
```bash
make up      # Avvia
make down    # Ferma
make logs    # Visualizza log
make health  # Controlla stato
make clean   # Pulizia completa
```

### Docker Compose
```bash
docker-compose up -d           # Avvia in background
docker-compose logs -f         # Segui i log
docker-compose ps              # Stato servizi
docker-compose down            # Ferma tutto
docker-compose down -v         # Ferma e rimuovi dati
```

### Verifica
```bash
# Test setup
./test-setup.sh

# Health check API
curl http://localhost:8000/health

# Import dati
curl -X POST http://localhost:8000/api/import
```

---

## 📊 Dashboard - 5 Tab

### 1. Panoramica
- Confronto competenze AI
- Fiducia nell'integrazione
- Percentuali utilizzo
- Ore settimanali

### 2. Confronto
- Domande speculari dettagliate
- Differenze studenti/insegnanti
- Grafici per ogni domanda

### 3. Studenti
- Demografia
- Competenze
- Preoccupazioni

### 4. Insegnanti
- Demografia e status
- Competenze
- Preoccupazioni educative

### 5. Strumenti
- Top 5 strumenti studenti
- Top 5 strumenti insegnanti

---

## 🐛 Troubleshooting

### Porta già in uso?
Modifica `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Backend
  - "5174:5173"  # Frontend
```

### Database non risponde?
```bash
docker-compose restart db
docker-compose logs db
```

### Frontend non si connette?
Verifica `.env` in `frontend/`:
```
VITE_API_URL=http://localhost:8000
```

---

## 📁 Struttura Progetto

```
q-ai/
├── backend/          # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── analytics.py
│   │   └── excel_parser.py
│   └── Dockerfile
│
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       └── Dashboard.jsx
│   └── Dockerfile
│
├── dati/            # File Excel
│   ├── Studenti - Questionario -CNR.xlsx
│   └── Insegnati - Questionario - CNR.xlsx
│
└── docker-compose.yml
```

---

## 🎓 Tecnologie

- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Pandas
- **Frontend**: React 18, Vite, Recharts, Axios
- **Database**: PostgreSQL 15
- **DevOps**: Docker, Docker Compose

---

## 📞 Supporto

1. Leggi [README.md](README.md) per documentazione completa
2. Consulta [API_EXAMPLES.md](API_EXAMPLES.md) per esempi
3. Controlla logs: `docker-compose logs -f`
4. Verifica health: `curl http://localhost:8000/health`

---

## 🎉 Inizia Ora!

```bash
# Clona/naviga nella directory
cd q-ai

# Verifica setup
./test-setup.sh

# Avvia tutto
docker-compose up -d

# Aspetta 30 secondi, poi apri:
# http://localhost:5173
```

**Buon lavoro! 🚀**

---

**Versione**: 1.0.0  
**Data**: 2025-10-01  
**Progetto**: Analisi Questionari AI - CNR
