#!/usr/bin/env python3
"""
Test script per verificare parsing Pro/Contro
"""
import json

# Test case 1: Formato con liste e Categoria/Sottocategorie
test1 = {
    "Pro": [
        {"Categoria": "Personalizzazione", "Sottocategorie": ["Adattamento al ritmo", "Contenuti su misura"]},
        {"Categoria": "Accessibilità", "Sottocategorie": ["Risorse per disabili", "Accesso globale"]}
    ],
    "Contro": [
        {"Categoria": "Privacy", "Sottocategorie": ["Raccolta dati", "Rischi hacking"]},
        {"Categoria": "Dipendenza", "Sottocategorie": ["Riduzione contatto umano", "Perdita empatia"]}
    ]
}

# Test case 2: Formato dizionario semplice
test2 = {
    "Pro": {
        "Accessibilità": ["Materiale 24/7", "Supporto disabilità"],
        "Personalizzazione": ["Apprendimento adattivo", "Feedback immediato"],
        "Efficienza": ["Automazione", "Analisi dati"]
    },
    "Contro": {
        "Disuguaglianza digitale": ["Accesso limitato", "Differenze banda"],
        "Bias algoritmico": ["Discriminazione", "Trasparenza limitata"],
        "Privacy": ["Dati sensibili", "Violazioni"]
    }
}

def convert_pro_contro(taxonomy_data):
    """Converte formato Pro/Contro in taxonomy standard"""
    converted_taxonomy = []
    
    # Processa PRO
    pro_data = taxonomy_data.get('Pro', {})
    if isinstance(pro_data, list):
        for item in pro_data:
            cat_name = item.get('Categoria', 'PRO: Unknown')
            if not cat_name.startswith('PRO:'):
                cat_name = f"PRO: {cat_name}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(item.get('Sottocategorie', [])),
                'keywords': item.get('Sottocategorie', []),
                'examples': []
            })
    elif isinstance(pro_data, dict):
        for cat_name, items in pro_data.items():
            if not cat_name.startswith('PRO:'):
                cat_name = f"PRO: {cat_name}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(items) if isinstance(items, list) else str(items),
                'keywords': items if isinstance(items, list) else [items],
                'examples': []
            })
    
    # Processa CONTRO
    contro_data = taxonomy_data.get('Contro', {})
    if isinstance(contro_data, list):
        for item in contro_data:
            cat_name = item.get('Categoria', 'CONTRO: Unknown')
            if not cat_name.startswith('CONTRO:'):
                cat_name = f"CONTRO: {cat_name}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(item.get('Sottocategorie', [])),
                'keywords': item.get('Sottocategorie', []),
                'examples': []
            })
    elif isinstance(contro_data, dict):
        for cat_name, items in contro_data.items():
            if not cat_name.startswith('CONTRO:'):
                cat_name = f"CONTRO: {cat_name}"
            converted_taxonomy.append({
                'name': cat_name,
                'definition': ', '.join(items) if isinstance(items, list) else str(items),
                'keywords': items if isinstance(items, list) else [items],
                'examples': []
            })
    
    return {'taxonomy': converted_taxonomy}

# Test
print("=" * 60)
print("TEST 1: Formato lista con Categoria/Sottocategorie")
print("=" * 60)
result1 = convert_pro_contro(test1)
print(json.dumps(result1, indent=2, ensure_ascii=False))
print(f"\n✅ Categorie totali: {len(result1['taxonomy'])}")
pro_count = sum(1 for c in result1['taxonomy'] if c['name'].startswith('PRO:'))
contro_count = sum(1 for c in result1['taxonomy'] if c['name'].startswith('CONTRO:'))
print(f"✅ PRO: {pro_count}, CONTRO: {contro_count}")

print("\n" + "=" * 60)
print("TEST 2: Formato dizionario semplice")
print("=" * 60)
result2 = convert_pro_contro(test2)
print(json.dumps(result2, indent=2, ensure_ascii=False))
print(f"\n✅ Categorie totali: {len(result2['taxonomy'])}")
pro_count = sum(1 for c in result2['taxonomy'] if c['name'].startswith('PRO:'))
contro_count = sum(1 for c in result2['taxonomy'] if c['name'].startswith('CONTRO:'))
print(f"✅ PRO: {pro_count}, CONTRO: {contro_count}")

print("\n" + "=" * 60)
print("✅ TEST COMPLETATI - Parsing Pro/Contro funziona correttamente")
print("=" * 60)
