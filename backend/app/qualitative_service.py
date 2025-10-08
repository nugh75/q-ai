"""
Servizio per analisi qualitativa con LLM configurabile
Supporta: Ollama, Gemini, OpenAI
"""
import json
import logging
import requests
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import LLMConfig, QualitativeTaxonomy, QualitativeAnnotation

logger = logging.getLogger(__name__)


class QualitativeAnalysisService:
    """Servizio principale per analisi qualitativa"""
    
    def __init__(self, db: Session):
        self.db = db
        self.llm_config = self._get_active_llm_config()
    
    def _get_active_llm_config(self) -> Optional[LLMConfig]:
        """Ottiene la configurazione LLM attiva"""
        return self.db.query(LLMConfig).filter(LLMConfig.is_active == 1).first()
    
    def _call_llm_with_retry(self, prompt: str, system_prompt: str = None, max_retries: int = 3) -> str:
        """
        Chiama l'LLM con retry logic e backoff esponenziale
        
        Args:
            prompt: Prompt principale
            system_prompt: System prompt opzionale
            max_retries: Numero massimo di tentativi
            
        Returns:
            Risposta dell'LLM
            
        Raises:
            Exception: Se tutti i tentativi falliscono
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Tentativo {attempt + 1}/{max_retries} chiamata LLM")
                
                response = self._call_llm(prompt, system_prompt)
                
                # Verifica risposta non vuota
                if not response or not response.strip():
                    raise ValueError("LLM ha restituito una risposta vuota")
                
                logger.info(f"✅ LLM risposta OK (lunghezza: {len(response)} caratteri)")
                return response
                
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                last_error = e
                error_type = "timeout" if isinstance(e, requests.exceptions.Timeout) else "connessione"
                logger.warning(f"⚠️  Errore {error_type} tentativo {attempt + 1}/{max_retries}: {str(e)}")
                
                if attempt < max_retries - 1:
                    # Backoff esponenziale: 2s, 4s, 8s
                    wait_time = 2 ** (attempt + 1)
                    logger.info(f"⏳ Attendo {wait_time}s prima del prossimo tentativo...")
                    time.sleep(wait_time)
                    
            except ValueError as e:
                # Risposta vuota o errore di formato
                last_error = e
                logger.warning(f"⚠️  Risposta vuota/invalida tentativo {attempt + 1}/{max_retries}: {str(e)}")
                
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.info(f"⏳ Attendo {wait_time}s prima del prossimo tentativo...")
                    time.sleep(wait_time)
                    
            except Exception as e:
                # Altri errori (es. modello non trovato, errore API)
                logger.error(f"❌ Errore non recuperabile: {type(e).__name__} - {str(e)}")
                raise
        
        # Tutti i tentativi falliti
        error_msg = f"Errore: LLM ha restituito una risposta vuota dopo {max_retries} tentativi. "
        error_msg += "Possibili cause: timeout del modello, modello sovraccarico, o errore di connessione. "
        error_msg += "Riprova o cambia modello (prova 'mistral:7b' o 'deepseek-r1:8b')."
        
        logger.error(f"❌ {error_msg}")
        logger.error(f"Ultimo errore: {type(last_error).__name__} - {str(last_error)}")
        
        raise Exception(error_msg)
    
    def _call_llm(self, prompt: str, system_prompt: str = None) -> str:
        """Chiama l'LLM configurato"""
        if not self.llm_config:
            raise ValueError("Nessuna configurazione LLM attiva. Configura l'LLM in Amministrazione.")
        
        provider = self.llm_config.provider
        
        try:
            if provider == 'ollama':
                return self._call_ollama(prompt, system_prompt)
            elif provider == 'gemini':
                return self._call_gemini(prompt, system_prompt)
            elif provider == 'openai':
                return self._call_openai(prompt, system_prompt)
            else:
                raise ValueError(f"Provider non supportato: {provider}")
        except Exception as e:
            logger.error(f"Errore chiamata LLM ({provider}): {str(e)}")
            raise
    
    def _call_ollama(self, prompt: str, system_prompt: str = None) -> str:
        """Chiama Ollama locale (API chat endpoint)"""
        url = f"{self.llm_config.endpoint}/api/chat"
        
        logger.info(f"Ollama request: {url} - model: {self.llm_config.model_name}")
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})  # NON troncare il prompt!
        
        payload = {
            "model": self.llm_config.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 2048  # Ridotto per evitare JSON troncati
            }
        }
        
        try:
            # Timeout più lungo per modelli pesanti (600s = 10 minuti)
            response = requests.post(url, json=payload, timeout=600)
            logger.info(f"Ollama response status: {response.status_code}")
            
            if response.status_code == 404:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get('error', 'Modello non trovato')
                logger.error(f"Ollama error: {error_msg}")
                raise ValueError(f"Modello Ollama '{self.llm_config.model_name}' non trovato. Verifica la configurazione in Amministrazione.")
            
            if response.status_code == 503:
                # Service unavailable - modello sovraccarico
                logger.warning(f"Ollama service unavailable (503) - modello potrebbe essere sovraccarico")
                raise requests.exceptions.ConnectionError("Ollama service unavailable - modello sovraccarico")
            
            if response.status_code != 200:
                logger.error(f"Ollama error response: {response.text[:500]}")
            
            response.raise_for_status()
            
            result = response.json()
            content = result.get('message', {}).get('content', '')
            
            if not content or not content.strip():
                logger.warning(f"⚠️  Ollama ha restituito una risposta vuota (response body: {str(result)[:200]})")
                raise ValueError("Ollama ha restituito una risposta vuota")
            
            logger.info(f"Ollama response length: {len(content)} chars")
            return content
            
        except ValueError:
            raise
        except requests.exceptions.Timeout as e:
            logger.error(f"❌ Ollama timeout dopo {payload.get('options', {}).get('timeout', 600)}s")
            raise
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Errore di connessione Ollama: {str(e)}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama request failed: {type(e).__name__} - {str(e)}")
            raise
    
    def _call_gemini(self, prompt: str, system_prompt: str = None) -> str:
        """Chiama Gemini API"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.llm_config.model_name}:generateContent?key={self.llm_config.api_key}"
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        payload = {
            "contents": [{
                "parts": [{"text": full_prompt}]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    
    def _call_openai(self, prompt: str, system_prompt: str = None) -> str:
        """Chiama OpenAI API"""
        url = "https://api.openai.com/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.llm_config.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.llm_config.model_name,
            "messages": messages,
            "temperature": 0.3
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=300)
        response.raise_for_status()
        
        return response.json()['choices'][0]['message']['content']
    
    def generate_taxonomy(
        self, 
        responses: List[str], 
        question_field: str,
        max_categories: int = 12,
        template_name: str = "custom"
    ) -> Dict[str, Any]:
        """
        FASE 1-2: Genera tassonomia da risposte aperte
        
        Args:
            responses: Lista di risposte testuali
            question_field: Campo domanda ('learning_improvement', etc.)
            max_categories: Numero massimo di categorie
            template_name: Nome del template da usare (sentiment, thematic, suggestions, etc.)
        
        Returns:
            Tassonomia con categorie, definizioni, keywords
        """
        import random
        from .qualitative_templates import format_prompt, ANALYSIS_TEMPLATES
        from .models import QualitativePrompt
        
        # OTTIMIZZAZIONE: Filtra risposte troppo corte (< 10 caratteri)
        filtered_responses = [r for r in responses if len(r.strip()) >= 10]
        logger.info(f"Risposte originali: {len(responses)}, dopo filtro (>=10 char): {len(filtered_responses)}")
        
        # OTTIMIZZAZIONE: Prendi casualmente il 50% delle risposte
        sample_size = max(10, len(filtered_responses) // 2)  # Minimo 10 risposte
        sampled_responses = random.sample(filtered_responses, min(sample_size, len(filtered_responses)))
        logger.info(f"Risposte campionate (50%): {len(sampled_responses)}")
        
        # Prepara prompt per LLM (max 50 risposte)
        responses_text = "\n".join([f"{i+1}. {resp[:200]}" for i, resp in enumerate(sampled_responses[:50])])
        
        # Numero di risposte effettivamente inviate all'LLM
        n_responses_for_llm = min(len(sampled_responses), 50)
        
        # NUOVO: Imposta minimo 20 categorie per analisi più dettagliata
        adjusted_max_categories = max(max_categories, 20)
        logger.info(f"Richiedendo almeno {adjusted_max_categories} categorie (originale: {max_categories})")
        
        # Controlla se esiste prompt personalizzato nel DB
        custom_prompt = self.db.query(QualitativePrompt).filter(
            QualitativePrompt.template_key == template_name,
            QualitativePrompt.is_active == 1
        ).first()
        
        if custom_prompt:
            # Usa prompt personalizzato
            system_prompt = custom_prompt.system_prompt
            user_prompt = custom_prompt.user_prompt_template.format(
                responses_text=responses_text,
                n_responses=n_responses_for_llm,
                max_categories=adjusted_max_categories
            )
            logger.info(f"Usando prompt personalizzato: {template_name}")
        else:
            # Usa template di default
            system_prompt, user_prompt = format_prompt(
                template_name=template_name,
                responses_text=responses_text,
                n_responses=n_responses_for_llm,
                max_categories=adjusted_max_categories
            )
            logger.info(f"Usando prompt di default: {template_name}")

        # Chiama LLM con retry automatico
        response = self._call_llm_with_retry(user_prompt, system_prompt, max_retries=3)
        
        # Parse JSON
        try:
            # Rimuovi markdown se presente
            response = response.strip()
            logger.info(f"Raw LLM response length: {len(response)} chars")
            logger.info(f"Raw LLM response (primi 500 chars): {response[:500]}")
            logger.info(f"Raw LLM response (ultimi 500 chars): {response[-500:]}")
            
            # Rimuovi blocchi markdown ```json ... ```
            if response.startswith("```json"):
                response = response.split("```json")[1].split("```")[0]
            elif response.startswith("```"):
                response = response.split("```")[1].split("```")[0]
            
            # Rimuovi titoli Markdown (## Tassonomia ..., # Analisi ..., etc.)
            lines = response.split('\n')
            cleaned_lines = []
            for line in lines:
                stripped = line.strip()
                # Salta linee che sono titoli Markdown o vuote prima del JSON
                if stripped.startswith('#') or (not stripped and not cleaned_lines):
                    continue
                cleaned_lines.append(line)
            response = '\n'.join(cleaned_lines)
            
            response = response.strip()
            
            # Controlla ancora dopo pulizia
            if not response or len(response) == 0:
                raise ValueError("LLM ha restituito solo markdown vuoto. Riprova o cambia modello.")
            
            # Prova a estrarre JSON se è annidato in testo
            if '{' in response and '}' in response:
                # Trova il primo { e l'ultimo }
                start = response.find('{')
                end = response.rfind('}') + 1
                response = response[start:end]
            
            # Tenta di riparare JSON troncato o malformato
            try:
                taxonomy_data = json.loads(response)
            except json.JSONDecodeError as e:
                logger.warning(f"Primo tentativo di parsing fallito: {str(e)}")
                logger.info(f"Tentativo di riparazione JSON...")
                
                # Se il JSON è troncato, prova a chiuderlo
                if not response.rstrip().endswith('}'):
                    # Conta le parentesi aperte/chiuse
                    open_braces = response.count('{')
                    close_braces = response.count('}')
                    open_brackets = response.count('[')
                    close_brackets = response.count(']')
                    
                    # Aggiungi le chiusure mancanti
                    if open_brackets > close_brackets:
                        response += ']' * (open_brackets - close_brackets)
                    if open_braces > close_braces:
                        response += '}' * (open_braces - close_braces)
                    
                    logger.info(f"JSON riparato, lunghezza: {len(response)}")
                    taxonomy_data = json.loads(response)
                else:
                    # Se il problema è nel mezzo, prova a trovare l'ultimo array completo
                    # e tronca lì
                    last_complete = response.rfind('}')
                    if last_complete > 0:
                        test_response = response[:last_complete+1]
                        # Aggiungi chiusure necessarie
                        open_brackets = test_response.count('[')
                        close_brackets = test_response.count(']')
                        if open_brackets > close_brackets:
                            test_response += ']' * (open_brackets - close_brackets)
                        
                        open_braces = test_response.count('{')
                        close_braces = test_response.count('}')
                        if open_braces > close_braces:
                            test_response += '}' * (open_braces - close_braces)
                        
                        logger.info(f"Tentativo con JSON troncato: {len(test_response)} chars")
                        taxonomy_data = json.loads(test_response)
                    else:
                        raise
            logger.info(f"Parsed taxonomy structure: {list(taxonomy_data.keys())}")
            
            # Gestisci formato IBRIDO: {"Categoria1": {"Pro": [...], "Contro": [...]}, "Categoria2": {...}}
            if isinstance(taxonomy_data, dict) and len(taxonomy_data) > 0:
                # Verifica se tutte le chiavi sono dizionari con Pro/Contro
                first_key = list(taxonomy_data.keys())[0]
                if isinstance(taxonomy_data[first_key], dict) and ('Pro' in taxonomy_data[first_key] or 'Contro' in taxonomy_data[first_key]):
                    logger.info("Rilevato formato ibrido (categorie con Pro/Contro), conversione in taxonomy standard...")
                    converted_taxonomy = []
                    
                    for main_category, pro_contro_data in taxonomy_data.items():
                        # Per ogni categoria principale, crea sotto-categorie PRO e CONTRO
                        if 'Pro' in pro_contro_data and pro_contro_data['Pro']:
                            pro_items = pro_contro_data['Pro']
                            cat_name = f"PRO: {main_category}"
                            converted_taxonomy.append({
                                'name': cat_name,
                                'definition': ', '.join(pro_items) if isinstance(pro_items, list) else str(pro_items),
                                'keywords': pro_items if isinstance(pro_items, list) else [str(pro_items)],
                                'examples': []
                            })
                        
                        if 'Contro' in pro_contro_data and pro_contro_data['Contro']:
                            contro_items = pro_contro_data['Contro']
                            cat_name = f"CONTRO: {main_category}"
                            converted_taxonomy.append({
                                'name': cat_name,
                                'definition': ', '.join(contro_items) if isinstance(contro_items, list) else str(contro_items),
                                'keywords': contro_items if isinstance(contro_items, list) else [str(contro_items)],
                                'examples': []
                            })
                    
                    taxonomy_data = {'taxonomy': converted_taxonomy}
                    logger.info(f"Convertito formato ibrido in {len(converted_taxonomy)} categorie")
            
            # Gestisci formato PRO/CONTRO specifico
            if 'Pro' in taxonomy_data and 'Contro' in taxonomy_data:
                logger.info("Rilevato formato Pro/Contro, conversione in taxonomy standard...")
                converted_taxonomy = []
                
                # Processa PRO
                pro_data = taxonomy_data['Pro']
                if isinstance(pro_data, list):
                    # Formato: [{"Categoria": "X", "Sottocategorie": [...]}, ...] o [{"categoria": "X", "sottocategorie": [...]}, ...]
                    for item in pro_data:
                        # Supporta sia maiuscole che minuscole
                        cat_name = (item.get('Categoria') or item.get('categoria') or 
                                   item.get('name') or item.get('nome') or 'Unknown')
                        sottocategorie = (item.get('Sottocategorie') or item.get('sottocategorie') or 
                                        item.get('keywords') or item.get('parole_chiave') or [])
                        
                        if cat_name == 'Unknown':
                            logger.warning(f"Categoria PRO senza nome valido: {item}")
                        
                        if not cat_name.startswith('PRO:'):
                            cat_name = f"PRO: {cat_name}"
                        
                        # Crea una definizione leggibile dalle sottocategorie
                        if sottocategorie:
                            definition = f"Aspetti positivi: {', '.join(sottocategorie)}"
                        else:
                            definition = item.get('definition') or item.get('descrizione') or 'Aspetti positivi'
                        
                        converted_taxonomy.append({
                            'name': cat_name,
                            'definition': definition,
                            'keywords': sottocategorie if isinstance(sottocategorie, list) else [sottocategorie],
                            'examples': item.get('examples', item.get('esempi', []))
                        })
                elif isinstance(pro_data, dict):
                    # Formato: {"Accessibilità": [...], "Personalizzazione": [...]}
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
                contro_data = taxonomy_data['Contro']
                if isinstance(contro_data, list):
                    for item in contro_data:
                        # Supporta sia maiuscole che minuscole
                        cat_name = (item.get('Categoria') or item.get('categoria') or 
                                   item.get('name') or item.get('nome') or 'Unknown')
                        sottocategorie = (item.get('Sottocategorie') or item.get('sottocategorie') or 
                                        item.get('keywords') or item.get('parole_chiave') or [])
                        
                        if cat_name == 'Unknown':
                            logger.warning(f"Categoria CONTRO senza nome valido: {item}")
                        
                        if not cat_name.startswith('CONTRO:'):
                            cat_name = f"CONTRO: {cat_name}"
                        
                        # Crea una definizione leggibile dalle sottocategorie
                        if sottocategorie:
                            definition = f"Aspetti negativi: {', '.join(sottocategorie)}"
                        else:
                            definition = item.get('definition') or item.get('descrizione') or 'Aspetti negativi'
                        
                        converted_taxonomy.append({
                            'name': cat_name,
                            'definition': definition,
                            'keywords': sottocategorie if isinstance(sottocategorie, list) else [sottocategorie],
                            'examples': item.get('examples', item.get('esempi', []))
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
                
                taxonomy_data = {'taxonomy': converted_taxonomy}
                logger.info(f"Convertito Pro/Contro in {len(converted_taxonomy)} categorie")
            
            # Gestisci diverse strutture possibili
            if 'taxonomy' not in taxonomy_data:
                # Prova strutture alternative
                if 'categories' in taxonomy_data:
                    taxonomy_data['taxonomy'] = taxonomy_data.pop('categories')
                elif 'categorie' in taxonomy_data:
                    taxonomy_data['taxonomy'] = taxonomy_data.pop('categorie')
                elif 'taxonomia' in taxonomy_data:
                    # L'LLM può usare la parola italiana 'taxonomia'
                    taxonomy_data['taxonomy'] = taxonomy_data.pop('taxonomia')
                elif 'tassonomia' in taxonomy_data:
                    # Possibile variante italiana
                    taxonomy_data['taxonomy'] = taxonomy_data.pop('tassonomia')
                elif isinstance(taxonomy_data, list):
                    # Se la risposta è direttamente una lista di categorie
                    taxonomy_data = {'taxonomy': taxonomy_data}
                else:
                    # Ultimo tentativo: usa il primo campo che contiene una lista
                    for key, value in taxonomy_data.items():
                        if isinstance(value, list) and len(value) > 0:
                            logger.warning(f"Usando campo '{key}' come taxonomy (non standard)")
                            taxonomy_data['taxonomy'] = taxonomy_data.pop(key)
                            break
                    
                    # Se ancora non abbiamo trovato nulla
                    if 'taxonomy' not in taxonomy_data:
                        # Log per debug
                        logger.error(f"Struttura JSON inaspettata: {json.dumps(taxonomy_data, ensure_ascii=False)[:500]}")
                        raise ValueError(f"Struttura JSON non valida: campo 'taxonomy' mancante. Campi presenti: {list(taxonomy_data.keys())}")
            
            # Normalizza e valida ogni categoria
            normalized_taxonomy = []
            for idx, cat in enumerate(taxonomy_data.get('taxonomy', [])):
                # Supporta diversi formati di campo
                normalized_cat = {
                    'name': cat.get('name') or cat.get('category') or cat.get('nome') or f"Categoria {idx+1}",
                    'definition': cat.get('definition') or cat.get('descrizione') or cat.get('description') or "Nessuna definizione",
                    'keywords': cat.get('keywords') or cat.get('parole_chiave') or cat.get('key_words') or [],
                    'examples': cat.get('examples') or cat.get('esempi') or []
                }
                
                # Assicura che keywords sia una lista
                if isinstance(normalized_cat['keywords'], str):
                    normalized_cat['keywords'] = [normalized_cat['keywords']]
                
                # Assicura che examples sia una lista
                if isinstance(normalized_cat['examples'], str):
                    normalized_cat['examples'] = [normalized_cat['examples']]
                
                normalized_taxonomy.append(normalized_cat)
            
            taxonomy_data['taxonomy'] = normalized_taxonomy
            logger.info(f"Tassonomia normalizzata: {len(normalized_taxonomy)} categorie")
            
            return taxonomy_data
        
        except json.JSONDecodeError as e:
            logger.error(f"Errore parsing JSON tassonomia: {str(e)}")
            logger.error(f"Risposta LLM (primi 1000 chars): {response[:1000]}")
            raise ValueError(f"LLM ha restituito JSON non valido. Errore: {str(e)}. Prova con un modello diverso o riduci il numero di risposte.")
    
    def classify_response(
        self, 
        response_text: str, 
        taxonomy: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        FASE 3: Classifica una singola risposta con multi-label
        
        Args:
            response_text: Testo della risposta
            taxonomy: Lista di categorie con definizioni
        
        Returns:
            Lista di label con confidence e frasi rilevanti
        """
        # Debug: verifica struttura taxonomy
        logger.info(f"Taxonomy ricevuta: {len(taxonomy)} categorie")
        if len(taxonomy) > 0:
            logger.info(f"Prima categoria structure: {list(taxonomy[0].keys()) if isinstance(taxonomy[0], dict) else 'not a dict'}")
        
        # Prepara elenco nomi categorie in modo chiaro
        category_names = [cat.get('name', 'Categoria') for cat in taxonomy]
        logger.info(f"Category names extracted: {category_names[:5]}...")  # Primi 5
        
        categories_list = "\n".join([f"{i+1}. {name}" for i, name in enumerate(category_names)])
        
        # Crea anche una descrizione con keywords per aiutare il matching
        categories_with_keywords = "\n".join([
            f"- {cat.get('name', 'Categoria')}: parole chiave → {', '.join(cat.get('keywords', [])[:3])}"
            for cat in taxonomy[:15]  # Limita a 15 per evitare prompt troppo lunghi
        ])
        
        logger.info(f"Categories list length: {len(categories_list)} chars")
        logger.info(f"Categories with keywords length: {len(categories_with_keywords)} chars")
        
        # Few-shot prompt con esempi concreti - funziona meglio con modelli locali
        # Prendi prime 2 categorie per esempi
        example_cat1 = category_names[0] if len(category_names) > 0 else "Categoria A"
        example_cat2 = category_names[1] if len(category_names) > 1 else "Categoria B"
        
        system_prompt = None  # Alcuni modelli locali funzionano meglio senza system prompt
        
        # Prompt con esempi concreti
        user_prompt = f"""Classifica questa risposta nelle categorie appropriate.

CATEGORIE DISPONIBILI:
{categories_list}

ESEMPI:
Risposta: "Mi piace molto, è fantastico!"
Output: {{"labels": [{{"category": "{example_cat1}", "confidence": 0.9, "relevant_phrase": "Mi piace molto"}}]}}

Risposta: "È utile per studiare"
Output: {{"labels": [{{"category": "{example_cat2}", "confidence": 0.7, "relevant_phrase": "utile per studiare"}}]}}

Risposta: "Non so cosa dire"
Output: {{"labels": []}}

ORA CLASSIFICA QUESTA RISPOSTA:
Risposta: "{response_text}"
Output:"""
        
        logger.info(f"Final user prompt length: {len(user_prompt)} chars")

        # Chiama LLM con retry automatico
        response = self._call_llm_with_retry(user_prompt, system_prompt, max_retries=3)
        
        # Parse JSON
        try:
            response = response.strip()
            logger.info(f"Raw classification response (length {len(response)}): {response}")
            
            # Rimuovi markdown se presente
            if response.startswith("```json"):
                response = response.split("```json")[1].split("```")[0]
            elif response.startswith("```"):
                response = response.split("```")[1].split("```")[0]
            
            response = response.strip()
            
            # Se la risposta è troppo corta, probabilmente non è JSON valido
            if len(response) < 20:
                logger.warning(f"Risposta troppo corta ({len(response)} chars), probabilmente non valida: {response}")
                # Prova a interpretare risposte semplici
                if "[]" in response or "labels: []" in response.lower():
                    logger.info("Interpretato come array vuoto")
                    return []
                else:
                    logger.warning("Impossibile parsare, ritorno array vuoto")
                    return []
            
            # Prova a estrarre JSON se è annidato in testo
            if '{' in response and '}' in response:
                start = response.find('{')
                end = response.rfind('}') + 1
                response = response[start:end]
            
            classification = json.loads(response)
            
            # Gestisci vari formati possibili
            labels = None
            if 'labels' in classification:
                labels = classification['labels']
            elif 'categories' in classification:
                labels = classification['categories']
            elif 'categorie' in classification:
                labels = classification['categorie']
            elif isinstance(classification, list):
                # Se la risposta è direttamente una lista
                labels = classification
            else:
                logger.warning(f"Struttura JSON inaspettata per classification: {list(classification.keys())}")
                return []
            
            if not isinstance(labels, list):
                logger.warning(f"Labels non è una lista: {type(labels)}")
                return []
            
            # Normalizza le labels - potrebbero essere stringhe semplici invece di oggetti
            normalized_labels = []
            for label in labels:
                if isinstance(label, dict):
                    # Label è già un oggetto, normalizza i campi
                    normalized_labels.append({
                        'category': label.get('category') or label.get('categoria') or label.get('name') or label.get('nome') or '',
                        'confidence': label.get('confidence') or label.get('confidenza') or 0.5,
                        'relevant_phrase': label.get('relevant_phrase') or label.get('frase_rilevante') or label.get('phrase') or ''
                    })
                elif isinstance(label, str):
                    # Label è solo una stringa (nome categoria) - non ideale ma accettiamo
                    logger.warning(f"Label è stringa semplice invece di oggetto: '{label}'")
                    # Cerca di matchare con una categoria esistente
                    matching_cat = None
                    for cat in taxonomy:
                        if label.lower() in cat.get('name', '').lower() or cat.get('name', '').lower() in label.lower():
                            matching_cat = cat.get('name')
                            break
                    
                    if matching_cat:
                        normalized_labels.append({
                            'category': matching_cat,
                            'confidence': 0.5,
                            'relevant_phrase': response_text[:100]
                        })
                    else:
                        logger.warning(f"Impossibile matchare label stringa '{label}' con categorie disponibili")
                else:
                    logger.warning(f"Label ha tipo inaspettato: {type(label)}")
            
            logger.info(f"Parsed {len(normalized_labels)} normalized labels from classification")
            return normalized_labels
        
        except json.JSONDecodeError as e:
            logger.error(f"Errore parsing JSON classificazione: {str(e)}\nRisposta LLM: {response[:200]}")
            return []
    
    def calculate_cooccurrence(
        self, 
        annotations: List[QualitativeAnnotation]
    ) -> List[Dict[str, Any]]:
        """
        FASE 4: Calcola matrice co-occorrenza tra categorie
        
        Args:
            annotations: Lista annotazioni dal DB
        
        Returns:
            Lista co-occorrenze con conteggi
        """
        from collections import Counter
        
        # Conta co-occorrenze
        cooccurrence_counter = Counter()
        
        for ann in annotations:
            labels_data = ann.labels if isinstance(ann.labels, list) else []
            
            # Filtra label con confidence > 0.5
            categories = [
                label['category'] 
                for label in labels_data 
                if label.get('confidence', 0) > 0.5
            ]
            
            # Co-occorrenze (coppie)
            for i, cat_i in enumerate(categories):
                for cat_j in categories[i+1:]:
                    pair = tuple(sorted([cat_i, cat_j]))
                    cooccurrence_counter[pair] += 1
        
        # Converti in lista
        cooccurrence_list = [
            {
                'cat_i': pair[0],
                'cat_j': pair[1],
                'n': count,
                'percentage': round(count / len(annotations) * 100, 1) if annotations else 0
            }
            for pair, count in cooccurrence_counter.most_common(20)
        ]
        
        return cooccurrence_list
    
    def get_top_examples(
        self,
        annotations: List[QualitativeAnnotation],
        taxonomy: List[Dict[str, Any]],
        top_n: int = 3
    ) -> Dict[str, List[str]]:
        """
        FASE 4: Ottieni top N esempi per ogni categoria
        
        Args:
            annotations: Lista annotazioni
            taxonomy: Tassonomia
            top_n: Numero esempi per categoria
        
        Returns:
            Dict {category_name: [respondent_codes]}
        """
        from collections import defaultdict
        
        # Raggruppa per categoria con confidence score
        category_examples = defaultdict(list)
        
        for ann in annotations:
            labels_data = ann.labels if isinstance(ann.labels, list) else []
            
            for label in labels_data:
                category = label.get('category')
                confidence = label.get('confidence', 0)
                
                if category and confidence > 0.5:
                    category_examples[category].append({
                        'code': ann.respondent_code,
                        'text': ann.response_text,
                        'confidence': confidence
                    })
        
        # Ordina per confidence e prendi top N
        top_examples = {}
        for category in [cat['name'] for cat in taxonomy]:
            examples = category_examples.get(category, [])
            examples.sort(key=lambda x: x['confidence'], reverse=True)
            
            top_examples[category] = [
                {
                    'code': ex['code'],
                    'text': ex['text'][:200] + '...' if len(ex['text']) > 200 else ex['text'],
                    'confidence': round(ex['confidence'], 2)
                }
                for ex in examples[:top_n]
            ]
        
        return top_examples
    
    def generate_narrative_report(
        self,
        taxonomy: List[Dict[str, Any]],
        annotations: List[QualitativeAnnotation],
        question_text: str = "la domanda analizzata"
    ) -> str:
        """
        Genera un report narrativo discorsivo con citazioni dalle risposte
        
        Args:
            taxonomy: Tassonomia con categorie
            annotations: Annotazioni con risposte classificate
            question_text: Testo della domanda per contestualizzare
        
        Returns:
            Report in formato Markdown con analisi discorsiva e citazioni
        """
        from collections import defaultdict
        import random
        
        # Raggruppa risposte per categoria con confidence
        category_responses = defaultdict(list)
        
        for ann in annotations:
            labels_data = ann.labels if isinstance(ann.labels, list) else []
            
            for label in labels_data:
                category = label.get('category')
                confidence = label.get('confidence', 0)
                
                if category and confidence > 0.6:  # Solo alta confidence
                    category_responses[category].append({
                        'code': ann.respondent_code,
                        'text': ann.response_text,
                        'confidence': confidence
                    })
        
        # Prepara statistiche per categoria
        category_stats = []
        for cat in taxonomy:
            cat_name = cat.get('name', 'Categoria')
            responses = category_responses.get(cat_name, [])
            
            if responses:
                # Ordina per confidence e prendi migliori esempi
                responses.sort(key=lambda x: x['confidence'], reverse=True)
                top_responses = responses[:5]  # Max 5 citazioni per categoria
                
                category_stats.append({
                    'name': cat_name,
                    'definition': cat.get('definition', ''),
                    'keywords': cat.get('keywords', []),
                    'count': len(responses),
                    'percentage': round(len(responses) / len(annotations) * 100, 1),
                    'examples': top_responses
                })
        
        # Ordina categorie per numero di risposte
        category_stats.sort(key=lambda x: x['count'], reverse=True)
        
        # Crea prompt per report narrativo
        system_prompt = """Sei un esperto ricercatore qualitativo in scienze sociali e dell'educazione.
Il tuo compito è scrivere un report di analisi qualitativa in stile accademico ma accessibile,
integrando citazioni dirette dalle risposte degli intervistati per supportare le tue interpretazioni.

Usa uno stile narrativo e discorsivo, NON elenchi puntati. Intreccia citazioni e analisi in modo fluido.
Il report deve essere in ITALIANO, ben strutturato con paragrafi coerenti."""

        # Prepara statistiche per il prompt
        stats_text = "\n\n".join([
            f"**{cat['name']}** ({cat['count']} risposte, {cat['percentage']}%)\n"
            f"Definizione: {cat['definition']}\n"
            f"Parole chiave: {', '.join(cat['keywords'][:5])}\n"
            f"Esempi di risposte:\n" + 
            "\n".join([f'  - (Codice {ex["code"]}, confidence {ex["confidence"]:.2f}): "{ex["text"][:300]}{"..." if len(ex["text"]) > 300 else ""}"' 
                      for ex in cat['examples'][:3]])
            for cat in category_stats[:15]  # Top 15 categorie
        ])
        
        user_prompt = f"""Scrivi un report di analisi qualitativa discorsivo per la domanda: "{question_text}"

DATI ANALIZZATI:
- Totale risposte: {len(annotations)}
- Numero categorie identificate: {len(taxonomy)}

CATEGORIE PRINCIPALI CON ESEMPI:
{stats_text}

ISTRUZIONI PER IL REPORT:
1. Inizia con una panoramica generale delle risposte (1 paragrafo)
2. Per ogni categoria principale (top 8-10), scrivi un paragrafo che:
   - Descrive il tema/pattern emerso
   - Integra 2-3 citazioni dirette usando format: *"citazione"* (Codice XXX)
   - Interpreta il significato delle risposte
3. Concludi con una sintesi dei pattern trasversali e insight principali (1-2 paragrafi)

STILE RICHIESTO:
- Narrativo e discorsivo (NON elenchi puntati)
- Citazioni integrate nel testo con formato: *"citazione testuale"* (Codice XXX)
- Paragrafi ben strutturati con transizioni fluide
- Linguaggio accademico ma accessibile
- TUTTO IN ITALIANO

FORMATO OUTPUT:
Testo in Markdown con intestazioni (##) per le sezioni principali.
NON includere titolo H1, inizia direttamente con il contenuto.

Scrivi il report ora:"""

        try:
            logger.info("Generazione report narrativo in corso...")
            # Usa timeout più lungo per report complessi
            report_text = self._call_llm_with_retry(user_prompt, system_prompt, max_retries=2)
            
            logger.info(f"Report generato: {len(report_text)} caratteri")
            return report_text
            
        except Exception as e:
            logger.error(f"Errore generazione report: {str(e)}")
            # Fallback: genera report semplice
            fallback_report = self._generate_fallback_report(
                question_text, len(annotations), category_stats[:10]
            )
            return fallback_report
    
    def _generate_fallback_report(
        self,
        question_text: str,
        total_responses: int,
        top_categories: List[Dict[str, Any]]
    ) -> str:
        """Genera report semplice in caso di errore LLM"""
        
        report = f"""## Panoramica Generale

L'analisi qualitativa delle {total_responses} risposte alla domanda *"{question_text}"* ha rivelato {len(top_categories)} categorie tematiche principali che emergono dalle narrazioni degli intervistati.

"""
        
        for cat in top_categories[:8]:
            report += f"""## {cat['name']}

Un tema significativo emerso dall'analisi riguarda {cat['name'].lower()}, presente in {cat['count']} risposte ({cat['percentage']}% del campione). {cat['definition']}

"""
            
            # Aggiungi citazioni
            for ex in cat['examples'][:2]:
                report += f"""Come evidenziato da un rispondente: *"{ex['text'][:250]}{"..." if len(ex['text']) > 250 else ""}"* (Codice {ex['code']})

"""
        
        report += """## Considerazioni Conclusive

Le categorie emerse dall'analisi rivelano la complessità e la varietà delle prospettive degli intervistati, evidenziando sia convergenze che divergenze nelle loro esperienze e percezioni.
"""
        
        return report
    
    @staticmethod
    def get_ollama_models(endpoint: str) -> List[Dict[str, Any]]:
        """Ottiene lista modelli disponibili da Ollama"""
        try:
            url = f"{endpoint}/api/tags"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                models = data.get('models', [])
                return [
                    {
                        'name': model.get('name', ''),
                        'size': model.get('size', 0),
                        'modified': model.get('modified_at', '')
                    }
                    for model in models
                ]
            else:
                logger.error(f"Errore Ollama API: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Errore connessione Ollama: {str(e)}")
            return []
