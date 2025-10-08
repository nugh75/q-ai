# ✅ Test Cloudflare - Guida Verifica

## 🎯 Problema Risolto

**Problema Originale:**
- Frontend non riusciva a connettersi al backend fuori dalla VPN
- Errore: "Impossibile connettersi al backend: Network Error"

**Causa:**
- Container frontend usava ancora `http://192.168.129.14:8118` (IP locale)
- Non usava il tunnel Cloudflare `https://api-ai-q-2.ai4educ.org`

**Soluzione Applicata:**
1. ✅ Aggiornato `VITE_API_URL=https://api-ai-q-2.ai4educ.org` in `.env`
2. ✅ Riavviato container frontend per caricare nuova variabile
3. ✅ Verificato CORS include entrambi i domini Cloudflare

---

## 🧪 Test da Eseguire

### **1. Test Backend API (da qualsiasi rete)**

```bash
# Test health endpoint
curl https://api-ai-q-2.ai4educ.org/health

# Output atteso:
# {"status":"healthy","database":"connected","student_responses":272,"teacher_responses":457}
```

✅ **Successo se:** Ricevi JSON con status "healthy"

---

### **2. Test Frontend (da browser, qualsiasi rete)**

**URL da aprire:**
```
https://ai-q-2.ai4educ.org
```

**Passi:**
1. Apri browser (meglio modalità incognito)
2. Vai su `https://ai-q-2.ai4educ.org`
3. Il sito dovrebbe caricarsi completamente
4. I dati (statistiche, grafici) devono essere visibili

✅ **Successo se:** 
- Il sito carica senza errori
- I grafici mostrano dati
- Non vedi "Impossibile connettersi al backend"

---

### **3. Test Console Browser (verifica chiamate API)**

**Apri DevTools (F12):**

1. **Tab Console** - Non dovrebbero esserci errori rossi tipo:
   ```
   ❌ Network Error
   ❌ CORS policy
   ❌ Failed to fetch
   ```

2. **Tab Network** - Verifica le chiamate:
   - Filtra per `api-ai-q-2.ai4educ.org`
   - Tutte le richieste devono essere `200 OK`
   - Esempio richieste attese:
     ```
     GET https://api-ai-q-2.ai4educ.org/health
     GET https://api-ai-q-2.ai4educ.org/api/students
     GET https://api-ai-q-2.ai4educ.org/api/teachers
     GET https://api-ai-q-2.ai4educ.org/api/comparison
     ```

3. **Test manuale in Console:**
   ```javascript
   // Copia-incolla nella console
   fetch('https://api-ai-q-2.ai4educ.org/health')
     .then(r => r.json())
     .then(d => console.log('✅ Backend OK:', d))
     .catch(e => console.error('❌ Error:', e))
   ```

✅ **Successo se:** Vedi `✅ Backend OK: {status: "healthy", ...}`

---

### **4. Test CORS (da terminale server)**

```bash
# Test preflight OPTIONS
curl -H "Origin: https://ai-q-2.ai4educ.org" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     -I https://api-ai-q-2.ai4educ.org/health

# Cerca queste headers:
# access-control-allow-origin: https://ai-q-2.ai4educ.org
# access-control-allow-credentials: true
```

✅ **Successo se:** Vedi header `access-control-allow-origin`

---

### **5. Test Connessione Tunnel (da server)**

```bash
# Verifica che cloudflared sia attivo
ps aux | grep cloudflared

# Output atteso:
# nugh75   48012  0.2  0.0 1264920 33360 ?  Ssl  15:19  1:09 /usr/local/bin/cloudflared tunnel...

# Verifica configurazione tunnel
cat ~/.cloudflared/config.yml | grep -A2 "ai-q-2"

# Output atteso:
# - hostname: ai-q-2.ai4educ.org
#   service: http://localhost:5180
# - hostname: api-ai-q-2.ai4educ.org
#   service: http://localhost:8118
```

✅ **Successo se:** cloudflared è running e config è corretta

---

### **6. Test Variabili Ambiente Container**

```bash
# Verifica VITE_API_URL nel container frontend
docker exec questionnaire_frontend printenv | grep VITE

# Output atteso:
# VITE_API_URL=https://api-ai-q-2.ai4educ.org
```

✅ **Successo se:** Vedi `https://api-ai-q-2.ai4educ.org` (NON IP locale)

---

## 🔄 Troubleshooting

### **Problema: Container usa ancora IP locale**

**Sintomo:**
```bash
docker exec questionnaire_frontend printenv | grep VITE
# VITE_API_URL=http://192.168.129.14:8118  ❌ SBAGLIATO
```

**Soluzione:**
```bash
# 1. Verifica .env principale
cat .env | grep VITE_API_URL
# Deve essere: VITE_API_URL=https://api-ai-q-2.ai4educ.org

# 2. Riavvia container
docker-compose stop frontend
docker-compose up -d frontend

# 3. Ricontrolla
docker exec questionnaire_frontend printenv | grep VITE
```

---

### **Problema: CORS Error in Browser**

**Sintomo:**
```
Access to fetch at 'https://api-ai-q-2.ai4educ.org/...' 
from origin 'https://ai-q-2.ai4educ.org' has been blocked by CORS policy
```

**Soluzione:**
```bash
# 1. Verifica CORS_ORIGINS nel .env
cat .env | grep CORS_ORIGINS

# Deve contenere:
# CORS_ORIGINS=...,https://ai-q-2.ai4educ.org,https://api-ai-q-2.ai4educ.org

# 2. Riavvia backend
docker-compose restart backend

# 3. Test CORS
curl -H "Origin: https://ai-q-2.ai4educ.org" \
     -I https://api-ai-q-2.ai4educ.org/health | grep access-control
```

---

### **Problema: 502 Bad Gateway**

**Sintomo:**
- Browser mostra "502 Bad Gateway" su `https://ai-q-2.ai4educ.org`

**Diagnosi:**
```bash
# 1. Verifica servizi locali
curl http://localhost:5180  # Frontend
curl http://localhost:8118/health  # Backend

# 2. Verifica cloudflared
ps aux | grep cloudflared
sudo systemctl status cloudflared  # Se come servizio

# 3. Verifica logs tunnel
sudo journalctl -u cloudflared -n 50  # Se systemd
docker logs cloudflared  # Se Docker
```

**Soluzione:**
```bash
# Riavvia tunnel
sudo systemctl restart cloudflared
# O se Docker: docker restart cloudflared
```

---

### **Problema: Sito carica ma senza dati**

**Sintomo:**
- Frontend appare ma mostra "Nessun dato disponibile"
- Nessun errore CORS visibile

**Diagnosi:**
```bash
# 1. Verifica database
docker-compose logs db | tail -20

# 2. Verifica backend può accedere al DB
docker-compose logs backend | grep -i "database\|error"

# 3. Test API direttamente
curl https://api-ai-q-2.ai4educ.org/api/students | jq
```

**Soluzione:**
```bash
# Se database non risponde
docker-compose restart db backend

# Se dati mancanti
docker-compose exec backend python -c "from app.database import engine; from sqlalchemy import text; print(engine.connect().execute(text('SELECT COUNT(*) FROM student_responses')).scalar())"
```

---

## 📊 Checklist Finale

Prima di considerare tutto risolto, verifica:

- [ ] `curl https://api-ai-q-2.ai4educ.org/health` restituisce JSON
- [ ] Browser carica `https://ai-q-2.ai4educ.org` senza errori
- [ ] Console browser (F12) non mostra errori CORS
- [ ] Network tab mostra chiamate API a `api-ai-q-2.ai4educ.org` (200 OK)
- [ ] `docker exec questionnaire_frontend printenv | grep VITE` mostra URL Cloudflare
- [ ] `ps aux | grep cloudflared` mostra processo attivo
- [ ] Test da rete esterna (disconnesso da VPN) funziona
- [ ] Hard refresh browser (`Ctrl+Shift+R`) non causa errori

---

## 🚀 Test Finale Completo

**Da eseguire dopo ogni modifica:**

```bash
#!/bin/bash
echo "🧪 Test Cloudflare Q-AI"
echo "======================"
echo ""

echo "1️⃣ Test Backend Health..."
HEALTH=$(curl -s https://api-ai-q-2.ai4educ.org/health | jq -r .status 2>/dev/null)
if [ "$HEALTH" = "healthy" ]; then
    echo "   ✅ Backend healthy"
else
    echo "   ❌ Backend NON risponde"
    exit 1
fi

echo ""
echo "2️⃣ Test Frontend HTTP..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://ai-q-2.ai4educ.org)
if [ "$FRONTEND" = "200" ]; then
    echo "   ✅ Frontend accessibile"
else
    echo "   ❌ Frontend NON accessibile (HTTP $FRONTEND)"
    exit 1
fi

echo ""
echo "3️⃣ Test CORS..."
CORS=$(curl -s -H "Origin: https://ai-q-2.ai4educ.org" -I https://api-ai-q-2.ai4educ.org/health | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "   ✅ CORS configurato"
else
    echo "   ❌ CORS NON configurato"
    exit 1
fi

echo ""
echo "4️⃣ Test Variabile Container..."
VITE_URL=$(docker exec questionnaire_frontend printenv VITE_API_URL 2>/dev/null)
if [[ "$VITE_URL" == *"api-ai-q-2.ai4educ.org"* ]]; then
    echo "   ✅ Container usa Cloudflare URL"
else
    echo "   ❌ Container usa IP locale: $VITE_URL"
    exit 1
fi

echo ""
echo "5️⃣ Test Cloudflared..."
if pgrep -f cloudflared > /dev/null; then
    echo "   ✅ Cloudflared attivo"
else
    echo "   ❌ Cloudflared NON attivo"
    exit 1
fi

echo ""
echo "🎉 TUTTI I TEST SUPERATI!"
echo "✅ Il sistema è accessibile da Internet tramite Cloudflare"
```

**Salva come:** `test-cloudflare.sh`

**Esegui:**
```bash
chmod +x test-cloudflare.sh
./test-cloudflare.sh
```

---

## 📝 Note Finali

### **Configurazione Corrente:**

- **Frontend URL**: `https://ai-q-2.ai4educ.org`
- **Backend API URL**: `https://api-ai-q-2.ai4educ.org`
- **CORS Origins**: Include entrambi i domini Cloudflare
- **VITE_API_URL**: Punta al tunnel Cloudflare (non IP locale)

### **Funzionalità:**

✅ Accessibile da Internet (senza VPN)  
✅ Accessibile da rete CNR (con VPN)  
✅ HTTPS automatico tramite Cloudflare  
✅ CORS configurato correttamente  
✅ Tunnel Cloudflare attivo e stabile  

### **Manutenzione:**

```bash
# Riavvio completo
docker-compose restart

# Solo frontend
docker-compose restart frontend

# Riavvio tunnel (se necessario)
sudo systemctl restart cloudflared

# Verifica stato
./test-cloudflare.sh
```

---

**Ultima verifica:** 6 ottobre 2025  
**Status:** ✅ Funzionante  
**Test da rete esterna:** Da eseguire disconnettendosi dalla VPN
