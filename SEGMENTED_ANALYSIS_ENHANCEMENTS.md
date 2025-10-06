# Miglioramenti all'Analisi Segmentata delle Scale Likert

## Data: 6 Ottobre 2025

## Modifiche Implementate

### 1. Test di Significatività Statistica

**Backend** (`/backend/app/main.py`)
- Aggiunto calcolo automatico della significatività statistica tra i segmenti
- Implementati due test statistici:
  - **Kruskal-Wallis H-test** (non parametrico, robusto per distribuzioni non normali)
  - **ANOVA F-test** (parametrico, assume normalità)
- Livelli di significatività:
  - `p < 0.001`: **altamente significativo**
  - `p < 0.05`: **significativo**
  - `p ≥ 0.05`: **non significativo**

**Frontend** (`/frontend/src/components/SegmentedLikertAnalysis.jsx`)
- Aggiunta sezione dedicata "Test di Significatività Statistica"
- Visualizzazione con sfondo verde se significativo, grigio se non significativo
- Mostra valori H, F e p-value per entrambi i test
- Interpretazione automatica dei risultati

**Esempio Output:**
```json
{
  "statistical_significance": {
    "kruskal_wallis_h": 2.5746,
    "kruskal_wallis_p": 0.276,
    "anova_f": 0.9287,
    "anova_p": 0.3963,
    "significance_level": "non significativo",
    "is_significant": false
  }
}
```

### 2. Esclusione Segmenti con n=1

**Motivazione:** Un segmento con una sola persona non è statisticamente significativo e può distorcere i risultati.

**Implementazione:**
```python
for segment_name, values in segments.items():
    if len(values) <= 1:  # Salta segmenti con n=0 o n=1
        continue
```

**Effetto:** I box plot e le statistiche ora mostrano solo segmenti con almeno 2 rispondenti.

### 3. Aggiunta della Moda

**Backend:**
- Calcolo della moda (valore più frequente) per ogni segmento:
```python
mode_value = max(distribution, key=distribution.get)
```

**Frontend:**
- Visualizzazione della moda nelle statistiche dettagliate
- Formato: `Moda: 5` (il valore Likert più scelto nel segmento)

**Utilità:** La moda è particolarmente utile per le scale Likert perché indica il valore più comune scelto dai rispondenti, offrendo una comprensione immediata della tendenza centrale più rappresentativa.

### 4. Grafici Dettagliati della Distribuzione

**Componente:** `SegmentedLikertAnalysis.jsx`

**Nuova Sezione:** "Distribuzione Dettagliata per Segmento"

**Caratteristiche:**
- Un grafico a barre per ogni segmento
- Colori distintivi per ogni valore Likert (1-7):
  - 1: Rosso (#ef4444)
  - 2: Arancione (#f97316)
  - 3: Giallo (#fbbf24)
  - 4: Grigio neutrale (#94a3b8)
  - 5: Verde lime (#a3e635)
  - 6: Verde (#22c55e)
  - 7: Verde scuro (#10b981)
- Tooltip con count e percentuale
- Layout responsive (grid con minimo 300px per grafico)

**Esempio Visivo:**
```
Maschio (n=48)
├─ Valore 1: 1 risposta (2%)
├─ Valore 2: 6 risposte (13%)
├─ Valore 3: 6 risposte (13%)
├─ Valore 4: 6 risposte (13%)
├─ Valore 5: 12 risposte (25%)
├─ Valore 6: 14 risposte (29%)
└─ Valore 7: 3 risposte (6%)
```

### 5. Aggiunta Segmentazione per Tipo di Scuola (Studenti)

**Variabili di Segmentazione Aggiornate:**
- Genere
- Fascia d'età
- Livello di istruzione
- Area disciplinare
- **Livello scolastico** (insegnanti) / **Tipo di scuola** (studenti) ← NUOVO

**Normalizzazione Tipo di Scuola:**
```
Input Database                                    → Output Normalizzato
─────────────────────────────────────────────────────────────────────
Università - magistrale o a ciclo unico          → Università Magistrale
Università triennale                             → Università Triennale
Secondaria di secondo grado                      → Scuola Secondaria II grado
Secondaria di primo grado                        → Scuola Primaria/Media
Primaria                                         → Scuola Primaria/Media
Specializzazione post laurea / Master / Dottorato → Post Laurea
Disoccupato                                      → Altro
```

**Ordinamento:** Ordinamento cronologico dal livello più basso al più alto (Primaria → Media → Secondaria → Triennale → Magistrale → Post Laurea).

**Colori Assegnati:**
- Scuola Primaria/Media: Verde (#10b981)
- Scuola Secondaria II grado: Blu (#3b82f6)
- Università Triennale: Viola (#8b5cf6)
- Università Magistrale: Rosa (#ec4899)
- Post Laurea: Arancione (#f59e0b)

### 6. Miglioramenti all'Interfaccia

**Layout Ottimizzato:**
- Box plot con colori distintivi per segmento
- Legenda chiara (Box Q1-Q3, Mediana, Media, Min/Max)
- Grid responsive per statistiche dettagliate
- Sezione interpretazione automatica aggiornata

**Statistiche Visibili per Segmento:**
- n (campione)
- Media
- Mediana
- **Moda** ← NUOVO
- Deviazione standard
- Min/Max
- Q1/Q3 (quartili)
- Distribuzione percentuale per ogni valore 1-7

## Benefici dell'Implementazione

### 1. Robustezza Statistica
- Eliminazione di outlier (segmenti con n=1)
- Test di significatività per validare le differenze osservate
- Doppia verifica (parametrico e non parametrico)

### 2. Comprensione Migliorata
- La moda fornisce insight immediato sul valore più comune
- I grafici dettagliati mostrano la distribuzione completa
- Interpretazione automatica guidata dai test statistici

### 3. Usabilità
- Visualizzazione chiara della significatività (colori verde/grigio)
- Tooltip informativi sui grafici
- Layout responsive per tutti i dispositivi

### 4. Completezza
- 6 variabili di segmentazione per studenti
- 5 variabili di segmentazione per insegnanti
- Copertura completa delle caratteristiche demografiche

## Testing

### Endpoint Testato
```bash
curl "http://localhost:8118/api/likert-segmentation?question_column=practical_competence&respondent_type=students&segment_by=gender"
```

**Risultato:** ✅ Tutti i campi presenti (mode, statistical_significance, segmenti filtrati per n>1)

### Segmentazioni Testate
- ✅ Genere (3 segmenti: Maschio, Femmina, Altro)
- ✅ Fascia d'età (6 fasce per studenti)
- ✅ Area disciplinare (STEM, Umanistico, Altro)
- ✅ Tipo di scuola (5 livelli: Primaria/Media, Secondaria, Triennale, Magistrale, Post Laurea)

### Container Status
```
✔ questionnaire_db       Healthy
✔ questionnaire_backend  Running (porta 8118)
✔ questionnaire_frontend Running (porta 5180)
```

## File Modificati

### Backend
- `/backend/app/main.py` (linee 2770-2908)
  - Aggiunto filtro n>1
  - Calcolo moda
  - Test statistici (Kruskal-Wallis, ANOVA)
  - Normalizzazione school_type
  - Ordinamento per school_type

### Frontend
- `/frontend/src/components/SegmentedLikertAnalysis.jsx`
  - Import BarChart da recharts
  - Costanti LIKERT_COLORS
  - Sezione significatività statistica
  - Grafici distribuzione dettagliati per segmento
  - Visualizzazione moda nelle statistiche

## Note Tecniche

### Dipendenze
- **scipy** (già presente in requirements.txt): Per test statistici
- **recharts** (già presente): Per grafici a barre
- **numpy**: Per conversioni tipo (bool_, float64)

### Serializzazione
Conversione esplicita dei tipi numpy per Pydantic:
```python
'is_significant': bool(p_value_kruskal < 0.05)
'kruskal_wallis_h': round(float(h_statistic), 4)
```

### Performance
- I test statistici aggiungono ~5-10ms al tempo di risposta
- Trascurabile rispetto al tempo di query del database
- Nessun impatto sull'esperienza utente

## Prossimi Passi Potenziali

1. **Test post-hoc:** Se significativo, aggiungere test di confronto a coppie (Dunn's test)
2. **Effect size:** Calcolare Cohen's d o eta-squared per quantificare la grandezza dell'effetto
3. **Export:** Permettere download dei risultati statistici in formato CSV/Excel
4. **Confronto multiplo:** Visualizzazione side-by-side di più domande per lo stesso segmento

## Conclusioni

Questa implementazione trasforma l'analisi segmentata da uno strumento descrittivo a uno **strumento statistico robusto e scientificamente valido**, mantenendo al contempo un'interfaccia intuitiva e accessibile per utenti non statistici.

---
**Versione:** 3.2.0  
**Ultima Modifica:** 6 Ottobre 2025  
**Autore:** GitHub Copilot + Team Q-AI
