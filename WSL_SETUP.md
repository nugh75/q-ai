# 🐧 Configurazione WSL - CNR Questionari AI

**Environment**: Windows Subsystem for Linux (WSL2)
**IP WSL**: `192.168.129.14`
**Data**: 2 Ottobre 2025

---

## 🎯 **Problema Risolto**

Quando si usa WSL (Windows Subsystem for Linux), Docker gira all'interno di WSL ma il browser per accedere al frontend gira su Windows. Questo richiede una configurazione specifica dell'IP.

### **Architettura**
```
┌─────────────────────────────────┐
│         WINDOWS HOST            │
│                                 │
│  Browser: http://192.168.129.14:5180
│                                 │
│  ┌─────────────────────────┐   │
│  │         WSL2            │   │
│  │                         │   │
│  │  Docker Compose:        │   │
│  │  - Frontend: 5180       │   │
│  │  - Backend: 8118        │   │
│  │  - Database: 5433       │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## ⚙️ **Configurazione Applicata**

### **1. File .env**

```bash
# Database Configuration
DB_USER=user
DB_PASSWORD=password
DB_NAME=questionnaire_db
DB_PORT=5433

# Backend Configuration
BACKEND_PORT=8118
# IMPORTANTE: Include IP WSL per CORS
CORS_ORIGINS=http://192.168.129.14:5180,http://localhost:5180,http://localhost:5173

# Frontend Configuration
FRONTEND_PORT=5180
# IMPORTANTE: Frontend deve connettersi a IP WSL
VITE_API_URL=http://192.168.129.14:8118

# Cache Configuration
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
```

### **2. Files Modificati**

#### **Dashboard.jsx**
```javascript
// Aggiunto API_URL da environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

// Usato in fetch
fetch(`${API_URL}/api/overview`)
fetch(`${API_URL}/api/questions`)
```

#### **QuestionStats.jsx**
```javascript
// Aggiunto API_URL da environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

// Usato in fetch
let url = `${API_URL}/api/questions/${question.respondent_type}/${question.column_index}/stats`
```

---

## 🚀 **Come Usare**

### **Setup Iniziale**

1. **Trova il tuo IP WSL** (se diverso da 192.168.129.14):
```bash
# In WSL
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

2. **Aggiorna .env** con il tuo IP:
```bash
# Modifica questi valori
CORS_ORIGINS=http://TUO_IP_WSL:5180,http://localhost:5180
VITE_API_URL=http://TUO_IP_WSL:8118
```

3. **Rebuild containers**:
```bash
docker-compose down
docker-compose up -d --build
```

### **Accesso All'Applicazione**

**Da Windows (Browser):**
```
Frontend: http://192.168.129.14:5180
Backend API: http://192.168.129.14:8118
```

**Da WSL (Terminal/Curl):**
```
Frontend: http://localhost:5180
Backend API: http://localhost:8118
```

---

## ✅ **Verifica Funzionamento**

### **Test 1: Backend Health**
```bash
# Da WSL
curl http://192.168.129.14:8118/health

# Output atteso:
{
  "status": "healthy",
  "database": "connected",
  "student_responses": 270,
  "teacher_responses": 455
}
```

### **Test 2: CORS Configuration**
```bash
# Test CORS preflight
curl -H "Origin: http://192.168.129.14:5180" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://192.168.129.14:8118/api/students -v

# Verifica header:
# access-control-allow-origin: http://192.168.129.14:5180
```

### **Test 3: Frontend**
```bash
# Da WSL
curl -I http://192.168.129.14:5180

# Output atteso: HTTP/1.1 200 OK
```

### **Test 4: Browser (Da Windows)**
1. Apri: `http://192.168.129.14:5180`
2. Dashboard dovrebbe caricarsi
3. Verifica console browser (F12):
   - Nessun errore CORS
   - API calls a `http://192.168.129.14:8118`

---

## 🐛 **Troubleshooting**

### **Problema: "Network Error" nel Frontend**

**Causa**: Frontend cerca di connettersi a localhost invece di IP WSL

**Fix**:
```bash
# Verifica .env
cat .env | grep VITE_API_URL
# Deve essere: VITE_API_URL=http://192.168.129.14:8118

# Se errato, correggi e rebuild
docker-compose down
docker-compose up -d --build frontend
```

### **Problema: CORS Error**

**Causa**: IP WSL non incluso in CORS_ORIGINS

**Fix**:
```bash
# Verifica .env
cat .env | grep CORS_ORIGINS
# Deve includere: http://192.168.129.14:5180

# Se mancante, aggiungi e riavvia backend
docker-compose restart backend
```

### **Problema: IP WSL Cambiato**

WSL può cambiare IP dopo restart. Se l'applicazione smette di funzionare:

```bash
# 1. Trova nuovo IP
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1

# 2. Aggiorna .env con nuovo IP
nano .env

# 3. Rebuild
docker-compose down
docker-compose up -d --build
```

### **Problema: Container Non Raggiungibili da Windows**

**Causa**: Windows Firewall blocca connessioni WSL

**Fix Windows Firewall**:
```powershell
# In PowerShell Administrator (Windows)
New-NetFirewallRule -DisplayName "WSL" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
```

---

## 📝 **Note Importanti**

### **IP WSL vs Localhost**

| Contesto | URL da usare | Esempio |
|----------|--------------|---------|
| Browser Windows | IP WSL | http://192.168.129.14:5180 |
| Curl da WSL | localhost o IP WSL | http://localhost:8118 |
| Docker interno | localhost | http://localhost:8118 |
| VITE_API_URL | IP WSL | http://192.168.129.14:8118 |
| CORS_ORIGINS | IP WSL + localhost | http://192.168.129.14:5180,http://localhost:5180 |

### **Perché Servono Entrambi?**

- **IP WSL** (192.168.129.14): Per connessioni da Windows → WSL
- **localhost**: Per connessioni interne WSL e Docker

### **IP Statico vs Dinamico**

L'IP WSL può cambiare dopo:
- Restart di Windows
- Restart del servizio WSL
- Update di Windows

**Soluzione Permanente** (Opzionale):
```bash
# Crea script per auto-update .env
#!/bin/bash
# update-wsl-ip.sh

WSL_IP=$(ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1)
sed -i "s|VITE_API_URL=http://.*:8118|VITE_API_URL=http://$WSL_IP:8118|g" .env
sed -i "s|CORS_ORIGINS=http://.*:5180|CORS_ORIGINS=http://$WSL_IP:5180,http://localhost:5180|g" .env

echo "Updated .env with WSL IP: $WSL_IP"
docker-compose down
docker-compose up -d --build
```

---

## 🔄 **Workflow Tipico WSL**

### **Sviluppo Quotidiano**

```bash
# 1. Avvia WSL (da Windows)
wsl

# 2. Vai al progetto
cd /home/nugh75/q-ai

# 3. Verifica IP (se necessario)
ip addr show eth0 | grep "inet\b"

# 4. Start servizi
docker-compose up -d

# 5. Apri browser Windows
# http://192.168.129.14:5180
```

### **Dopo Restart Windows**

```bash
# 1. Controlla se IP è cambiato
ip addr show eth0 | grep "inet\b"

# 2. Se cambiato, aggiorna .env
nano .env

# 3. Rebuild
docker-compose down
docker-compose up -d --build
```

---

## 📚 **Risorse WSL**

### **Comandi Utili WSL**

```bash
# Riavvia WSL (da PowerShell Windows)
wsl --shutdown

# Lista distribuzioni
wsl --list --verbose

# Trova IP WSL (da WSL)
hostname -I

# Trova IP WSL (da Windows PowerShell)
wsl hostname -I
```

### **Port Forwarding (Alternativa)**

Se preferisci usare localhost anche da Windows:

```powershell
# Da PowerShell Administrator (Windows)
netsh interface portproxy add v4tov4 listenport=8118 listenaddress=0.0.0.0 connectport=8118 connectaddress=192.168.129.14
netsh interface portproxy add v4tov4 listenport=5180 listenaddress=0.0.0.0 connectport=5180 connectaddress=192.168.129.14

# Poi in .env puoi usare localhost
VITE_API_URL=http://localhost:8118
CORS_ORIGINS=http://localhost:5180
```

---

## ✅ **Checklist Setup WSL**

- [x] IP WSL identificato: `192.168.129.14`
- [x] .env configurato con IP WSL
- [x] CORS_ORIGINS include IP WSL
- [x] VITE_API_URL usa IP WSL
- [x] Dashboard.jsx usa API_URL da env
- [x] QuestionStats.jsx usa API_URL da env
- [x] Docker containers in running
- [x] Backend risponde a IP WSL
- [x] Frontend accessibile da Windows
- [x] CORS test passed

---

## 🎉 **Status**

✅ **Configurazione WSL Completata e Testata**

**Accesso Applicazione**:
- Frontend: http://192.168.129.14:5180
- Backend: http://192.168.129.14:8118
- API Docs: http://192.168.129.14:8118/docs

**Prossimi Passi**:
1. Apri browser Windows
2. Vai a http://192.168.129.14:5180
3. Verifica che tutto funzioni

---

**Ultimo Update**: 2 Ottobre 2025
**IP WSL Configurato**: 192.168.129.14
**Versione**: v3.0.0-rc1
