# Dashboard Questionari AI - CNR

## 🎨 Nuova Interfaccia Moderna

L'applicazione è stata aggiornata con un design moderno e pulito ispirato a dashboard professionali.

### Caratteristiche principali:

- **Design moderno**: Interfaccia pulita con palette colori Tailwind CSS
- **Icone SVG**: Utilizzo di icone vettoriali professionali al posto degli emoji
- **Tab Domande**: Visualizzazione completa di tutte le domande con classificazione automatica
- **Classificatore intelligente**: Sistema automatico che identifica domande aperte e chiuse
- **Filtri avanzati**: Filtraggio per tipo di rispondente, tipo di domanda e categoria

### Accesso all'applicazione:

- **Frontend**: http://localhost:5180
- **Backend API**: http://localhost:8118
- **Database**: localhost:5433

### Colori e stile:

- Background principale: `#f8fafc` (grigio chiaro)
- Card e componenti: `#ffffff` (bianco)
- Accenti primari: `#3b82f6` (blu)
- Domande aperte: `#10b981` (verde)
- Domande chiuse: `#3b82f6` (blu)
- Bordi: `#e2e8f0` (grigio neutro)

### Tab Domande:

Il nuovo tab "Domande" mostra:

1. **Statistiche generali**: Totale domande, aperte e chiuse
2. **Filtri**: Per tipo di rispondente, tipo di domanda e categoria
3. **Categorie**: Distribuzione delle domande per categoria
4. **Elenco completo**: Tutte le domande con badge informativi

### Classificazione automatica:

Il sistema classifica automaticamente le domande come:

- **Chiuse**: Domande con scale numeriche, scelte multiple, sì/no
- **Aperte**: Domande che richiedono risposte testuali libere

### Categorie identificate:

- `demographic`: Dati demografici (età, genere, scuola)
- `competence`: Competenze pratiche e teoriche
- `trust`: Fiducia nell'integrazione AI
- `concern`: Preoccupazioni sull'uso dell'AI
- `training`: Formazione e preparazione
- `usage`: Utilizzo e ore settimanali
- `tools`: Strumenti AI utilizzati
- `personalization`: Personalizzazione e prompt
- `impact`: Cambiamenti e miglioramenti
- `challenges`: Difficoltà e problemi
- `open_reflection`: Riflessioni aperte

### Formato risposte:

- `scale_1_7`: Scala da 1 a 7
- `yes_no`: Domande Sì/No
- `numeric`: Valori numerici (età, ore)
- `multiple_choice`: Scelta multipla
- `text`: Testo libero

## API Endpoints:

- `GET /api/questions`: Tutte le domande con filtri opzionali
- `GET /api/questions/summary`: Riepilogo domande raggruppate
- `GET /api/students`: Statistiche studenti
- `GET /api/teachers`: Statistiche insegnanti
- `GET /api/comparison`: Analisi comparativa
- `GET /api/tools`: Strumenti AI utilizzati

## Come usare:

1. Avviare l'applicazione: `docker-compose up -d`
2. Aprire il browser su http://localhost:5180
3. Navigare tra i vari tab per esplorare i dati
4. Usare i filtri nel tab "Domande" per analisi specifiche
