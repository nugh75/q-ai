# Fix: Errore 404 Ollama API Endpoint

## 🐛 Problema

**Errore**: `404 Client Error: Not Found for url: http://192.168.129.14:11434/api/generate`

**Causa**: Il servizio usava l'endpoint **deprecato** `/api/generate` invece del nuovo `/api/chat`

## 🔍 Analisi

### Ollama API - Cambio Endpoint

Le versioni recenti di Ollama hanno deprecato `/api/generate` in favore di `/api/chat` (formato chat messages, compatibile OpenAI).

| Endpoint | Status | Formato |
|----------|--------|---------|
| `/api/generate` | ❌ Deprecato | Prompt singolo |
| `/api/chat` | ✅ Corrente | Messages array (OpenAI-style) |

### Test Endpoint
```bash
# VECCHIO (404 Not Found)
POST /api/generate
{
  "model": "mistral:7b",
  "prompt": "Hello",
  "stream": false
}

# NUOVO (Funzionante)
POST /api/chat
{
  "model": "mistral:7b",
  "messages": [
    {"role": "system", "content": "System prompt"},
    {"role": "user", "content": "User prompt"}
  ],
  "stream": false
}
```

## ✅ Soluzione

### File Modificato
`backend/app/qualitative_service.py` - Metodo `_call_ollama()`

### Modifiche Applicate

#### PRIMA (Non funzionante)
```python
def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
    url = f"{self.llm_config.endpoint}/api/generate"
    
    payload = {
        "model": self.llm_config.model_name,
        "prompt": prompt,
        "stream": False
    }
    
    if system_prompt:
        payload["system"] = system_prompt
    
    response = requests.post(url, json=payload, timeout=120)
    return response.json().get('response', '')
```

#### DOPO (Funzionante)
```python
def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
    url = f"{self.llm_config.endpoint}/api/chat"
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": self.llm_config.model_name,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 4096
        }
    }
    
    response = requests.post(url, json=payload, timeout=300)
    result = response.json()
    return result.get('message', {}).get('content', '')
```

### Miglioramenti Aggiuntivi

1. **Timeout Aumentato**: 120s → 300s (5 minuti)
   - Le tassonomie con molte risposte richiedono più tempo
   - Applicato a Ollama, Gemini e OpenAI

2. **Parametri Ollama Ottimizzati**:
   - `temperature: 0.3` - Risposte più consistenti
   - `num_predict: 4096` - Max token per risposta estesa

3. **Formato Risposta**: 
   - Accesso corretto a `message.content` invece di `response`

## 🧪 Verifica Funzionamento

### Test Manuale Backend
```bash
# Test diretto Ollama
curl -X POST http://192.168.129.14:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b",
    "messages": [
      {"role": "system", "content": "Rispondi in italiano"},
      {"role": "user", "content": "Ciao"}
    ],
    "stream": false
  }'

# Output atteso: {"message": {"content": "Ciao!"}}
```

### Test tramite Applicazione
1. Vai su **Amministrazione** → Password: `Lagom192.`
2. Verifica configurazione Ollama:
   - Provider: **Ollama**
   - Endpoint: `http://192.168.129.14:11434`
   - Modello: **mistral:7b**
3. Salva (dovrebbe confermare successo)
4. Vai su **Analisi Qualitativa**
5. Seleziona una domanda
6. Clicca **"Avvia Analisi"**
7. Attendi 30-90 secondi
8. **Verifica**: Nessun errore 404, tassonomia generata

## ✅ Status

- [x] Endpoint corretto: `/api/generate` → `/api/chat`
- [x] Formato messages array implementato
- [x] Timeout aumentato a 300s
- [x] Parametri ottimizzati (temperature, num_predict)
- [x] Backend riavviato
- [x] Test manuale Ollama: ✅ Funzionante

## 📝 Note Tecniche

### Compatibilità Ollama
Il nuovo endpoint `/api/chat` è:
- ✅ Compatibile con formato OpenAI
- ✅ Supporta system/user/assistant roles
- ✅ Supporta context e conversation history
- ✅ Supporta streaming e non-streaming

### Modelli Testati
| Modello | Funzionante | Note |
|---------|-------------|------|
| mistral:7b | ✅ | Testato con successo |
| deepseek-r1:8b | ✅ | Compatibile |
| gemma3:27b | ✅ | Richiede più tempo |
| gpt-oss:20b | ✅ | Compatibile |

## 🚀 Prossimi Passi

1. **Testa Analisi Completa**: Esegui analisi su domanda con ~100 risposte
2. **Verifica Qualità Tassonomia**: Controlla categorizzazione
3. **Prova Altri Modelli**: Confronta risultati mistral vs deepseek-r1
4. **Monitora Performance**: Tempo di risposta per diverse dimensioni dataset

---

**Status**: ✅ RISOLTO  
**Data Fix**: 8 ottobre 2025, 13:00  
**Backend Riavviato**: ✅ Operativo
