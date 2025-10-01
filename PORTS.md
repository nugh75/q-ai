# 🔌 Configurazione Porte

## Porte Assegnate

Per evitare conflitti con altri servizi Docker in esecuzione, sono state configurate le seguenti porte:

```
┌──────────────────┬──────────────┬────────────────┐
│ Servizio         │ Porta Host   │ Porta Container│
├──────────────────┼──────────────┼────────────────┤
│ PostgreSQL       │ 5433         │ 5432           │
│ Backend API      │ 8118         │ 8000           │
│ Frontend         │ 5180         │ 5173           │
└──────────────────┴──────────────┴────────────────┘
```

## URLs Disponibili

Dopo l'avvio con `docker-compose up -d`:

- **🎨 Dashboard Frontend**: http://localhost:5180
- **🔌 Backend API**: http://localhost:8118
- **📚 API Documentation**: http://localhost:8118/docs
- **🏥 Health Check**: http://localhost:8118/health

## Perché Queste Porte?

Le porte originali (5432, 8000, 5173) erano già occupate da altri progetti Docker:
- **5432**: PostgreSQL di altri progetti (pef, poggi, qsa-chatbot4, n8n)
- **8000**: Backend di vari chatbot
- **5173**: Frontend di altri progetti

## Connessione Database Esterna

Se vuoi connetterti al database PostgreSQL da un client esterno:

```bash
psql postgresql://user:password@localhost:5433/questionnaire_db
```

O con variabili separate:
```
Host:     localhost
Port:     5433
Database: questionnaire_db
User:     user
Password: password
```

## Modifica Porte

Per cambiare le porte, modifica [docker-compose.yml](docker-compose.yml):

```yaml
services:
  db:
    ports:
      - "TUA_PORTA:5432"  # Cambia TUA_PORTA
  
  backend:
    ports:
      - "TUA_PORTA:8000"  # Cambia TUA_PORTA
    environment:
      # Nota: la porta interna rimane 8000
  
  frontend:
    ports:
      - "TUA_PORTA:5173"  # Cambia TUA_PORTA
    environment:
      VITE_API_URL: http://localhost:TUA_PORTA_BACKEND
```

Poi aggiorna anche:
- [frontend/.env](frontend/.env)
- [frontend/src/App.jsx](frontend/src/App.jsx)
- [Makefile](Makefile)

## Verifica Porte Libere

Prima di avviare, verifica che le porte siano libere:

```bash
# Linux/Mac
lsof -i :5433
lsof -i :8118
lsof -i :5180

# Oppure con netstat
netstat -tuln | grep -E '5433|8118|5180'
```

Se una porta è occupata, vedrai un output. Altrimenti è libera.

## Conflitti di Rete

Se ottieni errori tipo:
```
Error: bind: address already in use
```

Significa che la porta è già occupata. Puoi:

1. **Fermare il servizio che la usa**:
   ```bash
   docker ps  # Trova il container
   docker stop CONTAINER_ID
   ```

2. **Cambiare porta** nel docker-compose.yml

3. **Usare un'altra porta libera**

## Note di Sicurezza

⚠️ **Le porte sono esposte su 0.0.0.0** (tutte le interfacce di rete).

Per limitare l'accesso solo a localhost, modifica docker-compose.yml:

```yaml
ports:
  - "127.0.0.1:5433:5432"  # Solo localhost
  - "127.0.0.1:8118:8000"  # Solo localhost
  - "127.0.0.1:5180:5173"  # Solo localhost
```

## Quick Reference

```bash
# Avvia
docker-compose up -d

# Verifica porte
docker-compose ps

# Test connessione
curl http://localhost:8118/health

# Logs
docker-compose logs -f

# Ferma
docker-compose down
```

---

**Ultima modifica**: 2025-10-01
