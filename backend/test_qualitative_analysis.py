#!/usr/bin/env python3
"""
Test completo per il sistema di analisi qualitativa
Verifica:
1. Generazione tassonomia con nomi semanticamente rilevanti in italiano
2. Classificazione delle risposte con le categorie create
3. Analisi finale con statistiche per categoria
"""
import sys
import json
import logging
from pathlib import Path

# Aggiungi backend al path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.database import SessionLocal, engine
from app.models import Base, QualitativeTaxonomy, QualitativeAnnotation, StudentResponse, LLMConfig
from app.qualitative_service import QualitativeAnalysisService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Risposte di test in italiano (per testare la tassonomia)
TEST_RESPONSES_PROS_CONS = [
    "L'IA mi aiuta a fare ricerche velocemente e a trovare informazioni utili",
    "ChatGPT mi spiega concetti difficili in modo semplice",
    "Ho paura che l'IA mi renda più pigro e che non impari davvero",
    "È fantastico perché posso avere risposte immediate a qualsiasi domanda",
    "Temo di diventare troppo dipendente dall'IA",
    "L'IA personalizza lo studio in base alle mie esigenze",
    "Non mi fido delle risposte dell'IA, potrebbero essere sbagliate",
    "Mi preoccupa la privacy dei miei dati personali",
    "Risparmio molto tempo usando l'IA per studiare",
    "L'IA mi aiuta a essere più creativo nei progetti",
    "Alcuni compagni copiano direttamente dall'IA senza pensare",
    "È utile per correggere errori grammaticali e migliorare la scrittura",
    "Potrebbe sostituire gli insegnanti in futuro",
    "L'IA è disponibile 24/7, sempre pronta ad aiutare",
    "Le informazioni potrebbero essere superficiali o imprecise"
]

TEST_RESPONSES_SUGGESTIONS = [
    "Vorrei più esempi pratici nelle lezioni",
    "Sarebbe utile avere più tempo per le esercitazioni",
    "Il programma dovrebbe includere più argomenti sulla programmazione",
    "Serve più supporto individuale per chi è in difficoltà",
    "I materiali didattici dovrebbero essere più aggiornati",
    "Le lezioni dovrebbero essere più interattive",
    "Vorrei strumenti digitali migliori per studiare",
    "La valutazione dovrebbe considerare anche i progetti pratici",
    "Serve più comunicazione tra docenti e studenti",
    "I compiti dovrebbero essere più collegati alla realtà"
]


def print_separator(title=""):
    """Stampa separatore visivo"""
    print("\n" + "="*80)
    if title:
        print(f"  {title}")
        print("="*80)
    print()


def check_llm_config(db):
    """Verifica configurazione LLM"""
    config = db.query(LLMConfig).filter(LLMConfig.is_active == 1).first()
    if not config:
        logger.error("❌ Nessuna configurazione LLM attiva trovata!")
        logger.info("Configura l'LLM in Amministrazione prima di eseguire i test")
        return False
    
    logger.info(f"✓ Configurazione LLM attiva: {config.provider} - {config.model_name}")
    logger.info(f"  Endpoint: {config.endpoint}")
    return True


def test_taxonomy_generation(db, service, template_name="pros_cons", responses=None):
    """Test 1: Generazione tassonomia"""
    print_separator(f"TEST 1: Generazione Tassonomia ({template_name})")
    
    if responses is None:
        responses = TEST_RESPONSES_PROS_CONS
    
    try:
        logger.info(f"Generazione tassonomia con {len(responses)} risposte...")
        logger.info(f"Template: {template_name}")
        
        taxonomy_data = service.generate_taxonomy(
            responses=responses,
            question_field="test_field",
            max_categories=8,
            template_name=template_name
        )
        
        logger.info(f"✓ Tassonomia generata con successo!")
        logger.info(f"  Struttura JSON keys: {list(taxonomy_data.keys())}")
        
        # Verifica presenza campo taxonomy
        if 'taxonomy' not in taxonomy_data:
            logger.error("❌ Errore: campo 'taxonomy' mancante nella risposta!")
            logger.error(f"   Campi presenti: {list(taxonomy_data.keys())}")
            return None, None
        
        categories = taxonomy_data['taxonomy']
        logger.info(f"  Numero categorie: {len(categories)}")
        
        # Verifica qualità dei nomi delle categorie
        print("\n📋 CATEGORIE GENERATE:")
        print("-" * 80)
        
        issues_found = []
        
        for i, cat in enumerate(categories, 1):
            name = cat.get('name', 'N/A')
            definition = cat.get('definition', 'N/A')
            keywords = cat.get('keywords', [])
            
            print(f"\n{i}. {name}")
            print(f"   Definizione: {definition}")
            print(f"   Keywords: {', '.join(keywords) if keywords else 'N/A'}")
            
            # VERIFICHE DI QUALITÀ
            # 1. Nome non deve essere generico come "Categoria 1"
            if name.lower().startswith('categoria ') or name.lower().startswith('category '):
                issues_found.append(f"❌ Categoria {i}: Nome generico '{name}' invece di semanticamente rilevante")
            
            # 2. Definizione non deve essere in inglese
            english_words = ['the', 'and', 'with', 'for', 'that', 'this', 'from']
            if any(word in definition.lower().split() for word in english_words):
                issues_found.append(f"⚠️  Categoria {i}: Definizione sembra in inglese '{definition}'")
            
            # 3. Nome non deve essere in inglese
            if any(word in name.lower().split() for word in english_words):
                issues_found.append(f"⚠️  Categoria {i}: Nome sembra in inglese '{name}'")
            
            # 4. Verifica PRO/CONTRO se template è pros_cons
            if template_name == "pros_cons":
                if not (name.startswith("PRO:") or name.startswith("CONTRO:")):
                    issues_found.append(f"⚠️  Categoria {i}: Manca prefisso PRO:/CONTRO: '{name}'")
        
        # Report problemi
        print("\n" + "="*80)
        if issues_found:
            print("⚠️  PROBLEMI RILEVATI:")
            for issue in issues_found:
                print(f"   {issue}")
        else:
            print("✅ TUTTE LE CATEGORIE SONO SEMANTICAMENTE RILEVANTI E IN ITALIANO!")
        print("="*80)
        
        # Salva nel database
        taxonomy_db = QualitativeTaxonomy(
            question_field="test_field",
            respondent_type="student",
            taxonomy_data=taxonomy_data,
            n_clusters=len(categories),
            n_responses=len(responses)
        )
        db.add(taxonomy_db)
        db.commit()
        db.refresh(taxonomy_db)
        
        logger.info(f"✓ Tassonomia salvata nel DB (ID: {taxonomy_db.id})")
        
        return taxonomy_db.id, categories
    
    except Exception as e:
        logger.error(f"❌ Errore generazione tassonomia: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def test_classification(db, service, taxonomy_id, categories, responses):
    """Test 2: Classificazione risposte"""
    print_separator("TEST 2: Classificazione Risposte")
    
    if not taxonomy_id or not categories:
        logger.error("❌ Impossibile testare classificazione senza tassonomia valida")
        return False
    
    try:
        logger.info(f"Classificazione di {len(responses)} risposte...")
        
        # Classifica ogni risposta
        annotations_created = 0
        classification_stats = {cat['name']: 0 for cat in categories}
        unclassified = 0
        
        for i, response in enumerate(responses, 1):
            logger.info(f"\nClassificazione risposta {i}/{len(responses)}")
            logger.info(f"  Testo: {response[:80]}...")
            
            try:
                labels = service.classify_response(response, categories)
            except Exception as e:
                logger.error(f"  ❌ Errore classificazione: {str(e)}")
                labels = []
            
            if not labels or len(labels) == 0:
                logger.warning(f"  ⚠️  Nessuna categoria assegnata!")
                unclassified += 1
            else:
                logger.info(f"  ✓ Categorie assegnate: {len(labels)}")
                for label in labels:
                    cat_name = label.get('category', 'N/A')
                    confidence = label.get('confidence', 0)
                    phrase = label.get('relevant_phrase', 'N/A')
                    
                    logger.info(f"    - {cat_name} (conf: {confidence:.2f})")
                    logger.info(f"      Frase: {phrase[:60]}...")
                    
                    # Verifica che la categoria esista nella tassonomia
                    if cat_name in classification_stats:
                        classification_stats[cat_name] += 1
                    else:
                        logger.warning(f"      ⚠️  PROBLEMA: Categoria '{cat_name}' NON trovata nella tassonomia!")
                        logger.warning(f"          Categorie disponibili: {list(classification_stats.keys())}")
            
            # Salva annotazione
            annotation = QualitativeAnnotation(
                taxonomy_id=taxonomy_id,
                respondent_code=f"TEST_{i:03d}",
                response_text=response,
                labels=labels
            )
            db.add(annotation)
            annotations_created += 1
        
        db.commit()
        logger.info(f"\n✓ {annotations_created} annotazioni salvate nel DB")
        
        # Report statistiche
        print("\n" + "="*80)
        print("📊 STATISTICHE CLASSIFICAZIONE:")
        print("-" * 80)
        print(f"Risposte totali: {len(responses)}")
        print(f"Risposte non classificate: {unclassified}")
        print(f"\nDistribuzione per categoria:")
        for cat_name, count in classification_stats.items():
            percentage = (count / len(responses)) * 100 if len(responses) > 0 else 0
            print(f"  {cat_name}: {count} ({percentage:.1f}%)")
        print("="*80)
        
        # Verifica se ci sono categorie mai assegnate
        unused_categories = [name for name, count in classification_stats.items() if count == 0]
        if unused_categories:
            print("\n⚠️  PROBLEMA: Categorie create ma MAI assegnate:")
            for cat in unused_categories:
                print(f"   - {cat}")
            print("\nQuesto indica che le categorie non vengono riconosciute durante la classificazione!")
            print("="*80)
            return False
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Errore classificazione: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_analysis_retrieval(db, taxonomy_id, categories):
    """Test 3: Recupero analisi"""
    print_separator("TEST 3: Recupero Analisi Finale")
    
    if not taxonomy_id:
        logger.error("❌ Impossibile testare recupero senza taxonomy_id")
        return False
    
    try:
        # Recupera tassonomia
        taxonomy = db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.id == taxonomy_id
        ).first()
        
        if not taxonomy:
            logger.error(f"❌ Tassonomia con ID {taxonomy_id} non trovata!")
            return False
        
        logger.info(f"✓ Tassonomia recuperata (ID: {taxonomy.id})")
        logger.info(f"  Categorie: {len(taxonomy.taxonomy_data.get('taxonomy', []))}")
        
        # Recupera annotazioni
        annotations = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).all()
        
        logger.info(f"✓ Annotazioni recuperate: {len(annotations)}")
        
        if len(annotations) == 0:
            logger.error("❌ Nessuna annotazione trovata!")
            return False
        
        # Calcola statistiche per categoria
        print("\n" + "="*80)
        print("📈 ANALISI FINALE:")
        print("-" * 80)
        
        category_stats = {}
        for cat in categories:
            cat_name = cat['name']
            category_stats[cat_name] = {
                'count': 0,
                'avg_confidence': 0,
                'examples': []
            }
        
        total_labels = 0
        for ann in annotations:
            labels = ann.labels if isinstance(ann.labels, list) else []
            for label in labels:
                cat_name = label.get('category')
                confidence = label.get('confidence', 0)
                
                if cat_name in category_stats:
                    category_stats[cat_name]['count'] += 1
                    category_stats[cat_name]['avg_confidence'] += confidence
                    if len(category_stats[cat_name]['examples']) < 2:
                        category_stats[cat_name]['examples'].append({
                            'text': ann.response_text[:80] + '...',
                            'confidence': confidence
                        })
                    total_labels += 1
        
        # Calcola medie
        for cat_name in category_stats:
            count = category_stats[cat_name]['count']
            if count > 0:
                category_stats[cat_name]['avg_confidence'] /= count
        
        # Stampa risultati
        for cat_name, stats in category_stats.items():
            count = stats['count']
            percentage = (count / len(annotations)) * 100 if len(annotations) > 0 else 0
            avg_conf = stats['avg_confidence']
            
            print(f"\n{cat_name}")
            print(f"  Risposte: {count} ({percentage:.1f}%)")
            print(f"  Confidenza media: {avg_conf:.2f}")
            
            if stats['examples']:
                print(f"  Esempi:")
                for ex in stats['examples']:
                    print(f"    - {ex['text']} (conf: {ex['confidence']:.2f})")
        
        print("\n" + "="*80)
        print(f"✅ Analisi completata con successo!")
        print(f"   Totale etichette assegnate: {total_labels}")
        print(f"   Media etichette per risposta: {total_labels/len(annotations):.1f}")
        print("="*80)
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Errore recupero analisi: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def cleanup_test_data(db):
    """Rimuovi dati di test"""
    print_separator("PULIZIA DATI DI TEST")
    
    try:
        # Elimina annotazioni di test
        deleted_annotations = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.respondent_code.like("TEST_%")
        ).delete()
        
        # Elimina tassonomie di test
        deleted_taxonomies = db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.question_field == "test_field"
        ).delete()
        
        db.commit()
        
        logger.info(f"✓ Pulizia completata:")
        logger.info(f"  - Annotazioni eliminate: {deleted_annotations}")
        logger.info(f"  - Tassonomie eliminate: {deleted_taxonomies}")
    
    except Exception as e:
        logger.error(f"❌ Errore pulizia: {str(e)}")
        db.rollback()


def main():
    """Main test runner"""
    print_separator("TEST SISTEMA ANALISI QUALITATIVA")
    print("Questo script testa:")
    print("1. Generazione tassonomia con nomi semanticamente rilevanti in italiano")
    print("2. Classificazione delle risposte con le categorie create")
    print("3. Recupero e visualizzazione analisi finale")
    print()
    
    # Crea sessione DB
    db = SessionLocal()
    
    try:
        # Verifica configurazione LLM
        if not check_llm_config(db):
            return
        
        # Crea servizio
        service = QualitativeAnalysisService(db)
        
        # Pulisci dati di test precedenti
        cleanup_test_data(db)
        
        # TEST 1: Pro e Contro
        print("\n" + "🔵"*40)
        print("TEST SUITE 1: ANALISI PRO E CONTRO")
        print("🔵"*40)
        taxonomy_id_1, categories_1 = test_taxonomy_generation(
            db, service, 
            template_name="pros_cons",
            responses=TEST_RESPONSES_PROS_CONS
        )
        
        if taxonomy_id_1 and categories_1:
            success_1 = test_classification(db, service, taxonomy_id_1, categories_1, TEST_RESPONSES_PROS_CONS)
            if success_1:
                test_analysis_retrieval(db, taxonomy_id_1, categories_1)
        
        # TEST 2: Suggerimenti
        print("\n" + "🟢"*40)
        print("TEST SUITE 2: ANALISI SUGGERIMENTI")
        print("🟢"*40)
        taxonomy_id_2, categories_2 = test_taxonomy_generation(
            db, service,
            template_name="suggestions",
            responses=TEST_RESPONSES_SUGGESTIONS
        )
        
        if taxonomy_id_2 and categories_2:
            success_2 = test_classification(db, service, taxonomy_id_2, categories_2, TEST_RESPONSES_SUGGESTIONS)
            if success_2:
                test_analysis_retrieval(db, taxonomy_id_2, categories_2)
        
        # Report finale
        print_separator("RISULTATI FINALI")
        print("✅ Test completati!")
        print("\nProssimi passi:")
        print("1. Verifica che le categorie generate abbiano nomi semanticamente rilevanti")
        print("2. Verifica che la classificazione assegni le categorie corrette")
        print("3. Se i test falliscono, controlla i log per dettagli")
        print("\nPer pulire i dati di test, esegui: cleanup_test_data(db)")
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrotto dall'utente")
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
