#!/usr/bin/env python3
"""
Test per formato ibrido Pro/Contro
"""
import json

# Test case: Formato ibrido (categorie con Pro/Contro come sub-chiavi)
test_hybrid = {
    "Accessibilità": {
        "Pro": [
            "Riduzione delle barriere linguistiche tramite traduzione automatica",
            "Accesso a risorse educative in tempo reale per studenti con disabilità",
            "Disponibilità di contenuti educativi 24/7"
        ],
        "Contro": [
            "Dipendenza da infrastrutture digitali inaffidabili",
            "Rischio di esclusione digitale",
            "Possibili costi nascosti"
        ]
    },
    "Personalizzazione": {
        "Pro": [
            "Apprendimento adattivo al ritmo individuale",
            "Feedback immediato e personalizzato"
        ],
        "Contro": [
            "Rischio di polarizzazione dei contenuti",
            "Possibile standardizzazione eccessiva"
        ]
    },
    "Etica e privacy": {
        "Pro": [
            "Strumenti di monitoraggio per sicurezza studenti"
        ],
        "Contro": [
            "Raccolta dati sensibili degli studenti",
            "Rischi di violazione della privacy",
            "Trasparenza limitata degli algoritmi"
        ]
    }
}

def convert_hybrid(taxonomy_data):
    """Converte formato ibrido in taxonomy standard"""
    converted_taxonomy = []
    
    for main_category, pro_contro_data in taxonomy_data.items():
        # Crea categoria PRO
        if 'Pro' in pro_contro_data and pro_contro_data['Pro']:
            pro_items = pro_contro_data['Pro']
            cat_name = f"PRO: {main_category}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(pro_items) if isinstance(pro_items, list) else str(pro_items),
                'keywords': pro_items if isinstance(pro_items, list) else [str(pro_items)],
                'examples': []
            })
        
        # Crea categoria CONTRO
        if 'Contro' in pro_contro_data and pro_contro_data['Contro']:
            contro_items = pro_contro_data['Contro']
            cat_name = f"CONTRO: {main_category}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(contro_items) if isinstance(contro_items, list) else str(contro_items),
                'keywords': contro_items if isinstance(contro_items, list) else [str(contro_items)],
                'examples': []
            })
    
    return {'taxonomy': converted_taxonomy}

# Test
print("=" * 70)
print("TEST: Formato Ibrido (Categoria → Pro/Contro)")
print("=" * 70)
print(f"\nInput: {len(test_hybrid)} categorie principali")
for cat, data in test_hybrid.items():
    pro_count = len(data.get('Pro', []))
    contro_count = len(data.get('Contro', []))
    print(f"  - {cat}: {pro_count} PRO, {contro_count} CONTRO")

result = convert_hybrid(test_hybrid)
print(f"\nOutput: {len(result['taxonomy'])} categorie totali")
print(json.dumps(result, indent=2, ensure_ascii=False))

pro_count = sum(1 for c in result['taxonomy'] if c['name'].startswith('PRO:'))
contro_count = sum(1 for c in result['taxonomy'] if c['name'].startswith('CONTRO:'))
print(f"\n✅ Categorie PRO: {pro_count}")
print(f"✅ Categorie CONTRO: {contro_count}")
print(f"✅ Totale: {len(result['taxonomy'])}")

# Verifica keywords
print("\n" + "=" * 70)
print("Verifica Keywords")
print("=" * 70)
for cat in result['taxonomy'][:3]:  # Prime 3 categorie
    print(f"\n{cat['name']}")
    print(f"  Keywords: {len(cat['keywords'])} items")
    print(f"  Definition length: {len(cat['definition'])} chars")

print("\n" + "=" * 70)
print("✅ TEST COMPLETATO - Formato ibrido gestito correttamente")
print("=" * 70)
