# Funzionalità di Esportazione Grafici e Tabelle

## Panoramica
È stata aggiunta la funzionalità di esportazione per grafici e tabelle per **tutte le domande** del questionario, sia per studenti che per insegnanti.

## Modifiche Implementate

### 1. Frontend - QuestionStats.jsx

#### Funzioni di Utilità Aggiunte:
- **`downloadPNG(containerId, filename)`**: Esporta il grafico corrente come immagine PNG ad alta risoluzione (2x)
- **`downloadCSV(data, filename)`**: Esporta i dati della tabella in formato CSV con codifica UTF-8

#### Nuove Funzionalità:
- **`handleExportChart()`**: Gestisce l'esportazione del grafico visualizzato
  - Nome file automatico: `grafico_q{numero}__{testo_domanda}.png`
  - Risoluzione 2x per qualità ottimale
  
- **`handleExportTable()`**: Gestisce l'esportazione dei dati tabulari
  - Nome file automatico: `dati_q{numero}_{testo_domanda}.csv`
  - Include: #, Opzione, Conteggio, Percentuale
  - Encoding UTF-8 con BOM per compatibilità Excel

#### UI Miglioramenti:
- Due pulsanti nell'header delle statistiche:
  1. **"Esporta Grafico"** (blu) - con icona immagine
  2. **"Esporta Dati"** (verde) - con icona download
- Posizionamento automatico a destra nell'header
- Tooltip informativi al passaggio del mouse
- Effetti hover per feedback visivo

### 2. Frontend - Icons.jsx

#### Nuove Icone Aggiunte:
- **`Icons.Image`**: Icona per l'esportazione immagini
- **`Icons.Download`**: Icona per il download dati

## Funzionalità per Tipo di Domanda

### Tutti i Tipi Supportati:
✅ **Scale 1-7**: Esportazione grafici a barre/istogrammi con valori numerici
✅ **Sì/No**: Esportazione grafici a torta/barre con percentuali
✅ **Scelta Singola**: Esportazione grafici e tabelle con opzioni
✅ **Scelta Multipla**: Esportazione con tutte le selezioni
✅ **Numeriche**: Esportazione box plot e istogrammi
✅ **Testo Aperto**: Esportazione tabella con risposte categorizzate

## Formati di Esportazione

### PNG (Grafici)
- **Risoluzione**: 2x (alta qualità)
- **Sfondo**: Bianco
- **Formato**: PNG standard
- **Compatibilità**: Tutti i browser moderni

### CSV (Dati)
- **Encoding**: UTF-8 con BOM
- **Separatore**: Virgola (,)
- **Quote**: Automatiche per valori con virgole/newline
- **Compatibilità**: Excel, Google Sheets, LibreOffice

## Compatibilità Filtri

La funzionalità di esportazione rispetta tutti i filtri applicati:
- ✅ Filtro tipo insegnante (attivi/in formazione)
- ✅ Filtro categoria domanda
- ✅ Filtro formato risposta
- ✅ Tipo di grafico selezionato

## Nomi File Automatici

I file esportati hanno nomi descrittivi generati automaticamente:

**Grafici:**
```
grafico_q3_Il_tuo_genere__.png
grafico_q8_Qual___il_tuo_settore_scientifico_disciplinare_.png
```

**Dati:**
```
dati_q3_Il_tuo_genere__.csv
dati_q8_Qual___il_tuo_settore_scientifico_disciplinare_.csv
```

## Utilizzo

### Per l'Utente:
1. Navigare alla domanda desiderata nel Dashboard
2. Selezionare il tipo di grafico preferito (barre, torta, linea, ecc.)
3. Applicare eventuali filtri (insegnanti attivi/in formazione)
4. Cliccare su **"Esporta Grafico"** per salvare l'immagine PNG
5. Cliccare su **"Esporta Dati"** per salvare la tabella CSV

### Esempio Caso d'Uso:
- **Ricercatore**: Esporta grafici per presentazioni/paper
- **Docente**: Esporta dati per analisi statistiche
- **Amministratore**: Esporta reportistica per stakeholder

## Note Tecniche

### Requisiti Browser:
- Canvas API support
- Blob API support
- SVG serialization support
- Supportati: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Limitazioni:
- Le esportazioni riflettono lo stato corrente (filtri, grafico selezionato)
- I nomi file sono limitati a 50 caratteri per il testo della domanda
- Caratteri speciali nei nomi file vengono sostituiti con underscore

### Performance:
- Esportazione PNG: ~100-500ms (dipende dalla complessità del grafico)
- Esportazione CSV: ~10-50ms (dipende dal numero di righe)
- Nessun caricamento server richiesto (100% client-side)

## Benefici

1. **Accessibilità**: Dati e grafici facilmente condivisibili
2. **Reportistica**: Creazione rapida di report visivi
3. **Analisi**: Dati pronti per elaborazioni statistiche
4. **Presentazioni**: Grafici ad alta qualità per slide
5. **Archivio**: Snapshot dei dati per confronti temporali

## Future Enhancements (Possibili)

- [ ] Esportazione PDF multi-pagina con tutti i grafici
- [ ] Esportazione Excel (XLSX) con formattazione
- [ ] Esportazione JSON per analisi programmatiche
- [ ] Batch export di tutte le domande
- [ ] Personalizzazione template esportazione
- [ ] Watermark/logo nell'esportazione immagini
