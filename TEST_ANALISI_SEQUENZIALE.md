# 🧪 Test Rapido Analisi Sequenziale

## Come testare la nuova funzionalità

### 1. Accedi all'applicazione
```
http://localhost:5180/dashboard
```

### 2. Vai in Analisi Qualitativa
Click sul menu "Analisi Qualitativa"

### 3. Apri il nuovo tab
Click su **"Analisi Sequenziale 🚀"**

### 4. Seleziona domande
- [x] Seleziona 2-3 domande usando le checkbox
- Vedrai il riepilogo: "✓ Selezionate X domande - Y risposte"

### 5. Scegli template
Dal dropdown seleziona il tipo di analisi (es: "PRO e CONTRO")

### 6. Avvia!
Click su **"Avvia Analisi Sequenziale"**

### 7. Osserva il progresso
Vedrai:
- Barra progresso generale
- Domanda corrente in elaborazione
- Lista domande con stato (⏳→🔄→✅)

### 8. Risultati
Quando completa:
- Vedrai riepilogo (X completate, Y errori)
- Click "Vedi Risultati" per aprire l'analisi
- Click "Nuova Analisi Sequenziale" per ricominciare

## ⚡ Test Veloce (2 minuti)

1. Tab "Analisi Sequenziale"
2. Seleziona 2 domande qualsiasi
3. Template: qualunque
4. Click "Avvia"
5. Aspetta completamento
6. ✅ Successo!

## 🔍 Cosa verificare

- [ ] Tab switcher funziona
- [ ] Checkbox selezionano/deselezionano domande
- [ ] Riepilogo mostra conteggi corretti
- [ ] Template dropdown funziona
- [ ] Pulsante avvia si abilita con 2+ domande
- [ ] Progresso si aggiorna in tempo reale
- [ ] Stati domande cambiano correttamente
- [ ] Risultati finali mostrano link funzionanti
- [ ] "Vedi Risultati" apre analisi nel tab singolo
- [ ] Analisi salvate vengono aggiornate

## 🐛 Risoluzione problemi

**Problema:** Nessuna domanda disponibile
- **Soluzione:** Assicurati che nel database ci siano risposte a domande aperte

**Problema:** Errore durante generazione tassonomia
- **Soluzione:** Verifica che LLM (Ollama) sia attivo e raggiungibile

**Problema:** Classificazione lenta
- **Soluzione:** Normale, vengono processate 30 risposte alla volta

## 📊 Tempistiche Attese

- **2 domande con ~500 risposte/ciascuna:** ~3-4 minuti
- **3 domande con ~1000 risposte/ciascuna:** ~8-10 minuti
- **5 domande con ~500 risposte/ciascuna:** ~7-8 minuti

Dipende da:
- Velocità LLM
- Numero risposte
- Complessità domande

## ✅ Test Completato!

Se tutto funziona, sei pronto per usare l'analisi sequenziale in produzione! 🚀
