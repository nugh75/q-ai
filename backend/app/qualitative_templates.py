"""
Template per analisi qualitativa di diversi tipi di domande aperte
"""

# Template disponibili per analisi qualitativa
ANALYSIS_TEMPLATES = {
    "sentiment": {
        "name": "Analisi del Sentiment",
        "description": "Classifica le risposte in base al tono emotivo (positivo, negativo, neutro)",
        "system_prompt": """Sei un esperto di analisi del sentiment in lingua italiana.
Crea una tassonomia IN ITALIANO per classificare risposte in base al tono emotivo.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte IN ITALIANO e crea una tassonomia basata sul SENTIMENT.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di sentiment IN ITALIANO.
Esempi: Molto Positivo, Positivo, Neutro, Negativo, Molto Negativo, Misto/Ambivalente.

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: nome breve in italiano (max 30 caratteri)
- definition: definizione concisa in italiano (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi brevi in italiano

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Molto Positivo", "definition": "Entusiasmo e soddisfazione elevata", "keywords": ["eccellente", "fantastico", "ottimo"], "examples": ["È stato fantastico!"]}},
    {{"name": "Positivo", "definition": "Apprezzamento e soddisfazione", "keywords": ["buono", "bene", "utile"], "examples": ["Mi è piaciuto"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 6,
        "suggested_categories": ["Molto Positivo", "Positivo", "Neutro", "Negativo", "Molto Negativo", "Misto/Ambivalente"]
    },
    
    "thematic": {
        "name": "Analisi Tematica",
        "description": "Identifica i temi e argomenti principali nelle risposte",
        "system_prompt": """Sei un esperto di analisi tematica qualitativa in lingua italiana.
Crea una tassonomia IN ITALIANO per identificare i temi principali.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte IN ITALIANO e crea una tassonomia TEMATICA.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie tematiche IN ITALIANO basate sui contenuti.
Esempi: Metodologia Didattica, Materiali, Organizzazione, Valutazione, Contenuti, ecc.

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: nome del tema in italiano (max 30 caratteri)
- definition: descrizione in italiano (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi in italiano

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Metodologia Didattica", "definition": "Commenti su metodi di insegnamento", "keywords": ["lezione", "spiegazione", "approccio"], "examples": ["Le lezioni erano chiare"]}},
    {{"name": "Materiali Didattici", "definition": "Riferimenti a materiali e risorse", "keywords": ["slides", "dispense", "libro"], "examples": ["Le slides erano utili"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": []
    },
    
    "suggestions": {
        "name": "Analisi Suggerimenti",
        "description": "Classifica suggerimenti e proposte di miglioramento",
        "system_prompt": """Sei un esperto di analisi di feedback e suggerimenti in lingua italiana.
Crea una tassonomia IN ITALIANO per classificare suggerimenti.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte IN ITALIANO e crea una tassonomia per SUGGERIMENTI.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di suggerimenti (es: contenuti, organizzazione, strumenti, valutazione, comunicazione).
Per ogni categoria includi:
- name: tipo di suggerimento (max 30 caratteri)
- definition: descrizione breve (max 100 caratteri)
- keywords: 3-5 parole chiave
- examples: 1-2 esempi di suggerimenti

RISPOSTA RICHIESTA (JSON compatto):
{{
  "taxonomy": [
    {{"name": "Contenuti del Corso", "definition": "Suggerimenti su argomenti e materiali", "keywords": ["programma", "argomenti", "contenuti"], "examples": ["Aggiungere più esempi pratici"]}},
    {{"name": "Organizzazione", "definition": "Suggerimenti su struttura e tempi", "keywords": ["orari", "durata", "struttura"], "examples": ["Più tempo per le esercitazioni"]}}
  ]
}}

IMPORTANTE: 
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Focus su PROPOSTE/SUGGERIMENTI
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 7,
        "suggested_categories": ["Contenuti", "Metodologia", "Organizzazione", "Strumenti", "Valutazione", "Comunicazione", "Altro"]
    },
    
    "problems": {
        "name": "Analisi Problemi/Criticità",
        "description": "Identifica problemi, difficoltà e criticità segnalate",
        "system_prompt": """Sei un esperto di analisi dei problemi e troubleshooting.
Crea una tassonomia per classificare problemi e criticità.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte e crea una tassonomia per PROBLEMI/CRITICITÀ.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di problemi (es: tecnici, organizzativi, didattici, comunicazione, accesso).
Per ogni categoria includi:
- name: tipo di problema (max 30 caratteri)
- definition: descrizione breve (max 100 caratteri)
- keywords: 3-5 parole chiave
- examples: 1-2 esempi di problemi

RISPOSTA RICHIESTA (JSON compatto):
{{
  "taxonomy": [
    {{"name": "Problemi Tecnici", "definition": "Difficoltà con strumenti e tecnologia", "keywords": ["piattaforma", "connessione", "errore"], "examples": ["La piattaforma si blocca spesso"]}},
    {{"name": "Difficoltà Contenuti", "definition": "Problemi di comprensione dei contenuti", "keywords": ["difficile", "complesso", "non chiaro"], "examples": ["Gli argomenti sono troppo complessi"]}}
  ]
}}

IMPORTANTE: 
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Focus su PROBLEMI/CRITICITÀ
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 7,
        "suggested_categories": ["Problemi Tecnici", "Difficoltà Contenuti", "Organizzazione", "Comunicazione", "Accesso Risorse", "Valutazione", "Altro"]
    },
    
    "learning_outcomes": {
        "name": "Analisi Risultati di Apprendimento",
        "description": "Classifica cosa gli studenti hanno imparato o acquisito",
        "system_prompt": """Sei un esperto di valutazione dell'apprendimento.
Crea una tassonomia per classificare risultati di apprendimento e competenze acquisite.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte e crea una tassonomia per RISULTATI DI APPRENDIMENTO.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di apprendimento (es: conoscenze teoriche, competenze pratiche, soft skills, consapevolezza, autonomia).
Per ogni categoria includi:
- name: tipo di apprendimento (max 30 caratteri)
- definition: descrizione breve (max 100 caratteri)
- keywords: 3-5 parole chiave
- examples: 1-2 esempi

RISPOSTA RICHIESTA (JSON compatto):
{{
  "taxonomy": [
    {{"name": "Conoscenze Teoriche", "definition": "Acquisizione di concetti e teorie", "keywords": ["concetti", "teoria", "sapere"], "examples": ["Ho imparato le basi della statistica"]}},
    {{"name": "Competenze Pratiche", "definition": "Abilità operative e applicative", "keywords": ["pratica", "applicare", "fare"], "examples": ["So usare gli strumenti di analisi"]}}
  ]
}}

IMPORTANTE: 
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Focus su COSA È STATO APPRESO
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 6,
        "suggested_categories": ["Conoscenze Teoriche", "Competenze Pratiche", "Soft Skills", "Consapevolezza Critica", "Autonomia", "Motivazione"]
    },
    
    "expectations": {
        "name": "Analisi Aspettative",
        "description": "Classifica aspettative, attese e desideri espressi",
        "system_prompt": """Sei un esperto di analisi delle aspettative e needs assessment.
Crea una tassonomia per classificare aspettative e bisogni espressi.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte e crea una tassonomia per ASPETTATIVE.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di aspettative (es: contenuti, metodi, risultati, supporto, interazione).
Per ogni categoria includi:
- name: tipo di aspettativa (max 30 caratteri)
- definition: descrizione breve (max 100 caratteri)
- keywords: 3-5 parole chiave
- examples: 1-2 esempi

RISPOSTA RICHIESTA (JSON compatto):
{{
  "taxonomy": [
    {{"name": "Aspettative sui Contenuti", "definition": "Cosa si spera di imparare", "keywords": ["voglio", "spero", "mi aspetto"], "examples": ["Vorrei approfondire la programmazione"]}},
    {{"name": "Aspettative sui Metodi", "definition": "Come si spera di apprendere", "keywords": ["pratico", "interattivo", "coinvolgente"], "examples": ["Mi aspetto lezioni pratiche"]}}
  ]
}}

IMPORTANTE: 
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Focus su ASPETTATIVE/BISOGNI
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 6,
        "suggested_categories": ["Contenuti", "Metodi Didattici", "Risultati", "Supporto", "Interazione", "Valutazione"]
    },
    
    "pros_cons": {
        "name": "Analisi Pro e Contro",
        "description": "Separa vantaggi e svantaggi dell'IA nell'educazione",
        "system_prompt": """Sei un esperto di analisi critica e valutazione bilanciata.
Crea una tassonomia IN ITALIANO per classificare PRO e CONTRO dell'IA nell'educazione.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte su PRO e CONTRO dell'IA nell'educazione.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie che separano VANTAGGI e SVANTAGGI.
Esempi PRO: Efficienza, Personalizzazione, Accessibilità, Creatività, Supporto 24/7
Esempi CONTRO: Dipendenza, Privacy, Superficialità, Bias, Disuguaglianze

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: nome categoria pro/contro (max 30 caratteri, indica se è PRO o CONTRO)
- definition: descrizione concisa (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi dalle risposte

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "PRO: Efficienza", "definition": "L'IA velocizza compiti e ricerche", "keywords": ["veloce", "rapido", "risparmio tempo"], "examples": ["Risponde subito alle domande"]}},
    {{"name": "CONTRO: Dipendenza", "definition": "Rischio di affidarsi troppo all'IA", "keywords": ["dipendenza", "pigrizia", "delega"], "examples": ["Non penso più da solo"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Bilancia PRO e CONTRO (circa metà e metà)
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Indica sempre "PRO:" o "CONTRO:" nel nome
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": ["PRO: Efficienza", "PRO: Personalizzazione", "PRO: Accessibilità", "PRO: Creatività", "CONTRO: Dipendenza", "CONTRO: Privacy", "CONTRO: Superficialità", "CONTRO: Bias"]
    },
    
    "concrete_examples": {
        "name": "Analisi Esempi Concreti",
        "description": "Classifica esempi pratici di utilizzo IA per tipo di attività",
        "system_prompt": """Sei un esperto di analisi di casi d'uso e applicazioni pratiche.
Crea una tassonomia IN ITALIANO per classificare ESEMPI CONCRETI di utilizzo IA.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte con ESEMPI CONCRETI di utilizzo IA.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie basate sul TIPO DI ATTIVITÀ/USO.
Esempi: Ricerca Informazioni, Scrittura Testi, Correzione Errori, Creazione Contenuti, Problem Solving, Tutoring, Valutazione

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: tipo di utilizzo (max 30 caratteri)
- definition: descrizione dell'uso (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi concreti dalle risposte

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Ricerca e Sintesi", "definition": "Cercare info e riassumere contenuti", "keywords": ["cerca", "riassumi", "spiega"], "examples": ["Chiedo a ChatGPT di riassumere articoli"]}},
    {{"name": "Scrittura e Correzione", "definition": "Aiuto nella redazione e revisione testi", "keywords": ["scrivi", "correggi", "migliora"], "examples": ["Uso Quillbot per correggere grammatica"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Focus su AZIONI/ATTIVITÀ concrete
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": ["Ricerca", "Scrittura", "Correzione", "Spiegazioni", "Problem Solving", "Creazione Contenuti", "Valutazione", "Traduzione"]
    },
    
    "barriers": {
        "name": "Analisi Barriere e Ostacoli",
        "description": "Identifica barriere specifiche all'adozione e uso efficace dell'IA",
        "system_prompt": """Sei un esperto di change management e adozione tecnologica.
Crea una tassonomia IN ITALIANO per classificare BARRIERE e OSTACOLI all'uso dell'IA.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte su DIFFICOLTÀ e BARRIERE nell'uso dell'IA.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di BARRIERE/OSTACOLI.
Esempi: Competenze Tecniche, Accesso Strumenti, Tempo, Costi, Linee Guida, Fiducia, Complessità

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: tipo di barriera (max 30 caratteri)
- definition: descrizione ostacolo (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi concreti

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Mancanza di Competenze", "definition": "Non so come usare bene l'IA", "keywords": ["non so", "difficile", "incompetente"], "examples": ["Non so scrivere prompt efficaci"]}},
    {{"name": "Limiti di Accesso", "definition": "Problemi di disponibilità strumenti", "keywords": ["costo", "blocco", "non disponibile"], "examples": ["La scuola blocca ChatGPT"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Focus su OSTACOLI/PROBLEMI
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": ["Competenze", "Accesso", "Tempo", "Costi", "Politiche/Regole", "Affidabilità", "Complessità", "Privacy"]
    },
    
    "motivations": {
        "name": "Analisi Motivazioni",
        "description": "Classifica ragioni e motivazioni per scegliere/preferire certi strumenti o approcci",
        "system_prompt": """Sei un esperto di analisi motivazionale e decision-making.
Crea una tassonomia IN ITALIANO per classificare MOTIVAZIONI e RAGIONI.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte su PERCHÉ usano/preferiscono certi strumenti IA.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di MOTIVAZIONI.
Esempi: Facilità d'Uso, Risultati Migliori, Velocità, Gratuità, Conoscenza Pregressa, Raccomandazione, Funzionalità Specifiche

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: tipo di motivazione (max 30 caratteri)
- definition: descrizione della ragione (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi concreti

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Facilità d'Uso", "definition": "Strumento semplice e intuitivo", "keywords": ["facile", "semplice", "intuitivo"], "examples": ["ChatGPT è facilissimo da usare"]}},
    {{"name": "Qualità Risultati", "definition": "Produce output di alta qualità", "keywords": ["preciso", "accurato", "migliore"], "examples": ["Le risposte sono molto dettagliate"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Focus su PERCHÉ/RAGIONI
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": ["Facilità Uso", "Qualità", "Velocità", "Gratuità", "Popolarità", "Funzionalità", "Affidabilità", "Integrazione"]
    },
    
    "not_recommended": {
        "name": "Analisi Cosa NON Fare",
        "description": "Identifica pratiche sconsigliate e errori da evitare nell'uso dell'IA",
        "system_prompt": """Sei un esperto di best practices e analisi critica.
Crea una tassonomia IN ITALIANO per classificare cosa NON FARE con l'IA.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte su cosa NON CONSIGLIANO nell'uso dell'IA.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie di PRATICHE SCONSIGLIATE.
Esempi: Copiare senza Verificare, Sostituire Pensiero Critico, Usare per Imbrogliare, Condividere Dati Sensibili, Fidarsi Ciecamente

Per ogni categoria includi (TUTTO IN ITALIANO):
- name: pratica sconsigliata (max 30 caratteri)
- definition: perché è sconsigliata (max 100 caratteri)
- keywords: 3-5 parole chiave italiane
- examples: 1-2 esempi concreti

RISPOSTA RICHIESTA (JSON compatto, TUTTO IN ITALIANO):
{{
  "taxonomy": [
    {{"name": "Copia Acritica", "definition": "Copiare output IA senza verificare", "keywords": ["copia", "incolla", "acritico"], "examples": ["Non copiare direttamente le risposte"]}},
    {{"name": "Uso Scorretto", "definition": "Usare IA per scopi non etici", "keywords": ["barare", "imbrogliare", "copiare"], "examples": ["Non usare per fare i compiti al posto tuo"]}}
  ]
}}

IMPORTANTE: 
- TUTTO deve essere in ITALIANO
- Focus su COSA EVITARE/NON FARE
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 7,
        "suggested_categories": ["Copia Acritica", "Uso Scorretto", "Fiducia Cieca", "Privacy", "Sostituzione Pensiero", "Dipendenza", "Altro"]
    },
    
    "custom": {
        "name": "Analisi Personalizzata",
        "description": "Clustering automatico senza template predefinito",
        "system_prompt": """Sei un esperto di analisi qualitativa. 
Crea una tassonomia di categorie per classificare risposte aperte.
IMPORTANTE: Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, nessun testo aggiuntivo.""",
        "user_prompt_template": """Analizza queste {n_responses} risposte e crea una tassonomia.

RISPOSTE (prime 50):
{responses_text}

Crea ESATTAMENTE {max_categories} categorie semantiche.
Per ogni categoria includi:
- name: nome breve (max 30 caratteri)
- definition: definizione concisa (max 100 caratteri)
- keywords: 3-5 parole chiave
- examples: 1-2 esempi brevi

RISPOSTA RICHIESTA (JSON compatto):
{{
  "taxonomy": [
    {{"name": "Cat1", "definition": "Def1", "keywords": ["k1", "k2"], "examples": ["ex1"]}},
    {{"name": "Cat2", "definition": "Def2", "keywords": ["k3", "k4"], "examples": ["ex2"]}}
  ]
}}

IMPORTANTE: 
- Rispondi SOLO con JSON (no testo extra)
- Max {max_categories} categorie
- Testi brevi per evitare troncamento
- NO id field, solo name/definition/keywords/examples""",
        "default_max_categories": 8,
        "suggested_categories": []
    }
}


def get_template(template_name: str):
    """Ottieni un template per nome"""
    return ANALYSIS_TEMPLATES.get(template_name, ANALYSIS_TEMPLATES["custom"])


def get_all_templates():
    """Ottieni lista di tutti i template disponibili"""
    return [
        {
            "key": key,
            "name": template["name"],
            "description": template["description"],
            "default_max_categories": template["default_max_categories"],
            "suggested_categories": template.get("suggested_categories", [])
        }
        for key, template in ANALYSIS_TEMPLATES.items()
    ]


def format_prompt(template_name: str, responses_text: str, n_responses: int, max_categories: int):
    """Formatta il prompt usando un template"""
    template = get_template(template_name)
    
    # Aggiungi istruzione CRITICA all'inizio del prompt
    json_instruction = """⚠️ FORMATO RISPOSTA OBBLIGATORIO ⚠️
Rispondi ESCLUSIVAMENTE con il JSON richiesto, senza:
- Titoli (es: "## Tassonomia...")
- Introduzioni (es: "Ecco la tassonomia...")
- Spiegazioni prima o dopo il JSON
- Blocchi markdown ```json```

Inizia DIRETTAMENTE con { e termina con }

"""
    
    user_prompt = json_instruction + template["user_prompt_template"].format(
        responses_text=responses_text,
        n_responses=n_responses,
        max_categories=max_categories
    )
    
    # Aggiungi istruzione anche al system_prompt
    enhanced_system_prompt = template["system_prompt"] + "\n\nRISPONDI SEMPRE E SOLO CON JSON PURO. Non aggiungere titoli, introduzioni o spiegazioni."
    
    return enhanced_system_prompt, user_prompt
