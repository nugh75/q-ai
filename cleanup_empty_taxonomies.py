# Script di Pulizia Analisi Qualitative Vuote

import requests
import sys

# Configurazione
BASE_URL = "http://localhost:8118"
ADMIN_PASSWORD = "admin123"  # Modifica con la tua password

def cleanup_empty_taxonomies():
    """Elimina tutte le tassonomie senza risultati di classificazione"""
    
    print("🧹 Pulizia tassonomie vuote...")
    
    try:
        response = requests.delete(
            f"{BASE_URL}/api/qualitative-analysis/cleanup-empty",
            params={"password": ADMIN_PASSWORD},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Pulizia completata!")
            print(f"   - Tassonomie eliminate: {result['deleted_taxonomies']}")
            print(f"   - Annotazioni eliminate: {result['deleted_annotations']}")
            if result['taxonomy_ids']:
                print(f"   - IDs eliminati: {result['taxonomy_ids']}")
            return True
        elif response.status_code == 401:
            print("❌ Errore: Password amministratore non corretta")
            return False
        else:
            print(f"❌ Errore {response.status_code}: {response.text}")
            return False
    
    except requests.exceptions.ConnectionError:
        print("❌ Errore: Impossibile connettersi al server")
        print("   Assicurati che il backend sia in esecuzione su http://localhost:8118")
        return False
    except Exception as e:
        print(f"❌ Errore: {str(e)}")
        return False


def list_taxonomies():
    """Mostra lista tassonomie salvate (solo quelle con risultati)"""
    
    print("\n📋 Tassonomie salvate:")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/qualitative-analysis/taxonomies",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            taxonomies = result['taxonomies']
            
            if not taxonomies:
                print("   Nessuna tassonomia trovata")
                return
            
            print(f"   Totale: {result['total']}\n")
            
            for tax in taxonomies:
                print(f"   ID {tax['id']}: {tax['field_key']} ({tax['respondent_type']})")
                print(f"      Categorie: {tax['n_clusters']}, Risposte: {tax['n_responses']}")
                print(f"      Creata: {tax['created_at']}")
                print()
        else:
            print(f"❌ Errore {response.status_code}: {response.text}")
    
    except Exception as e:
        print(f"❌ Errore: {str(e)}")


if __name__ == "__main__":
    print("="*60)
    print("PULIZIA ANALISI QUALITATIVE VUOTE")
    print("="*60)
    print()
    
    # Mostra lista corrente
    list_taxonomies()
    
    # Chiedi conferma
    print("\n⚠️  Questa operazione eliminerà tutte le tassonomie senza")
    print("   risultati di classificazione (dove nessuna risposta è stata")
    print("   assegnata a nessuna categoria).")
    print()
    
    confirm = input("Vuoi procedere? (s/n): ")
    
    if confirm.lower() == 's':
        success = cleanup_empty_taxonomies()
        
        if success:
            print("\n📋 Tassonomie rimanenti dopo pulizia:")
            list_taxonomies()
    else:
        print("\n❌ Operazione annullata")
    
    print("\n" + "="*60)
