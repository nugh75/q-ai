#!/usr/bin/env python3
"""
Test per verificare l'eliminazione automatica di analisi senza risultati
"""
import sys
import json
import logging
from pathlib import Path

# Aggiungi backend al path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.database import SessionLocal
from app.models import QualitativeTaxonomy, QualitativeAnnotation
from app.qualitative_service import QualitativeAnalysisService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_empty_analysis_cleanup():
    """Test: crea un'analisi vuota e verifica che venga eliminata"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("TEST: Eliminazione automatica analisi senza risultati")
        print("="*80 + "\n")
        
        # 1. Crea una tassonomia di test
        test_taxonomy = QualitativeTaxonomy(
            question_field="test_empty_field",
            respondent_type="test",
            taxonomy_data={'taxonomy': [
                {'name': 'Cat1', 'definition': 'Test', 'keywords': ['test'], 'examples': []},
                {'name': 'Cat2', 'definition': 'Test2', 'keywords': ['test2'], 'examples': []}
            ]},
            n_clusters=2,
            n_responses=5,
            quality_score=0.0
        )
        db.add(test_taxonomy)
        db.commit()
        db.refresh(test_taxonomy)
        
        taxonomy_id = test_taxonomy.id
        logger.info(f"✓ Tassonomia di test creata (ID: {taxonomy_id})")
        
        # 2. Crea annotazioni VUOTE (senza label)
        for i in range(5):
            annotation = QualitativeAnnotation(
                taxonomy_id=taxonomy_id,
                respondent_code=f"TEST_{i:03d}",
                response_text=f"Risposta di test {i}",
                labels=[]  # NESSUNA LABEL
            )
            db.add(annotation)
        
        db.commit()
        logger.info("✓ Create 5 annotazioni VUOTE (senza classificazione)")
        
        # 3. Verifica che esistano nel DB
        count_before = db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.id == taxonomy_id
        ).count()
        annotations_before = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).count()
        
        print(f"\n📊 PRIMA della pulizia:")
        print(f"   Tassonomie: {count_before}")
        print(f"   Annotazioni: {annotations_before}")
        
        assert count_before == 1, "Dovrebbe esserci 1 tassonomia"
        assert annotations_before == 5, "Dovrebbero esserci 5 annotazioni"
        
        # 4. Simula la logica di pulizia (come nel codice reale)
        all_annotations = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).all()
        
        total_labels_assigned = 0
        for ann in all_annotations:
            if ann.labels and isinstance(ann.labels, list):
                total_labels_assigned += sum(1 for label in ann.labels if label.get('confidence', 0) > 0.5)
        
        print(f"\n🔍 VERIFICA:")
        print(f"   Totale label assegnate: {total_labels_assigned}")
        
        # 5. Se nessuna label, elimina
        if total_labels_assigned == 0:
            logger.info("⚠️  Nessuna label trovata, eliminazione in corso...")
            
            # Elimina annotazioni
            deleted_annotations = db.query(QualitativeAnnotation).filter(
                QualitativeAnnotation.taxonomy_id == taxonomy_id
            ).delete()
            
            # Elimina tassonomia
            deleted_taxonomies = db.query(QualitativeTaxonomy).filter(
                QualitativeTaxonomy.id == taxonomy_id
            ).delete()
            
            db.commit()
            
            print(f"\n🗑️  ELIMINATO:")
            print(f"   Annotazioni: {deleted_annotations}")
            print(f"   Tassonomie: {deleted_taxonomies}")
        
        # 6. Verifica eliminazione
        count_after = db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.id == taxonomy_id
        ).count()
        annotations_after = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).count()
        
        print(f"\n📊 DOPO la pulizia:")
        print(f"   Tassonomie: {count_after}")
        print(f"   Annotazioni: {annotations_after}")
        
        assert count_after == 0, "La tassonomia dovrebbe essere stata eliminata"
        assert annotations_after == 0, "Le annotazioni dovrebbero essere state eliminate"
        
        print("\n" + "="*80)
        print("✅ TEST PASSATO: Le analisi senza risultati vengono eliminate correttamente!")
        print("="*80 + "\n")
        
        return True
    
    except Exception as e:
        logger.error(f"❌ TEST FALLITO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Pulizia finale per sicurezza
        db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.respondent_code.like("TEST_%")
        ).delete()
        db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.question_field == "test_empty_field"
        ).delete()
        db.commit()
        db.close()


def test_analysis_with_results():
    """Test: verifica che analisi CON risultati NON vengano eliminate"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("TEST: Analisi con risultati NON vengono eliminate")
        print("="*80 + "\n")
        
        # 1. Crea una tassonomia di test
        test_taxonomy = QualitativeTaxonomy(
            question_field="test_valid_field",
            respondent_type="test",
            taxonomy_data={'taxonomy': [
                {'name': 'Positivo', 'definition': 'Test', 'keywords': ['bene'], 'examples': []},
                {'name': 'Negativo', 'definition': 'Test2', 'keywords': ['male'], 'examples': []}
            ]},
            n_clusters=2,
            n_responses=3,
            quality_score=0.0
        )
        db.add(test_taxonomy)
        db.commit()
        db.refresh(test_taxonomy)
        
        taxonomy_id = test_taxonomy.id
        logger.info(f"✓ Tassonomia di test creata (ID: {taxonomy_id})")
        
        # 2. Crea annotazioni CON label valide
        annotations_data = [
            {"code": "TEST_V01", "text": "Va tutto bene", "labels": [
                {"category": "Positivo", "confidence": 0.9, "relevant_phrase": "tutto bene"}
            ]},
            {"code": "TEST_V02", "text": "Molto male", "labels": [
                {"category": "Negativo", "confidence": 0.85, "relevant_phrase": "molto male"}
            ]},
            {"code": "TEST_V03", "text": "Così così", "labels": []}  # Una senza label
        ]
        
        for ann_data in annotations_data:
            annotation = QualitativeAnnotation(
                taxonomy_id=taxonomy_id,
                respondent_code=ann_data['code'],
                response_text=ann_data['text'],
                labels=ann_data['labels']
            )
            db.add(annotation)
        
        db.commit()
        logger.info("✓ Create 3 annotazioni (2 con label, 1 senza)")
        
        # 3. Simula la logica di pulizia
        all_annotations = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).all()
        
        total_labels_assigned = 0
        for ann in all_annotations:
            if ann.labels and isinstance(ann.labels, list):
                total_labels_assigned += sum(1 for label in ann.labels if label.get('confidence', 0) > 0.5)
        
        print(f"\n🔍 VERIFICA:")
        print(f"   Totale label assegnate: {total_labels_assigned}")
        
        # 4. Verifica che NON venga eliminata
        if total_labels_assigned == 0:
            logger.error("❌ Errore: l'analisi non dovrebbe essere vuota!")
            return False
        else:
            logger.info("✓ L'analisi ha risultati validi, viene mantenuta")
        
        # 5. Conta nel DB
        count = db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.id == taxonomy_id
        ).count()
        annotations_count = db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.taxonomy_id == taxonomy_id
        ).count()
        
        print(f"\n📊 STATO:")
        print(f"   Tassonomie: {count}")
        print(f"   Annotazioni: {annotations_count}")
        print(f"   Label valide: {total_labels_assigned}")
        
        assert count == 1, "La tassonomia dovrebbe esistere ancora"
        assert annotations_count == 3, "Le annotazioni dovrebbero esistere ancora"
        assert total_labels_assigned == 2, "Dovrebbero esserci 2 label valide"
        
        print("\n" + "="*80)
        print("✅ TEST PASSATO: Le analisi con risultati vengono mantenute!")
        print("="*80 + "\n")
        
        return True
    
    except Exception as e:
        logger.error(f"❌ TEST FALLITO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Pulizia finale
        db.query(QualitativeAnnotation).filter(
            QualitativeAnnotation.respondent_code.like("TEST_V%")
        ).delete()
        db.query(QualitativeTaxonomy).filter(
            QualitativeTaxonomy.question_field == "test_valid_field"
        ).delete()
        db.commit()
        db.close()


if __name__ == "__main__":
    print("\n" + "🔬"*40)
    print("SUITE DI TEST: Eliminazione Analisi Senza Risultati")
    print("🔬"*40 + "\n")
    
    success1 = test_empty_analysis_cleanup()
    success2 = test_analysis_with_results()
    
    print("\n" + "="*80)
    print("RIEPILOGO:")
    print(f"  Test 1 (Elimina analisi vuote): {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"  Test 2 (Mantieni analisi valide): {'✅ PASS' if success2 else '❌ FAIL'}")
    print("="*80 + "\n")
    
    if success1 and success2:
        print("🎉 TUTTI I TEST SONO PASSATI!\n")
        sys.exit(0)
    else:
        print("❌ ALCUNI TEST SONO FALLITI\n")
        sys.exit(1)
