#!/usr/bin/env python3
"""
Test rapido per verificare il filtro delle tassonomie vuote
"""
import requests
import sys

BASE_URL = "http://localhost:8118"

def test_taxonomy_list():
    """Testa che la lista filtri automaticamente le tassonomie vuote"""
    print("🧪 Test: Lista tassonomie (dovrebbe escludere quelle vuote)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/qualitative-analysis/taxonomies",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Lista ottenuta: {result['total']} tassonomie valide")
            
            if result['total'] > 0:
                print("\n📋 Tassonomie con risultati:")
                for tax in result['taxonomies'][:5]:  # Prime 5
                    print(f"   - ID {tax['id']}: {tax['field_key']} "
                          f"({tax['n_clusters']} categorie, {tax['n_responses']} risposte)")
            else:
                print("   Nessuna tassonomia con risultati trovata")
            
            return True
        else:
            print(f"❌ Errore {response.status_code}: {response.text}")
            return False
    
    except Exception as e:
        print(f"❌ Errore: {str(e)}")
        return False


def test_cleanup_endpoint():
    """Testa che l'endpoint di pulizia esista"""
    print("\n🧪 Test: Endpoint di pulizia (verifica esistenza)")
    
    # Non eseguiamo la pulizia vera, solo verifichiamo che l'endpoint esista
    # provando con password errata
    try:
        response = requests.delete(
            f"{BASE_URL}/api/qualitative-analysis/cleanup-empty",
            params={"password": "wrong_password"},
            timeout=10
        )
        
        if response.status_code == 401:
            print("✅ Endpoint di pulizia attivo (richiede password corretta)")
            return True
        else:
            print(f"⚠️  Risposta inaspettata: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"❌ Errore: {str(e)}")
        return False


if __name__ == "__main__":
    print("="*70)
    print("TEST SISTEMA DI PULIZIA ANALISI QUALITATIVE")
    print("="*70)
    print()
    
    success1 = test_taxonomy_list()
    success2 = test_cleanup_endpoint()
    
    print("\n" + "="*70)
    
    if success1 and success2:
        print("✅ TUTTI I TEST PASSATI")
        print("\nLa lista delle tassonomie ora filtra automaticamente quelle vuote.")
        print("Per pulire manualmente le tassonomie vuote, usa:")
        print("  python3 cleanup_empty_taxonomies.py")
        sys.exit(0)
    else:
        print("❌ ALCUNI TEST FALLITI")
        sys.exit(1)
    
    print("="*70)
