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
        2: 'currently_teaching',  # Attualmente insegni? (Sì/No)
        3: 'age',
        4: 'gender',  # Il tuo genere è
        5: 'education_level',  # Titolo di studio
        6: 'school_level',  # Ordine di scuola
        7: 'subject_type',  # Insegna (o insegnerà) una materia
        8: 'subject_area',  # Settore scientifico-disciplinare
        9: 'practical_competence',
        10: 'theoretical_competence',
        11: 'ai_change_teaching',
        12: 'ai_change_my_teaching',
        13: 'training_adequacy',
        14: 'trust_integration',
        15: 'trust_students_responsible',
        16: 'concern_ai_education',
        17: 'concern_ai_students',
        18: 'not_use_for',  # Attività per cui NON usare AI
        19: 'uses_ai_daily',
        20: 'hours_daily',
        22: 'uses_ai_teaching',
        23: 'hours_training',
        24: 'hours_lesson_planning',
        25: 'ai_tools',  # Strumenti AI utilizzati
        26: 'ai_purposes',  # Scopi utilizzo AI
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
        all_options = []
        for value in values:
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
