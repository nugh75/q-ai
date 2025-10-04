"""
Servizio per calcolare statistiche dettagliate per ogni domanda
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float
from typing import Dict, Any, List, Optional
import statistics
from collections import Counter
from .models import StudentResponse, TeacherResponse
from .question_classifier import QuestionClassifier


def split_subject_areas(full_text: str) -> List[str]:
    """
    Divide intelligentemente le classi di concorso multiple rispettando le virgole
    nelle descrizioni.

    Esempi:
    - "A-22 Italiano, storia, geografia, A-54 Storia dell'arte" ->
      ["A-22 Italiano, storia, geografia", "A-54 Storia dell'arte"]
    - "Scuola Primaria, Sostegno" -> ["Scuola Primaria", "Sostegno"]
    - "A-18 Filosofia e scienze umane" -> ["A-18 Filosofia e scienze umane"]

    Args:
        full_text: Testo completo con una o più classi di concorso

    Returns:
        Lista di classi di concorso separate
    """
    import re

    if not full_text or full_text.strip() == '':
        return []

    text = full_text.strip()

    # Trova tutte le posizioni di inizio di una nuova classe di concorso
    # Pattern: codice classe (A-XX, B-XX, MAT/01, AAAA, etc) o keyword speciale all'inizio o dopo ", "
    code_patterns = [
        r'[A-Z]{1,4}[-\s]\d{2,3}',  # A-22, B-012, A 22
        r'[A-Z]{2,4}/[A-Z0-9]{2,3}',  # MAT/01, L-LIN/02
        r'AAA[A-Z]',  # AAAA, ADAA, ADSS
    ]

    keyword_patterns = [
        r'Scuola\s+(?:Primaria|dell\'Infanzia|infanzia|primaria)',
        r'Sostegno',
        r'i\s+5\s+campi',
    ]

    # Trova tutte le posizioni di split
    split_positions = [0]  # Inizia sempre da posizione 0

    # Cerca codici di classe (possono apparire ovunque tranne all'interno di parole)
    for pattern in code_patterns:
        for match in re.finditer(r'(?:^|,\s*|;\s*)(' + pattern + r')', text, re.IGNORECASE):
            pos = match.start(1)  # Posizione del codice, non del separatore
            if pos not in split_positions:
                split_positions.append(pos)

    # Cerca keywords speciali SOLO all'inizio o dopo ", " o "; "
    for pattern in keyword_patterns:
        for match in re.finditer(r'(?:^|,\s*|;\s*)(' + pattern + r')', text, re.IGNORECASE):
            pos = match.start(1)
            if pos not in split_positions:
                split_positions.append(pos)

    split_positions.sort()

    if len(split_positions) == 1:
        # Nessuna divisione trovata
        return [text]

    # Estrai i segmenti tra le posizioni di split
    result = []
    for i in range(len(split_positions)):
        start = split_positions[i]
        end = split_positions[i+1] if i+1 < len(split_positions) else len(text)

        segment = text[start:end].strip()
        # Rimuovi virgole/punto e virgola finali
        segment = segment.rstrip(',;').strip()

        if segment:
            result.append(segment)

    return result if result else [text]


def normalize_subject_area(raw_value: str) -> str:
    """
    Normalizza un singolo valore di settore disciplinare per consolidare varianti.

    Questa funzione viene chiamata per ogni singola classe di concorso/area dopo
    aver diviso per virgola le risposte multiple.

    Args:
        raw_value: Un singolo settore/classe di concorso (es. "A-18 Filosofia e scienze umane")

    Returns:
        Il valore normalizzato
    """
    if not raw_value:
        return raw_value

    import re

    # Normalizza per confronto
    value = raw_value.strip()
    normalized = value.lower()

    # STEP 1: Normalizza codici classe di concorso (A-XX, B-XX, AAAA, etc)
    # Unificia varianti: A18 -> A-018, B12 -> B-012, B012 -> B-012, A 18 -> A-018
    cdc_match = re.match(r'^([A-Z]{1,4})[-\s]?(\d{1,3})', value, re.IGNORECASE)
    if cdc_match:
        letter = cdc_match.group(1).upper()
        number = cdc_match.group(2).zfill(3)  # Pad con zero: 12 -> 012, 1 -> 001
        cdc_code = f"{letter}-{number}"

        # Estrai descrizione se presente
        rest = value[len(cdc_match.group(0)):].strip()
        if rest:
            # Pulisci la descrizione
            desc = re.sub(r'^\s*[-–—,]\s*', '', rest)  # Rimuovi trattini/virgole iniziali
            desc = re.sub(r'^\s*\(\s*', '', desc)  # Rimuovi parentesi iniziali
            desc = re.sub(r'\s+', ' ', desc)  # Normalizza spazi multipli
            desc = desc.strip()

            # Normalizza maiuscole/minuscole: prima lettera maiuscola per ogni parola principale
            # Mantieni acronimi (parole tutte maiuscole di 2+ lettere)
            words = desc.split()
            normalized_words = []
            for word in words:
                # Se è tutto maiuscolo e > 1 lettera, mantieni (es. "II", "I")
                if len(word) > 1 and word.isupper():
                    normalized_words.append(word)
                # Se è tutto minuscolo o mixed, capitalizza prima lettera
                else:
                    normalized_words.append(word.capitalize() if word else word)
            desc = ' '.join(normalized_words)

            # Tronca se troppo lungo
            if len(desc) > 50:
                desc = desc[:47] + '...'

            if desc:
                return f"{cdc_code} - {desc}"

        return cdc_code

    # STEP 2: Gestisci casi speciali comuni

    # Scuola dell'Infanzia - RAGGRUPPA TUTTE LE VARIANTI
    if re.search(r'\binfanzia\b', normalized):
        # Tutte le varianti (AAAA, ADAA, sostegno, ecc.) diventano "Scuola dell'Infanzia"
        return "Scuola dell'Infanzia"

    # Scuola Primaria - RAGGRUPPA TUTTE LE VARIANTI
    if re.search(r'\bprimaria\b', normalized):
        # Tutte le varianti (EEEE, sostegno, matematica/scienze, ecc.) diventano "Scuola Primaria"
        return "Scuola Primaria"
    
    # EEEE (Scuola Primaria)
    if re.search(r'\bee+\b', normalized):
        return "Scuola Primaria"

    # Sostegno - RAGGRUPPA TUTTO (ADSS, ADMM, ADAA, ecc.)
    if 'sostegno' in normalized or re.search(r'\bad[a-z]{2}\b|ad\s*[a-z]{2}', normalized):
        return 'Sostegno Didattico'

    # SSD universitari (Settore Scientifico Disciplinare)
    # Es: "MAT/01 LOGICA MATEMATICA" -> "Matematica"
    # Es: "M-PED/01" -> "Pedagogia", "SECS-P/01" -> "Economia"
    
    # Mappatura sigle SSD -> nomi estesi (28 raggruppamenti disciplinari ufficiali)
    SSD_NAMES = {
        'MAT': 'Matematica',
        'INF': 'Informatica',
        'FIS': 'Fisica',
        'CHIM': 'Chimica',
        'GEO': 'Geoscienze',
        'BIO': 'Biologia',
        'MED': 'Medicina',
        'AGR': 'Agraria',
        'VET': 'Veterinaria',
        'ICAR': 'Ingegneria Civile e Architettura',
        'ING-IND': 'Ingegneria Industriale',
        'ING-INF': 'Ingegneria dell\'Informazione',
        'L-ANT': 'Scienze dell\'Antichità',
        'L-ART': 'Storia dell\'Arte e Spettacolo',
        'L-FIL-LET': 'Filologia e Letteratura',
        'L-LIN': 'Lingue e Letterature Straniere',
        'L-OR': 'Studi Orientali',
        'M-FIL': 'Filosofia',
        'M-STO': 'Storia',
        'M-PED': 'Pedagogia',
        'M-PSI': 'Psicologia',
        'M-GGR': 'Geografia',
        'M-DEA': 'Antropologia',
        'M-EDF': 'Educazione Fisica',
        'IUS': 'Giurisprudenza',
        'SECS-P': 'Economia',
        'SECS-S': 'Statistica',
        'SPS': 'Scienze Politiche e Sociali'
    }
    
    # Pattern completo: cattura AGR, MAT, BIO, M-PED, L-LIN, SECS-P, ING-IND, ecc.
    ssd_match = re.match(r'^([A-Z]+(?:-[A-Z]+)*)[-/]\d+', value, re.IGNORECASE)
    if ssd_match:
        area = ssd_match.group(1).upper()
        return SSD_NAMES.get(area, area)  # Ritorna il nome esteso o la sigla se non trovata

    # Casi specifici testuali
    if 'i 5 campi' in normalized or '5 campi di esperienza' in normalized:
        return "Scuola Primaria - 5 Campi di Esperienza"

    if normalized in ['pedagogia', 'scienze educazione']:
        return normalized.title()

    # Se è molto lungo (più di 80 caratteri), tronca
    if len(value) > 80:
        return value[:77] + '...'

    return value


class QuestionStatsService:
    """Servizio per calcolare statistiche per ogni domanda"""
    
    # Mappatura tra indice colonna e campo del modello
    STUDENT_FIELD_MAPPING = {
        2: 'age',
        3: 'gender',  # Il tuo genere è
        4: 'school_type',  # Che scuola frequenti
        5: 'education_level',  # Titolo di studio
        6: 'study_path',  # Il tuo percorso attuale di studio è di tipo
        7: 'practical_competence',
        8: 'theoretical_competence',
        9: 'ai_change_study',
        10: 'training_adequacy',
        11: 'trust_integration',
        12: 'teacher_preparation',
        13: 'concern_ai_school',
        14: 'concern_ai_peers',
        15: 'uses_ai_daily',
        16: 'hours_daily',
        18: 'uses_ai_study',
        19: 'hours_daily',  # Quante ore alla settimana per attività quotidiane (usa stesso campo di col 16)
        20: 'hours_study',
        21: 'hours_learning_tools',
        22: 'hours_saved',
        23: 'ai_tools',  # Strumenti AI utilizzati
        24: 'ai_purposes',  # Scopi utilizzo AI
        25: 'not_use_for',  # Attività per cui NON usare AI
    }
    
    TEACHER_FIELD_MAPPING = {
        2: 'currently_teaching',
        3: 'age',
        4: 'gender',
        5: 'education_level',
        6: 'school_level',
        7: 'subject_type',
        8: 'subject_area',
        9: 'practical_competence',
        10: 'theoretical_competence',
        11: 'ai_change_teaching',
        12: 'ai_change_my_teaching',
        13: 'training_adequacy',
        14: 'trust_integration',
        15: 'trust_students_responsible',
        16: 'concern_ai_education',
        17: 'concern_ai_students',
        19: 'uses_ai_daily',
        20: 'hours_daily',
        22: 'uses_ai_teaching',
        23: 'hours_teaching_ai',
        24: 'hours_lesson_planning',
        25: 'ai_tools',
        26: 'ai_purposes',
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.classifier = QuestionClassifier()
    
    def get_question_stats(self, column_index: int, respondent_type: str, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Ottiene statistiche complete per una domanda specifica
        
        Args:
            column_index: Indice della colonna nel file Excel
            respondent_type: 'student' o 'teacher'
            teacher_type: 'active', 'training', o None (tutti) - solo per teacher
            
        Returns:
            Dizionario con statistiche complete
        """
        # Ottieni informazioni sulla domanda
        questions = self.classifier.get_all_questions()
        question_info = next((q for q in questions if q['column_index'] == column_index and q['respondent_type'] == respondent_type), None)
        
        if not question_info:
            return {"error": "Question not found"}
        
        # Determina il campo del modello
        field_mapping = self.STUDENT_FIELD_MAPPING if respondent_type == 'student' else self.TEACHER_FIELD_MAPPING
        field_name = field_mapping.get(column_index)
        
        if not field_name:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No statistical data available for this question"
            }
        
        # Calcola statistiche in base al tipo di risposta
        if question_info['response_format'] == 'scale_1_7':
            return self._get_scale_stats(field_name, respondent_type, question_info, teacher_type)
        elif question_info['response_format'] == 'numeric':
            return self._get_numeric_stats(field_name, respondent_type, question_info, teacher_type)
        elif question_info['response_format'] == 'yes_no':
            return self._get_yes_no_stats(field_name, respondent_type, question_info, teacher_type)
        elif question_info['response_format'] == 'single_choice':
            return self._get_single_choice_stats(field_name, respondent_type, question_info, teacher_type)
        elif question_info['response_format'] == 'multiple_choice':
            return self._get_multiple_choice_stats(field_name, respondent_type, question_info, teacher_type)
        else:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "Statistics not available for text/open questions"
            }
    
    def _get_scale_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """Statistiche per domande con scala 1-7"""
        Model = StudentResponse if respondent_type == 'student' else TeacherResponse
        field = getattr(Model, field_name)
        
        # Query per valori non nulli
        query = self.db.query(field).filter(field.isnot(None))
        
        # Applica filtro per tipo insegnante se specificato
        if respondent_type == 'teacher' and teacher_type:
            if teacher_type == 'active':
                query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            elif teacher_type == 'training':
                query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')
        
        values = query.all()
        values = [v[0] for v in values if v[0] is not None]
        
        if not values:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No responses for this question"
            }
        
        # Calcola statistiche
        mean = statistics.mean(values)
        median = statistics.median(values)
        stdev = statistics.stdev(values) if len(values) > 1 else 0

        # Calcola quartili e outliers per box plot
        sorted_values = sorted(values)
        q1 = statistics.quantiles(sorted_values, n=4)[0] if len(sorted_values) >= 4 else min(sorted_values)
        q3 = statistics.quantiles(sorted_values, n=4)[2] if len(sorted_values) >= 4 else max(sorted_values)
        iqr = q3 - q1
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr

        # Identifica outliers
        outliers = [v for v in values if v < lower_fence or v > upper_fence]

        # Distribuzione
        distribution = Counter(values)
        distribution_data = [
            {"value": i, "count": distribution.get(i, 0)}
            for i in range(1, 8)
        ]

        # Percentuali
        total = len(values)
        distribution_percentage = [
            {"value": i, "percentage": round((distribution.get(i, 0) / total) * 100, 2)}
            for i in range(1, 8)
        ]

        return {
            "question_info": question_info,
            "has_data": True,
            "response_count": total,
            "statistics": {
                "mean": round(mean, 2),
                "median": median,
                "std_dev": round(stdev, 2),
                "min": min(values),
                "max": max(values),
                "mode": statistics.mode(values) if len(set(values)) < len(values) else None,
                "q1": round(q1, 2),
                "q3": round(q3, 2),
                "iqr": round(iqr, 2)
            },
            "boxplot_data": {
                "min": round(min([v for v in values if v >= lower_fence]), 2) if any(v >= lower_fence for v in values) else round(min(values), 2),
                "q1": round(q1, 2),
                "median": round(median, 2),
                "q3": round(q3, 2),
                "max": round(max([v for v in values if v <= upper_fence]), 2) if any(v <= upper_fence for v in values) else round(max(values), 2),
                "outliers": [round(o, 2) for o in outliers]
            },
            "distribution": distribution_data,
            "distribution_percentage": distribution_percentage,
            "chart_types": ["bar", "pie", "line", "boxplot"],
            "recommended_chart": "bar"
        }
    
    def _get_numeric_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """Statistiche per domande numeriche (età, ore)"""
        Model = StudentResponse if respondent_type == 'student' else TeacherResponse
        field = getattr(Model, field_name)

        query = self.db.query(field).filter(field.isnot(None))

        # Applica filtro per tipo insegnante se specificato
        if respondent_type == 'teacher' and teacher_type:
            if teacher_type == 'active':
                query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            elif teacher_type == 'training':
                query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')

        values = query.all()
        values = [v[0] for v in values if v[0] is not None and v[0] > 0]

        if not values:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No responses for this question"
            }

        mean = statistics.mean(values)
        median = statistics.median(values)
        stdev = statistics.stdev(values) if len(values) > 1 else 0

        # Calcola quartili e outliers per box plot
        sorted_values = sorted(values)
        q1 = statistics.quantiles(sorted_values, n=4)[0] if len(sorted_values) >= 4 else min(sorted_values)
        q3 = statistics.quantiles(sorted_values, n=4)[2] if len(sorted_values) >= 4 else max(sorted_values)
        iqr = q3 - q1
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr

        # Identifica outliers
        outliers = [v for v in values if v < lower_fence or v > upper_fence]

        # Crea range per distribuzione
        min_val = min(values)
        max_val = max(values)

        # Distribuzione in gruppi
        if max_val - min_val <= 20:
            # Valori discreti
            distribution = Counter(values)
            distribution_data = [
                {"value": v, "count": c}
                for v, c in sorted(distribution.items())
            ]
        else:
            # Gruppi
            num_bins = 10
            bin_size = (max_val - min_val) / num_bins
            bins = {}
            bin_indices = {}  # Memorizza l'indice per ordinamento corretto
            for v in values:
                bin_idx = min(int((v - min_val) / bin_size), num_bins - 1)
                bin_start = min_val + bin_idx * bin_size
                bin_key = f"{int(bin_start)}-{int(bin_start + bin_size)}"
                bins[bin_key] = bins.get(bin_key, 0) + 1
                bin_indices[bin_key] = bin_start

            distribution_data = [
                {"range": k, "count": bins[k]}
                for k in sorted(bins.keys(), key=lambda x: bin_indices[x])
            ]

        return {
            "question_info": question_info,
            "has_data": True,
            "response_count": len(values),
            "statistics": {
                "mean": round(mean, 2),
                "median": round(median, 2),
                "std_dev": round(stdev, 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "q1": round(q1, 2),
                "q3": round(q3, 2),
                "iqr": round(iqr, 2)
            },
            "boxplot_data": {
                "min": round(min([v for v in values if v >= lower_fence]), 2) if any(v >= lower_fence for v in values) else round(min(values), 2),
                "q1": round(q1, 2),
                "median": round(median, 2),
                "q3": round(q3, 2),
                "max": round(max([v for v in values if v <= upper_fence]), 2) if any(v <= upper_fence for v in values) else round(max(values), 2),
                "outliers": [round(o, 2) for o in outliers]
            },
            "distribution": distribution_data,
            "chart_types": ["bar", "line", "histogram", "boxplot"],
            "recommended_chart": "histogram"
        }
    
    def _get_yes_no_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """Statistiche per domande Sì/No"""
        Model = StudentResponse if respondent_type == 'student' else TeacherResponse
        field = getattr(Model, field_name)
        
        query = self.db.query(field).filter(field.isnot(None))
        
        # Applica filtro per tipo insegnante se specificato
        if respondent_type == 'teacher' and teacher_type:
            if teacher_type == 'active':
                query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            elif teacher_type == 'training':
                query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')
        
        values = query.all()
        values = [v[0] for v in values if v[0] is not None and v[0].strip() != '']
        
        if not values:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No responses for this question"
            }
        
        # Conta risposte
        distribution = Counter(values)
        total = len(values)
        
        distribution_data = [
            {"answer": answer, "count": count, "percentage": round((count / total) * 100, 2)}
            for answer, count in distribution.items()
        ]
        
        # Percentuale sì
        yes_count = sum(count for answer, count in distribution.items() if 'sì' in answer.lower() or 'si' in answer.lower())
        yes_percentage = round((yes_count / total) * 100, 2) if total > 0 else 0
        
        return {
            "question_info": question_info,
            "has_data": True,
            "response_count": total,
            "statistics": {
                "yes_percentage": yes_percentage,
                "no_percentage": round(100 - yes_percentage, 2),
                "total_yes": yes_count,
                "total_no": total - yes_count
            },
            "distribution": distribution_data,
            "chart_types": ["pie", "bar"],
            "recommended_chart": "pie"
        }
    
    def _get_single_choice_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """Statistiche per domande a scelta singola (NON dividere per virgole)"""
        Model = StudentResponse if respondent_type == 'student' else TeacherResponse
        field = getattr(Model, field_name)
        
        query = self.db.query(field).filter(field.isnot(None))
        
        # Applica filtro per tipo insegnante se specificato
        if respondent_type == 'teacher' and teacher_type:
            if teacher_type == 'active':
                query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            elif teacher_type == 'training':
                query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')
        
        values = query.all()
        values = [v[0].strip() for v in values if v[0] is not None and v[0].strip() != '']
        
        if not values:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No responses for this question"
            }
        
        # Applica normalizzazione per subject_area (domanda 8) per consolidare duplicati
        if field_name == 'subject_area':
            values = [normalize_subject_area(v) for v in values]
        
        # Applica normalizzazione per school_level (domanda 6 insegnanti) per consolidare varianti
        if field_name == 'school_level':
            from .main import normalize_school_level
            values = [normalize_school_level(v) for v in values]
        
        # Conta occorrenze di ogni opzione (NON dividere per virgole)
        distribution = Counter(values)
        total_responses = len(values)
        
        # Crea dati per grafici
        distribution_data = [
            {
                "option": option,
                "count": count,
                "percentage": round((count / total_responses) * 100, 2)
            }
            for option, count in distribution.most_common()
        ]
        
        return {
            "question_info": question_info,
            "has_data": True,
            "response_count": total_responses,
            "statistics": {
                "total_responses": total_responses,
                "unique_options": len(distribution),
                "most_selected": distribution.most_common(1)[0][0] if distribution else None,
                "most_selected_count": distribution.most_common(1)[0][1] if distribution else 0
            },
            "distribution": distribution_data,
            "chart_types": ["bar", "pie"],
            "recommended_chart": "pie"
        }
    
    def _get_multiple_choice_stats(self, field_name: str, respondent_type: str, question_info: Dict, teacher_type: Optional[str] = None) -> Dict[str, Any]:
        """Statistiche per domande a scelta multipla"""
        Model = StudentResponse if respondent_type == 'student' else TeacherResponse
        field = getattr(Model, field_name)
        
        query = self.db.query(field).filter(field.isnot(None))
        
        # Applica filtro per tipo insegnante se specificato
        if respondent_type == 'teacher' and teacher_type:
            if teacher_type == 'active':
                query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            elif teacher_type == 'training':
                query = query.filter(TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).')
        
        values = query.all()
        values = [v[0] for v in values if v[0] is not None and v[0].strip() != '']
        
        # Normalizza school_level se è il campo richiesto
        if field_name == 'school_level':
            from .main import normalize_school_level
            values = [normalize_school_level(v) for v in values]
        
        if not values:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No responses for this question"
            }
        
        # Le risposte multiple sono separate da virgole o punto e virgola
        # Esempio: "ChatGPT, Gemini, Claude" -> ["ChatGPT", "Gemini", "Claude"]
        # ATTENZIONE per subject_area: le descrizioni contengono virgole!
        # "A-22 Italiano, storia, geografia, A-54 Storia dell'arte" ha 2 classi, non 4
        all_options = []
        for value in values:
            # Per subject_area usa split intelligente, altrimenti split semplice
            if field_name == 'subject_area':
                options = split_subject_areas(value)
                options = [normalize_subject_area(opt) for opt in options if opt]
            else:
                # Splitta per virgola o punto e virgola
                options = [opt.strip() for opt in value.replace(';', ',').split(',')]
            all_options.extend([opt for opt in options if opt])
        
        if not all_options:
            return {
                "question_info": question_info,
                "has_data": False,
                "message": "No valid options found"
            }
        
        # Conta occorrenze di ogni opzione
        distribution = Counter(all_options)
        total_responses = len(values)  # Numero di rispondenti
        total_selections = len(all_options)  # Numero totale di selezioni
        
        # Crea dati per grafici
        distribution_data = [
            {
                "option": option,
                "count": count,
                "percentage": round((count / total_responses) * 100, 2),  # % rispetto ai rispondenti
                "selection_percentage": round((count / total_selections) * 100, 2)  # % rispetto alle selezioni totali
            }
            for option, count in distribution.most_common()
        ]
        
        # Calcola media di opzioni selezionate per rispondente
        selections_per_response = []
        for value in values:
            options = [opt.strip() for opt in value.replace(';', ',').split(',')]
            selections_per_response.append(len([opt for opt in options if opt]))
        
        avg_selections = statistics.mean(selections_per_response) if selections_per_response else 0
        
        return {
            "question_info": question_info,
            "has_data": True,
            "response_count": total_responses,
            "statistics": {
                "total_responses": total_responses,
                "total_selections": total_selections,
                "unique_options": len(distribution),
                "avg_selections_per_response": round(avg_selections, 2),
                "most_selected": distribution.most_common(1)[0][0] if distribution else None,
                "most_selected_count": distribution.most_common(1)[0][1] if distribution else 0
            },
            "distribution": distribution_data,
            "chart_types": ["bar", "pie"],
            "recommended_chart": "bar"
        }
    
    def get_all_questions_with_stats_summary(self) -> List[Dict[str, Any]]:
        """Ottiene tutte le domande con un riepilogo delle statistiche disponibili"""
        questions = self.classifier.get_all_questions()
        
        result = []
        for q in questions:
            # Le statistiche sono disponibili se:
            # 1. La domanda ha un campo mappato (non è solo testo)
            # 2. Il response_format non è 'text' (domande aperte pure)
            has_stats = (
                (q['respondent_type'] == 'student' and q['column_index'] in self.STUDENT_FIELD_MAPPING) or
                (q['respondent_type'] == 'teacher' and q['column_index'] in self.TEACHER_FIELD_MAPPING)
            ) and q['response_format'] != 'text'
            
            q['has_statistics'] = has_stats
            result.append(q)
        
        return result
