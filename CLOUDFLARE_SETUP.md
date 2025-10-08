# 🌐 Configurazione Cloudflare Tunnel

## 📋 Panoramica

Questo documento descrive la configurazione completa per l'accesso al sistema tramite Cloudflare Tunnel.

---

## 🔗 URLs Configurati

### **Frontend**
- **URL Pubblico**: https://ai-q-2.ai4educ.org
- **Porta Locale**: 5180
- **Tunnel Target**: `http://localhost:5180`

### **Backend API**
- **URL Pubblico**: https://api-ai-q-2.ai4educ.org
- **Porta Locale**: 8118
- **Tunnel Target**: `http://localhost:8118`

---

## ⚙️ Configurazioni Applicate

### 1. **Backend CORS (`/home/nugh75/q-ai/.env`)**

```env
CORS_ORIGINS=http://192.168.129.14:5180,http://localhost:5180,http://localhost:5173,https://ai-q-2.ai4educ.org,https://api-ai-q-2.ai4educ.org
```

**Spiegazione:**
- Permette richieste da:
  - Rete locale (IP + localhost)
  - Dominio Cloudflare frontend (`ai-q-2.ai4educ.org`)
  - Dominio Cloudflare backend (`api-ai-q-2.ai4educ.org`) ← **Aggiunto per risolvere CORS**

### 2. **Frontend API URL**

**File**: `/home/nugh75/q-ai/frontend/.env`
```env
VITE_API_URL=https://api-ai-q-2.ai4educ.org
```

**File**: `/home/nugh75/q-ai/.env`
```env
VITE_API_URL=https://api-ai-q-2.ai4educ.org
```

**Spiegazione:**
- Il frontend chiama l'API tramite Cloudflare Tunnel
- HTTPS abilitato automaticamente da Cloudflare

### 3. **Vite Config (`frontend/vite.config.js`)**

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      'ai-q-2.ai4educ.org',
      '.ai4educ.org',
      '192.168.129.14'
    ]
  }
})
```

**Spiegazione:**
- `host: '0.0.0.0'`: Ascolta su tutte le interfacce (necessario per Docker + Cloudflare)
- `allowedHosts`: Whitelist per prevenire attacchi DNS rebinding
- `.ai4educ.org`: Permette tutti i sottodomini

---

## 🚀 Cloudflare Tunnel Configuration

### **Esempio `config.yml` per cloudflared**

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /path/to/credentials.json

ingress:
  # Frontend
  - hostname: ai-q-2.ai4educ.org
    service: http://localhost:5180
    originRequest:
      noTLSVerify: true
  
  # Backend API
  - hostname: api-ai-q-2.ai4educ.org
    service: http://localhost:8118
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      tlsTimeout: 10s
  
  # Catch-all (obbligatorio)
  - service: http_status:404
```

### **Headers CORS tramite Cloudflare (Opzionale)**

Se hai accesso alle **Transform Rules** di Cloudflare, puoi aggiungere:

**Response Headers:**
```
Access-Control-Allow-Origin: https://ai-q-2.ai4educ.org
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**Nota:** Con la configurazione CORS nel backend FastAPI, questo è opzionale.

---

## 🔄 Verifica Configurazione

### **1. Test Backend Diretto**

```bash
# Da server locale
curl http://localhost:8118/health

# Da Internet (via Cloudflare)
curl https://api-ai-q-2.ai4educ.org/health
```

**Output Atteso:**
```json
{
  "status": "healthy",
  "database": "connected",
  "student_responses": 1111,
  "teacher_responses": 455
}
```

### **2. Test Frontend**

```bash
# Apri browser
https://ai-q-2.ai4educ.org

# Verifica nella Console (F12)
fetch('https://api-ai-q-2.ai4educ.org/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Error:', e))
```

### **3. Test CORS**

```bash
# Da terminale
curl -H "Origin: https://ai-q-2.ai4educ.org" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api-ai-q-2.ai4educ.org/health
```

**Output Atteso:** Headers con `Access-Control-Allow-Origin`

---

## 🐛 Troubleshooting

### **Problema: "Blocked request" in Vite**

**Causa:** Host non in `allowedHosts`

**Soluzione:** Verifica `vite.config.js`:
```javascript
allowedHosts: [
  'ai-q-2.ai4educ.org',  // ← Deve esserci
  '.ai4educ.org'
]
```

### **Problema: CORS Error**

**Errore Browser:**
```
Access to fetch at 'https://api-ai-q-2.ai4educ.org/...' 
from origin 'https://ai-q-2.ai4educ.org' has been blocked by CORS policy
```

**Soluzione:**

1. **Verifica `.env` backend:**
   ```env
   CORS_ORIGINS=...,https://ai-q-2.ai4educ.org,https://api-ai-q-2.ai4educ.org
   ```

2. **Riavvia backend:**
   ```bash
   docker-compose restart backend
   ```

3. **Verifica logs:**
   ```bash
   docker-compose logs backend | grep CORS
   ```

### **Problema: 502 Bad Gateway**

**Causa:** Cloudflare non riesce a raggiungere il servizio locale

**Soluzioni:**

1. **Verifica tunnel attivo:**
   ```bash
   sudo systemctl status cloudflared
   # O per container
   docker ps | grep cloudflared
   ```

2. **Verifica servizi in ascolto:**
   ```bash
   sudo ss -tulpn | grep -E '5180|8118'
   ```

3. **Testa connessione diretta:**
   ```bash
   curl http://localhost:5180
   curl http://localhost:8118/health
   ```

### **Problema: Timeout / Lentezza**

**Causa:** Tunnel Cloudflare sotto carico o configurazione timeout

**Soluzione:** Aumenta timeout in `config.yml`:
```yaml
originRequest:
  connectTimeout: 60s
  tlsTimeout: 30s
  noHappyEyeballs: false
  keepAliveConnections: 100
```

---

## 📊 Monitoring

### **Cloudflare Dashboard**

1. Vai su: https://dash.cloudflare.com
2. Seleziona dominio `ai4educ.org`
3. **Traffic** → **Analytics** per vedere traffico
4. **Zero Trust** → **Tunnels** per stato tunnel

### **Logs Tunnel (Local)**

```bash
# Se cloudflared come servizio
sudo journalctl -u cloudflared -f

# Se cloudflared come container
docker logs -f cloudflared_container
```

### **Backend Logs**

```bash
docker-compose logs -f backend | grep -E "CORS|404|500"
```

---

## 🔐 Sicurezza

### **Considerazioni:**

1. **HTTPS Automatico:** Cloudflare gestisce certificati SSL/TLS
2. **DDoS Protection:** Inclusa di default
3. **Rate Limiting:** Configurato nel backend (10 req/min per IP)
4. **CORS Restrittivo:** Solo domini whitelisted
5. **Host Whitelist:** Solo domini autorizzati in Vite

### **Raccomandazioni Aggiuntive:**

#### **1. Aggiungi Autenticazione (Opzionale)**

Per API sensibili:
```python
# backend/app/main.py
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.get("/api/sensitive")
def sensitive_endpoint(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Verifica token JWT
    pass
```

#### **2. Cloudflare Access (Opzionale)**

Per limitare accesso solo a utenti CNR:
- **Zero Trust** → **Access** → **Applications**
- Crea policy per `ai-q-2.ai4educ.org`
- Configura email whitelisting

#### **3. WAF Rules**

In Cloudflare Dashboard:
- **Security** → **WAF**
- Abilita regole managed
- Aggiungi custom rules per protezione SQL injection, XSS

---

## 📝 Checklist Post-Configurazione

- [x] `CORS_ORIGINS` include `https://api-ai-q-2.ai4educ.org`
- [x] `VITE_API_URL` punta a `https://api-ai-q-2.ai4educ.org`
- [x] `allowedHosts` include `ai-q-2.ai4educ.org`
- [x] Backend e frontend riavviati
- [ ] Test frontend da browser esterno
- [ ] Test API da curl esterno
- [ ] Verifica CORS nella console browser
- [ ] Monitoring attivo su Cloudflare Dashboard

---

## 🆘 Support

### **Contatti:**

- **Cloudflare Support:** https://support.cloudflare.com
- **Documentazione Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### **Comandi Utili:**

```bash
# Restart tutto
docker-compose restart

# Rebuild e restart
docker-compose up -d --build

# Logs real-time
docker-compose logs -f

# Test connessioni
curl -v https://api-ai-q-2.ai4educ.org/health
curl -v https://ai-q-2.ai4educ.org
```

---

**Ultima modifica**: 6 ottobre 2025  
**Configurato per**: Cloudflare Tunnel con ai4educ.org  
**Porte**: 5180 (Frontend), 8118 (Backend)
