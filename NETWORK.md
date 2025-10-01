# 🌐 Configurazione Rete - Accesso Remoto

## 📍 Configurazione Attuale

**Server IP**: `192.168.129.14`

### URLs Accessibili

- **Frontend Dashboard**: http://192.168.129.14:5180
- **Backend API**: http://192.168.129.14:8118
- **API Documentation**: http://192.168.129.14:8118/docs
- **Health Check**: http://192.168.129.14:8118/health

---

## 🔧 Configurazione per Accesso Remoto

Il sistema è configurato per essere accessibile da altri PC sulla rete locale.

### File Configurati

1. **[docker-compose.yml](docker-compose.yml)**
   ```yaml
   frontend:
     environment:
       VITE_API_URL: http://192.168.129.14:8118
   ```

2. **[frontend/.env](frontend/.env)**
   ```
   VITE_API_URL=http://192.168.129.14:8118
   ```

3. **[frontend/src/App.jsx](frontend/src/App.jsx)**
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.129.14:8118'
   ```

---

## 🔥 Configurazione Firewall

### Linux (ufw)
```bash
sudo ufw allow 5180/tcp comment 'Questionari Frontend'
sudo ufw allow 8118/tcp comment 'Questionari Backend'
sudo ufw status
```

### Linux (firewalld)
```bash
sudo firewall-cmd --add-port=5180/tcp --permanent
sudo firewall-cmd --add-port=8118/tcp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

### Verifica Porte Aperte
```bash
# Dal server
sudo ss -tulpn | grep -E '5180|8118'

# Oppure
sudo netstat -tulpn | grep -E '5180|8118'
```

---

## 🖥️ Accesso da PC Remoto

### 1. Apri Browser
Vai su: http://192.168.129.14:5180

### 2. Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 3. Verifica Connessione
Apri Console Browser (`F12`) ed esegui:
```javascript
fetch('http://192.168.129.14:8118/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Error:', e))
```

---

## 🔄 Cambio IP Server

Se l'IP del server cambia (es. nuovo DHCP), segui questi passi:

### 1. Trova Nuovo IP
```bash
# Linux
ip addr show

# Oppure
hostname -I

# Mac
ifconfig | grep "inet "
```

### 2. Aggiorna Configurazione

**docker-compose.yml**:
```yaml
frontend:
  environment:
    VITE_API_URL: http://NUOVO_IP:8118
```

**frontend/.env**:
```
VITE_API_URL=http://NUOVO_IP:8118
```

**frontend/src/App.jsx**:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://NUOVO_IP:8118'
```

### 3. Riavvia Frontend
```bash
docker-compose restart frontend
```

### 4. Hard Refresh Browser
`Ctrl + Shift + R` su tutti i PC client

---

## 🏠 Uso di Hostname invece di IP

### Vantaggi
- Non serve modificare configurazione quando cambia IP
- Più facile da ricordare
- Migliore per produzione

### Configurazione DNS Locale

#### Opzione 1: File /etc/hosts (Client)
Su ogni PC client, modifica `/etc/hosts`:
```
192.168.129.14  questionnaire.local
```

Windows: `C:\Windows\System32\drivers\etc\hosts`

Poi usa: http://questionnaire.local:5180

#### Opzione 2: DNS Server Locale
Configura record A nel tuo router/DNS:
```
questionnaire.local → 192.168.129.14
```

#### Opzione 3: mDNS (Avahi/Bonjour)
Usa il nome del server:
```
http://nome-server.local:5180
```

---

## 🔒 Sicurezza Rete Locale

### ⚠️ Note di Sicurezza

1. **Nessuna Autenticazione**: L'app non ha login/password
2. **HTTP non HTTPS**: Traffico non criptato
3. **Porte Aperte**: Accessibile a chiunque sulla rete

### Per Produzione / Internet

#### 1. Aggiungi HTTPS
```bash
# Usa reverse proxy (Nginx/Traefik)
# Con Let's Encrypt per certificati SSL
```

#### 2. Aggiungi Autenticazione
```python
# FastAPI con OAuth2/JWT
from fastapi.security import HTTPBearer
```

#### 3. Firewall Restrittivo
```bash
# Permetti solo IP specifici
sudo ufw allow from 192.168.129.0/24 to any port 5180
sudo ufw allow from 192.168.129.0/24 to any port 8118
```

#### 4. VPN per Accesso Remoto
Usa WireGuard o OpenVPN invece di esporre porte

---

## 🧪 Troubleshooting Rete

### Problema: Impossibile Connettersi dal PC Remoto

#### 1. Verifica Server Raggiungibile
```bash
# Dal PC remoto
ping 192.168.129.14

# Se fallisce: problema di rete/routing
```

#### 2. Verifica Porte Aperte
```bash
# Dal PC remoto
telnet 192.168.129.14 5180
telnet 192.168.129.14 8118

# O con nc
nc -zv 192.168.129.14 5180
nc -zv 192.168.129.14 8118
```

#### 3. Verifica Firewall Server
```bash
# Sul server
sudo ufw status verbose

# Temporaneamente disabilita per test
sudo ufw disable
# Test connessione
sudo ufw enable
```

#### 4. Verifica Container in Ascolto
```bash
# Sul server
docker-compose ps
netstat -tuln | grep -E '5180|8118'
```

#### 5. Test Backend Diretto
```bash
# Dal PC remoto
curl http://192.168.129.14:8118/health
```

### Problema: CORS Error

Se vedi errori CORS nella console browser:

1. Verifica CORS in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK per rete locale
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. Riavvia backend:
```bash
docker-compose restart backend
```

### Problema: Cache Browser

Soluzione rapida:
1. `Ctrl + Shift + R` (hard refresh)
2. Oppure modalità Incognito
3. Oppure cancella completamente cache browser

---

## 📊 Monitoraggio Connessioni

### Logs in Tempo Reale
```bash
# Tutte le connessioni
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Connessioni Attive
```bash
# Sul server
sudo ss -tupn | grep -E '5180|8118'
```

### Bandwidth Usage
```bash
# Installa iftop
sudo apt install iftop

# Monitor
sudo iftop -i eth0
```

---

## 🎯 Quick Reference

### URLs
```
Frontend:  http://192.168.129.14:5180
Backend:   http://192.168.129.14:8118
API Docs:  http://192.168.129.14:8118/docs
```

### Comandi Utili
```bash
# Riavvia tutto
docker-compose restart

# Riavvia solo frontend
docker-compose restart frontend

# Verifica IP server
hostname -I

# Test connessione
curl http://192.168.129.14:8118/health

# Verifica firewall
sudo ufw status
```

### Test da PC Remoto
```bash
# Ping
ping 192.168.129.14

# Test porta frontend
nc -zv 192.168.129.14 5180

# Test porta backend
nc -zv 192.168.129.14 8118

# Test API
curl http://192.168.129.14:8118/health
```

---

## 📱 Accesso da Mobile

L'applicazione è responsive e funziona anche su smartphone/tablet:

1. Connetti dispositivo alla stessa rete WiFi
2. Apri browser mobile
3. Vai su: http://192.168.129.14:5180

---

## 🔄 Backup Configurazione

Salva questi file per backup:
```bash
cp docker-compose.yml docker-compose.yml.backup
cp frontend/.env frontend/.env.backup
```

---

**Ultima modifica**: 2025-10-01
**Server IP**: 192.168.129.14
**Porte**: 5180 (Frontend), 8118 (Backend), 5433 (PostgreSQL)
