# 🚀 Guida Rapida - Analisi Questionari AI

## Avvio in 3 Passi

### 1. Avvia l'applicazione
```bash
docker-compose up -d
```

Attendere circa 30 secondi per il completamento dell'avvio.

### 2. Apri il browser
Vai su: **http://localhost:5173**

### 3. Esplora la dashboard
L'applicazione importerà automaticamente i dati e mostrerà la dashboard interattiva!

---

## 🎯 Cosa troverai

### 📊 Tab Panoramica
- Confronto competenze AI studenti vs insegnanti
- Livelli di fiducia nell'integrazione AI
- Percentuali di utilizzo quotidiano
- Ore settimanali dedicate all'AI

### 🔄 Tab Confronto
- Analisi dettagliata domande speculari
- Differenze tra studenti e insegnanti
- Grafici comparativi interattivi

### 🎓 Tab Studenti
- Dati demografici (età, genere, scuola)
- Competenze pratiche e teoriche
- Preoccupazioni sull'AI

### 👨‍🏫 Tab Insegnanti
- Dati demografici e status
- Competenze e formazione
- Preoccupazioni educative

### 🛠️ Tab Strumenti
- Top 5 strumenti AI più usati
- Confronto utilizzo studenti/insegnanti

---

## 🔧 Comandi Utili

### Fermare l'applicazione
```bash
docker-compose down
```

### Vedere i log
```bash
docker-compose logs -f
```

### Riavviare
```bash
docker-compose restart
```

### Ricostruire (dopo modifiche)
```bash
docker-compose up -d --build
```

---

## 📡 URLs Utili

- **Dashboard Frontend**: http://localhost:5173
- **API Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## ❓ Problemi Comuni

### La porta è già in uso?
Modifica le porte in `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Backend
  - "5174:5173"  # Frontend
```

### Database non si connette?
```bash
# Verifica status
docker-compose ps

# Riavvia il database
docker-compose restart db
```

### Dati non vengono importati?
```bash
# Importa manualmente
curl -X POST http://localhost:8000/api/import
```

---

## 💡 Tips

1. **Aggiorna i dati**: Usa il pulsante "↻ Aggiorna" nella dashboard
2. **Filtra insegnanti**: L'API esclude automaticamente chi non insegna ancora
3. **Esplora API**: Vai su http://localhost:8000/docs per testare gli endpoint
4. **Grafici interattivi**: Passa il mouse sui grafici per vedere dettagli

---

**Buon lavoro! 🎉**
