# Template Analisi Qualitativa - Guida Mappatura Domande

## 📋 Panoramica

Sono stati aggiunti **5 nuovi template** specifici per le domande del questionario sull'IA nell'educazione, portando il totale a **12 template**.

## 🆕 Nuovi Template Aggiunti

### 1. **Pro e Contro** (`pros_cons`)
**Descrizione**: Separa vantaggi e svantaggi dell'IA nell'educazione

**Categorie suggerite**:
- PRO: Efficienza
- PRO: Personalizzazione
- PRO: Accessibilità
- PRO: Creatività
- CONTRO: Dipendenza
- CONTRO: Privacy
- CONTRO: Superficialità
- CONTRO: Bias

**Ideale per domande**:
- ✅ "Pro e contro dell'IA" (355 risposte insegnanti, 268 studenti)

---

### 2. **Esempi Concreti** (`concrete_examples`)
**Descrizione**: Classifica esempi pratici di utilizzo IA per tipo di attività

**Categorie suggerite**:
- Ricerca
- Scrittura
- Correzione
- Spiegazioni
- Problem Solving
- Creazione Contenuti
- Valutazione
- Traduzione

**Ideale per domande**:
- ✅ "Esempi di prompt utilizzati" (201 studenti, 159 insegnanti)
- ✅ "Esempi specifici di utilizzo IA" (199 studenti, 156 insegnanti)
- ✅ "Esempi di personalizzazione apprendimento" (200 studenti)

---

### 3. **Barriere e Ostacoli** (`barriers`)
**Descrizione**: Identifica barriere specifiche all'adozione e uso efficace dell'IA

**Categorie suggerite**:
- Competenze
- Accesso
- Tempo
- Costi
- Politiche/Regole
- Affidabilità
- Complessità
- Privacy

**Ideale per domande**:
- ✅ "Difficoltà incontrate" (199 studenti, 156 insegnanti)
- ✅ "Perché non usi l'IA" (196 insegnanti, 69 studenti)

---

### 4. **Motivazioni** (`motivations`)
**Descrizione**: Classifica ragioni e motivazioni per scegliere/preferire certi strumenti o approcci

**Categorie suggerite**:
- Facilità Uso
- Qualità
- Velocità
- Gratuità
- Popolarità
- Funzionalità
- Affidabilità
- Integrazione

**Ideale per domande**:
- ✅ "Perché preferisci questi strumenti IA?" (200 studenti, 161 insegnanti)

---

### 5. **Cosa NON Fare** (`not_recommended`)
**Descrizione**: Identifica pratiche sconsigliate e errori da evitare nell'uso dell'IA

**Categorie suggerite**:
- Copia Acritica
- Uso Scorretto
- Fiducia Cieca
- Privacy
- Sostituzione Pensiero
- Dipendenza
- Altro

**Ideale per domande**:
- ✅ "Cosa non consiglieresti" (354 insegnanti, 261 studenti)

---

## 📊 Mappatura Domande → Template Consigliati

### Domande con Alta Copertura (>70% risposte)

| Domanda | N. Risposte | Template Consigliato | Template Alternativo |
|---------|-------------|----------------------|----------------------|
| **Pro e contro dell'IA** | 355 (insegnanti)<br>268 (studenti) | **pros_cons** ⭐ | sentiment, thematic |
| **Cosa non consiglieresti** | 354 (insegnanti)<br>261 (studenti) | **not_recommended** ⭐ | problems, barriers |
| **Come l'IA ha migliorato apprendimento/insegnamento** | 203 (studenti)<br>155 (insegnanti) | **learning_outcomes** | thematic, sentiment |
| **Esempi di prompt utilizzati** | 201 (studenti)<br>159 (insegnanti) | **concrete_examples** ⭐ | thematic |
| **Perché preferisci questi strumenti IA?** | 200 (studenti)<br>161 (insegnanti) | **motivations** ⭐ | thematic |
| **Esempi di personalizzazione** | 200 (studenti)<br>158 (insegnanti) | **concrete_examples** ⭐ | thematic |
| **Esempi specifici utilizzo IA** | 199 (studenti)<br>156 (insegnanti) | **concrete_examples** ⭐ | thematic |
| **Difficoltà incontrate** | 199 (studenti)<br>156 (insegnanti) | **barriers** ⭐ | problems |

### Domande con Media Copertura (40-70% risposte)

| Domanda | N. Risposte | Template Consigliato | Template Alternativo |
|---------|-------------|----------------------|----------------------|
| **Perché non usi l'IA** | 196 (insegnanti)<br>69 (studenti) | **barriers** ⭐ | thematic |
| **Individualizzazione insegnamento** | 157 (insegnanti)<br>27 (formazione) | **concrete_examples** | learning_outcomes |

---

## 🎯 Template Esistenti (7)

### 1. **Sentiment** (`sentiment`)
- Analisi del tono emotivo (positivo, negativo, neutro)
- 6 categorie: Molto Positivo → Molto Negativo
- **Usa per**: Domande generiche su percezioni/opinioni

### 2. **Tematico** (`thematic`)
- Identifica temi e argomenti principali
- 8 categorie personalizzate
- **Usa per**: Domande aperte generiche senza focus specifico

### 3. **Suggerimenti** (`suggestions`)
- Classifica proposte di miglioramento
- 7 categorie: Contenuti, Metodologia, Organizzazione...
- **Usa per**: Domande su "cosa miglioreresti"

### 4. **Problemi/Criticità** (`problems`)
- Identifica problemi tecnici/organizzativi/didattici
- 7 categorie: Tecnici, Contenuti, Organizzazione...
- **Usa per**: Domande su problemi generici (meno specifico di "barriers")

### 5. **Risultati Apprendimento** (`learning_outcomes`)
- Classifica competenze e conoscenze acquisite
- 6 categorie: Teoriche, Pratiche, Soft Skills...
- **Usa per**: "Cosa hai imparato", "Come è migliorato"

### 6. **Aspettative** (`expectations`)
- Classifica attese e bisogni
- 6 categorie: Contenuti, Metodi, Risultati...
- **Usa per**: Domande su aspettative future

### 7. **Personalizzata** (`custom`)
- Clustering automatico senza bias
- 8 categorie generate dall'LLM
- **Usa per**: Domande nuove/uniche senza template adatto

---

## 🔧 Come Scegliere il Template Giusto

### Step 1: Identifica il Focus della Domanda

**Valutazione Bilanciata** → `pros_cons`
- Pro e contro
- Vantaggi e svantaggi
- Lati positivi e negativi

**Esempi Pratici** → `concrete_examples`
- "Esempi di..."
- "Come hai usato..."
- "Casi specifici..."

**Ostacoli/Problemi** → `barriers` o `problems`
- "Difficoltà"
- "Perché non..."
- "Barriere" → usa `barriers` (più specifico)
- "Problemi generici" → usa `problems`

**Motivazioni/Ragioni** → `motivations`
- "Perché preferisci..."
- "Motivi per cui..."
- "Ragioni della scelta..."

**Cosa Evitare** → `not_recommended`
- "Cosa non consiglieresti"
- "Errori da evitare"
- "Pratiche sconsigliate"

**Apprendimento** → `learning_outcomes`
- "Cosa hai imparato"
- "Come è migliorato"
- "Competenze acquisite"

**Proposte** → `suggestions`
- "Suggerimenti"
- "Miglioramenti"
- "Consigli"

**Opinioni/Percezioni** → `sentiment`
- "Cosa pensi di..."
- "Come ti senti..."
- "Opinione su..."

### Step 2: Verifica Numero di Risposte

- **>200 risposte**: Tutti i template funzionano bene
- **100-200 risposte**: Preferire template con meno categorie (6-7)
- **<100 risposte**: Usa `custom` o riduci max_categories a 5-6

### Step 3: Testa e Raffina

1. Genera tassonomia con template consigliato
2. Rivedi categorie generate
3. Se non soddisfacente, prova template alternativo
4. Salva prompt personalizzato se necessario

---

## 📈 Esempi di Analisi Consigliate

### Analisi 1: "Pro e contro dell'IA" (Studenti, 268 risposte)
```
Template: pros_cons
Max Categories: 8
Output atteso: 
  - PRO: Velocizza ricerche
  - PRO: Aiuta a capire meglio
  - PRO: Disponibile 24/7
  - PRO: Personalizza spiegazioni
  - CONTRO: Rischio di copiare senza capire
  - CONTRO: Può dare info sbagliate
  - CONTRO: Dipendenza eccessiva
  - CONTRO: Limita creatività personale
```

### Analisi 2: "Esempi di prompt utilizzati" (Studenti, 201 risposte)
```
Template: concrete_examples
Max Categories: 8
Output atteso:
  - Ricerca e Sintesi: "Riassumi questo articolo"
  - Spiegazioni: "Spiega come se avessi 10 anni"
  - Problem Solving: "Aiutami a risolvere questo problema"
  - Correzione: "Correggi gli errori in questo testo"
  - Traduzione: "Traduci in italiano"
  - Creazione: "Genera idee per un progetto"
  - Programmazione: "Debug questo codice"
  - Studio: "Crea domande per esercitarmi"
```

### Analisi 3: "Difficoltà incontrate" (Studenti, 199 risposte)
```
Template: barriers
Max Categories: 8
Output atteso:
  - Mancanza Competenze: "Non so scrivere prompt efficaci"
  - Limiti Accesso: "La scuola blocca ChatGPT"
  - Inaffidabilità: "A volte dà risposte sbagliate"
  - Costi: "Le versioni avanzate costano"
  - Tempo: "Serve tempo per imparare bene"
  - Complessità: "Difficile capire come funziona"
  - Privacy: "Non so se i miei dati sono sicuri"
  - Regole Poco Chiare: "Non so quando posso usarlo"
```

---

## 🚀 Workflow Consigliato

### Per Ricercatore/Analista:

1. **Seleziona domanda** dal menu "Analisi Qualitativa"
2. **Consulta questa guida** per template consigliato
3. **Seleziona template** dal dropdown
4. **Genera tassonomia** (10-20 secondi)
5. **Rivedi categorie** e modifica se necessario
6. **Aggiungi/Rimuovi** categorie per precisione
7. **Classifica risposte** in batch da 30
8. **Esporta risultati** per ulteriore analisi

### Per Sviluppatore:

1. **Backup database** prima di grosse analisi
2. **Monitora log backend** per problemi LLM
3. **Ottimizza campionamento** se errori persistono
4. **Crea prompt custom** per casi specifici via Prompt Editor
5. **Testa nuovi template** su campioni piccoli

---

## 📝 Note Tecniche

### Ottimizzazioni Attive:
- ✅ Filtro risposte < 10 caratteri
- ✅ Campionamento casuale 50%
- ✅ Limite 50 risposte per LLM
- ✅ Max 8 categorie per tassonomia

### Limitazioni:
- Max 2048 token output LLM
- Timeout 300 secondi
- Batch size 30 risposte per classificazione

### Best Practices:
- Usa template specifici quando possibile
- Riduci max_categories per dataset grandi
- Salva tassonomie riutilizzabili
- Modifica categorie generate se non precise

---

## 🎓 Conclusione

Con 12 template disponibili, il sistema copre ora **tutte le domande principali** del questionario:

✅ Pro/Contro IA  
✅ Esempi pratici  
✅ Difficoltà/Barriere  
✅ Motivazioni  
✅ Cosa non fare  
✅ Miglioramenti  
✅ Suggerimenti  
✅ Sentiment  
✅ Temi  
✅ Aspettative  
✅ Risultati apprendimento  
✅ Analisi custom  

**Totale: 29 domande aperte** → **12 template specializzati** → **Copertura completa** 🎯
