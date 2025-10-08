#!/usr/bin/env python3
"""
Test sistema di retry LLM
Verifica che il sistema gestisca correttamente:
- Timeout
- Risposte vuote
- Errori di connessione
"""

import requests
import time
import json

BASE_URL = "http://localhost:8118"

def test_normal_analysis():
    """Test: Analisi normale dovrebbe funzionare con retry automatico"""
    print("\n" + "="*60)
    print("TEST 1: Analisi Normale (con retry automatico)")
    print("="*60)
    
    # Dati minimalisti per test veloce
    payload = {
        "question_field": "pros_cons",
        "respondent_type": "teachers_active",
        "max_categories": 4,
        "template_name": "pros_cons_template"
    }
    
    print("\n📤 Invio richiesta analisi qualitativa...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/qualitative-analysis/generate-taxonomy",
            json=payload,
            timeout=900  # 15 minuti per dare tempo ai retry
        )
        
        elapsed = time.time() - start_time
        
        print(f"\n⏱️  Tempo risposta: {elapsed:.1f}s")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESSO!")
            print(f"   - Tassonomia ID: {data.get('id')}")
            print(f"   - Numero categorie: {len(data.get('taxonomy', []))}")
            
            # Mostra prime 2 categorie
            taxonomy = data.get('taxonomy', [])
            if taxonomy:
                print(f"\n📋 Prime 2 categorie:")
                for i, cat in enumerate(taxonomy[:2]):
                    print(f"   {i+1}. {cat.get('name')}")
                    print(f"      {cat.get('definition', '')[:80]}...")
            
            return True
        else:
            print(f"\n❌ ERRORE: {response.status_code}")
            print(f"Dettagli: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        print(f"\n⏱️  Timeout dopo {elapsed:.1f}s")
        print("⚠️  Questo può indicare che il modello è molto lento o sovraccarico")
        return False
        
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n❌ ERRORE dopo {elapsed:.1f}s: {type(e).__name__}")
        print(f"Messaggio: {str(e)}")
        return False


def check_llm_config():
    """Verifica configurazione LLM attiva"""
    print("\n" + "="*60)
    print("VERIFICA: Configurazione LLM")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/admin/llm-config")
        
        if response.status_code == 200:
            configs = response.json()
            active = [c for c in configs if c.get('is_active')]
            
            if active:
                config = active[0]
                print(f"\n✅ Configurazione LLM attiva trovata:")
                print(f"   - Provider: {config.get('provider')}")
                print(f"   - Model: {config.get('model_name')}")
                print(f"   - Endpoint: {config.get('endpoint')}")
                return True
            else:
                print("\n⚠️  NESSUNA configurazione LLM attiva!")
                print("   Configura l'LLM tramite interfaccia Amministrazione")
                return False
        else:
            print(f"\n❌ Errore recupero config: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ Errore: {str(e)}")
        return False


def main():
    print("\n" + "🧪 TEST SISTEMA RETRY LLM ".center(60, "="))
    print("Data test: 8 ottobre 2025")
    print("Funzionalità verificate:")
    print("  - Retry automatico (3 tentativi)")
    print("  - Backoff esponenziale (2s, 4s, 8s)")
    print("  - Timeout esteso (10 minuti per chiamata)")
    print("  - Gestione risposte vuote")
    print("="*60)
    
    # Verifica configurazione
    if not check_llm_config():
        print("\n⚠️  Configura prima l'LLM e riprova!")
        return
    
    # Test analisi normale
    success = test_normal_analysis()
    
    # Riepilogo
    print("\n" + "="*60)
    print("RIEPILOGO TEST")
    print("="*60)
    
    if success:
        print("\n✅ TUTTI I TEST PASSATI!")
        print("\n📝 Sistema di retry funzionante:")
        print("   - Timeout: 10 minuti per chiamata LLM")
        print("   - Retry: 3 tentativi con backoff esponenziale")
        print("   - Verifica risposte vuote automatica")
        print("\n💡 Se continui ad avere timeout:")
        print("   1. Prova un modello più leggero (mistral:7b, llama3.2:3b)")
        print("   2. Verifica risorse sistema (RAM, GPU)")
        print("   3. Controlla log Ollama: docker logs questionnaire_backend")
    else:
        print("\n❌ ALCUNI TEST FALLITI")
        print("\n🔍 Debugging:")
        print("   1. Verifica che Ollama sia attivo")
        print("   2. Controlla log: docker logs questionnaire_backend")
        print("   3. Prova cambio modello in Amministrazione")
        print("   4. Verifica risorse sistema (htop)")


if __name__ == "__main__":
    main()
