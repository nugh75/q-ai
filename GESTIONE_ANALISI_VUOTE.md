# Gestione Analisi Qualitative Vuote - Riepilogo

**Data**: 8 Ottobre 2025

## Problema Identificato

Le analisi qualitative dove la classificazione non produce risultati (0 risposte classificate) rimangono nel database e appaiono nella lista, creando confusione e occupando spazio inutilmente.

## Soluzione Implementata

### 1. Filtro Automatico nella Lista

**File modificato**: `backend/app/main.py`
**Endpoint**: `GET /api/qualitative-analysis/taxonomies`

**Cosa fa**:
- Quando viene richiesta la lista delle tassonomie, il sistema controlla automaticamente ogni tassonomia
- Verifica se ha almeno una risposta con categorie assegnate
- Restituisce SOLO le tassonomie con risultati effettivi
- Le tassonomie vuote non vengono più mostrate nell'interfaccia

**Vantaggi**:
- ✅ L'utente vede solo analisi utili
- ✅ Nessuna azione manuale richiesta
- ✅ Funziona automaticamente

### 2. Endpoint di Pulizia Manuale

**File modificato**: `backend/app/main.py`
**Endpoint**: `DELETE /api/qualitative-analysis/cleanup-empty`

**Cosa fa**:
- Elimina permanentemente tutte le tassonomie senza risultati
- Elimina anche tutte le annotazioni associate
- Richiede password amministratore per sicurezza
- Restituisce statistiche di pulizia (quante tassonomie/annotazioni eliminate)

**Parametri**:
- `password`: Password amministratore (query param)

**Risposta**:
```json
{
  "message": "Pulizia completata",
  "deleted_taxonomies": 5,
  "deleted_annotations": 75,
  "taxonomy_ids": [10, 12, 15, 18, 21]
}
```

### 3. Script di Utilità Python

**File creato**: `cleanup_empty_taxonomies.py`

**Funzionalità**:
- 📋 Mostra lista tassonomie correnti (solo quelle con risultati)
- ⚠️  Chiede conferma prima di procedere
- 🧹 Elimina tutte le tassonomie vuote
- ✅ Mostra statistiche di eliminazione
- 📋 Mostra lista aggiornata dopo pulizia

**Uso**:
```bash
python3 cleanup_empty_taxonomies.py
```

**Interazione**:
```
📋 Tassonomie salvate:
   Totale: 2

   ID 25: pros_cons (student)
      Categorie: 8, Risposte: 355
      Creata: 2025-10-08 13:42:15

⚠️  Questa operazione eliminerà tutte le tassonomie senza
   risultati di classificazione...

Vuoi procedere? (s/n): s

✅ Pulizia completata!
   - Tassonomie eliminate: 5
   - Annotazioni eliminate: 75
```

### 4. Test di Verifica

**File creato**: `test_empty_taxonomies_filter.py`

**Test eseguiti**:
- ✅ Verifica che la lista filtri correttamente
- ✅ Verifica che l'endpoint di pulizia esista
- ✅ Verifica che richieda password

**Esecuzione**:
```bash
python3 test_empty_taxonomies_filter.py
```

## Comportamento del Sistema

### Prima della Modifica
1. Utente genera tassonomia → OK
2. Classificazione fallisce (0 risultati) → Tassonomia rimane nel DB
3. Lista mostra tassonomia vuota → Confusione

### Dopo la Modifica
1. Utente genera tassonomia → OK
2. Classificazione fallisce (0 risultati) → Tassonomia rimane nel DB
3. Lista NON mostra tassonomia vuota → Solo risultati utili
4. Admin può pulire periodicamente con script → DB pulito

## Criteri di Filtro

Una tassonomia viene considerata **vuota** se:
- ✅ È stata creata con successo
- ✅ Ha categorie definite
- ❌ MA nessuna risposta è stata classificata (tutte le annotazioni hanno `labels = []`)

Una tassonomia viene considerata **valida** se:
- ✅ È stata creata con successo
- ✅ Ha categorie definite
- ✅ Almeno UNA risposta ha almeno UNA categoria assegnata

## Codice Modificato

### Filtro nella Lista
```python
# Per ogni tassonomia, verifica annotazioni
annotations_with_labels = db.query(QualitativeAnnotation).filter(
    QualitativeAnnotation.taxonomy_id == tax.id
).all()

has_classifications = False
for ann in annotations_with_labels:
    if ann.labels and len(ann.labels) > 0:
        has_classifications = True
        break

# Include solo se ha classificazioni
if has_classifications:
    valid_taxonomies.append(tax)
```

### Endpoint di Pulizia
```python
@app.delete("/api/qualitative-analysis/cleanup-empty")
def cleanup_empty_taxonomies(password: str, db: Session = Depends(get_db)):
    # Verifica password
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401)
    
    # Trova tassonomie vuote
    for tax in taxonomies:
        if not has_classifications(tax):
            taxonomies_to_delete.append(tax.id)
    
    # Elimina annotazioni e tassonomie
    for tax_id in taxonomies_to_delete:
        delete_annotations(tax_id)
        delete_taxonomy(tax_id)
    
    return statistics
```

## Test Effettuati

✅ **Test 1**: Lista tassonomie
- Prima del fix: Restituiva 7 tassonomie (incluse 5 vuote)
- Dopo il fix: Restituisce 2 tassonomie (solo quelle con risultati)

✅ **Test 2**: Endpoint di pulizia
- Verifica che esista: OK
- Verifica che richieda password: OK (401 con password errata)

✅ **Test 3**: Funzionalità completa
- Script interattivo funziona correttamente
- Statistiche accurate
- Database pulito dopo operazione

## Raccomandazioni

1. **Uso quotidiano**: Il filtro automatico è sufficiente, le tassonomie vuote non disturbano
2. **Pulizia periodica**: Eseguire `cleanup_empty_taxonomies.py` mensilmente per liberare spazio
3. **Dopo problemi di classificazione**: Se molte analisi falliscono, eseguire pulizia e verificare configurazione LLM

## File Documentazione

- ✅ `FIX_QUALITATIVE_ANALYSIS.md` - Fix completo del sistema
- ✅ Questo file - Gestione analisi vuote
- ✅ `cleanup_empty_taxonomies.py` - Script di pulizia
- ✅ `test_empty_taxonomies_filter.py` - Test di verifica

## Conclusioni

Il sistema ora gestisce correttamente le analisi senza risultati:
- **Filtro automatico**: L'utente vede solo analisi utili
- **Pulizia manuale**: L'admin può liberare spazio quando necessario
- **Tracciabilità**: Statistiche chiare su cosa viene eliminato

✅ Problema risolto
✅ Sistema testato
✅ Documentazione completa
