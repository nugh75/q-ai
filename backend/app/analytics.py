from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import StudentResponse, TeacherResponse
from typing import Dict, List, Any
import statistics
import numpy as np

class Analytics:
    def __init__(self, db: Session):
        self.db = db

    def get_student_statistics(self) -> Dict[str, Any]:
        """Calcola statistiche per gli studenti"""
        students = self.db.query(StudentResponse).all()

        if not students:
            return {}

        # Competenze
        practical_comp = [s.practical_competence for s in students if s.practical_competence]
        theoretical_comp = [s.theoretical_competence for s in students if s.theoretical_competence]

        # Impatto e fiducia
        ai_change = [s.ai_change_study for s in students if s.ai_change_study]
        training_adeq = [s.training_adequacy for s in students if s.training_adequacy]
        trust_int = [s.trust_integration for s in students if s.trust_integration]

        # Preoccupazioni
        concern_school = [s.concern_ai_school for s in students if s.concern_ai_school]
        concern_peers = [s.concern_ai_peers for s in students if s.concern_ai_peers]

        # Utilizzo
        uses_daily = sum(1 for s in students if s.uses_ai_daily == 'Sì')
        uses_study = sum(1 for s in students if s.uses_ai_study == 'Sì')

        hours_daily = [s.hours_daily for s in students if s.hours_daily]
        hours_study = [s.hours_study for s in students if s.hours_study]

        return {
            'total_responses': len(students),
            'competenze': {
                'practical': {
                    'mean': round(statistics.mean(practical_comp), 2) if practical_comp else 0,
                    'median': statistics.median(practical_comp) if practical_comp else 0,
                    'distribution': self._get_distribution(practical_comp, 7)
                },
                'theoretical': {
                    'mean': round(statistics.mean(theoretical_comp), 2) if theoretical_comp else 0,
                    'median': statistics.median(theoretical_comp) if theoretical_comp else 0,
                    'distribution': self._get_distribution(theoretical_comp, 7)
                }
            },
            'impatto_fiducia': {
                'ai_change_study': {
                    'mean': round(statistics.mean(ai_change), 2) if ai_change else 0,
                    'median': statistics.median(ai_change) if ai_change else 0,
                    'distribution': self._get_distribution(ai_change, 7)
                },
                'training_adequacy': {
                    'mean': round(statistics.mean(training_adeq), 2) if training_adeq else 0,
                    'median': statistics.median(training_adeq) if training_adeq else 0,
                    'distribution': self._get_distribution(training_adeq, 7)
                },
                'trust_integration': {
                    'mean': round(statistics.mean(trust_int), 2) if trust_int else 0,
                    'median': statistics.median(trust_int) if trust_int else 0,
                    'distribution': self._get_distribution(trust_int, 7)
                }
            },
            'preoccupazioni': {
                'concern_ai_school': {
                    'mean': round(statistics.mean(concern_school), 2) if concern_school else 0,
                    'median': statistics.median(concern_school) if concern_school else 0,
                    'distribution': self._get_distribution(concern_school, 7)
                },
                'concern_ai_peers': {
                    'mean': round(statistics.mean(concern_peers), 2) if concern_peers else 0,
                    'median': statistics.median(concern_peers) if concern_peers else 0,
                    'distribution': self._get_distribution(concern_peers, 7)
                }
            },
            'utilizzo': {
                'uses_ai_daily_count': uses_daily,
                'uses_ai_daily_percentage': round(uses_daily / len(students) * 100, 1),
                'uses_ai_study_count': uses_study,
                'uses_ai_study_percentage': round(uses_study / len(students) * 100, 1),
                'hours_daily_avg': round(statistics.mean(hours_daily), 2) if hours_daily else 0,
                'hours_study_avg': round(statistics.mean(hours_study), 2) if hours_study else 0
            },
            'demographics': self._get_student_demographics(students)
        }

    def get_teacher_statistics(self, include_non_teaching: bool = False, only_non_teaching: bool = False) -> Dict[str, Any]:
        """Calcola statistiche per gli insegnanti"""
        query = self.db.query(TeacherResponse)

        if only_non_teaching:
            # Solo insegnanti in formazione (che NON insegnano attualmente)
            query = query.filter(TeacherResponse.currently_teaching != 'Attualmente insegno.')
        elif not include_non_teaching:
            # Solo insegnanti attivi
            query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
        # Se include_non_teaching=True e only_non_teaching=False: tutti gli insegnanti

        teachers = query.all()

        if not teachers:
            return {}

        # Competenze
        practical_comp = [t.practical_competence for t in teachers if t.practical_competence]
        theoretical_comp = [t.theoretical_competence for t in teachers if t.theoretical_competence]

        # Impatto
        ai_change_teaching = [t.ai_change_teaching for t in teachers if t.ai_change_teaching]
        ai_change_my = [t.ai_change_my_teaching for t in teachers if t.ai_change_my_teaching]
        training_adeq = [t.training_adequacy for t in teachers if t.training_adequacy]

        # Fiducia
        trust_int = [t.trust_integration for t in teachers if t.trust_integration]
        trust_students = [t.trust_students_responsible for t in teachers if t.trust_students_responsible]

        # Preoccupazioni
        concern_education = [t.concern_ai_education for t in teachers if t.concern_ai_education]
        concern_students = [t.concern_ai_students for t in teachers if t.concern_ai_students]

        # Utilizzo
        uses_daily = sum(1 for t in teachers if t.uses_ai_daily == 'Sì')
        uses_teaching = sum(1 for t in teachers if t.uses_ai_teaching == 'Sì')

        hours_daily = [t.hours_daily for t in teachers if t.hours_daily]
        hours_training = [t.hours_training for t in teachers if t.hours_training]
        hours_planning = [t.hours_lesson_planning for t in teachers if t.hours_lesson_planning]

        return {
            'total_responses': len(teachers),
            'competenze': {
                'practical': {
                    'mean': round(statistics.mean(practical_comp), 2) if practical_comp else 0,
                    'median': statistics.median(practical_comp) if practical_comp else 0,
                    'distribution': self._get_distribution(practical_comp, 7)
                },
                'theoretical': {
                    'mean': round(statistics.mean(theoretical_comp), 2) if theoretical_comp else 0,
                    'median': statistics.median(theoretical_comp) if theoretical_comp else 0,
                    'distribution': self._get_distribution(theoretical_comp, 7)
                }
            },
            'impatto': {
                'ai_change_teaching': {
                    'mean': round(statistics.mean(ai_change_teaching), 2) if ai_change_teaching else 0,
                    'median': statistics.median(ai_change_teaching) if ai_change_teaching else 0,
                    'distribution': self._get_distribution(ai_change_teaching, 7)
                },
                'ai_change_my_teaching': {
                    'mean': round(statistics.mean(ai_change_my), 2) if ai_change_my else 0,
                    'median': statistics.median(ai_change_my) if ai_change_my else 0,
                    'distribution': self._get_distribution(ai_change_my, 7)
                },
                'training_adequacy': {
                    'mean': round(statistics.mean(training_adeq), 2) if training_adeq else 0,
                    'median': statistics.median(training_adeq) if training_adeq else 0,
                    'distribution': self._get_distribution(training_adeq, 7)
                }
            },
            'fiducia': {
                'trust_integration': {
                    'mean': round(statistics.mean(trust_int), 2) if trust_int else 0,
                    'median': statistics.median(trust_int) if trust_int else 0,
                    'distribution': self._get_distribution(trust_int, 7)
                },
                'trust_students': {
                    'mean': round(statistics.mean(trust_students), 2) if trust_students else 0,
                    'median': statistics.median(trust_students) if trust_students else 0,
                    'distribution': self._get_distribution(trust_students, 7)
                }
            },
            'preoccupazioni': {
                'concern_ai_education': {
                    'mean': round(statistics.mean(concern_education), 2) if concern_education else 0,
                    'median': statistics.median(concern_education) if concern_education else 0,
                    'distribution': self._get_distribution(concern_education, 7)
                },
                'concern_ai_students': {
                    'mean': round(statistics.mean(concern_students), 2) if concern_students else 0,
                    'median': statistics.median(concern_students) if concern_students else 0,
                    'distribution': self._get_distribution(concern_students, 7)
                }
            },
            'utilizzo': {
                'uses_ai_daily_count': uses_daily,
                'uses_ai_daily_percentage': round(uses_daily / len(teachers) * 100, 1),
                'uses_ai_teaching_count': uses_teaching,
                'uses_ai_teaching_percentage': round(uses_teaching / len(teachers) * 100, 1),
                'hours_daily_avg': round(statistics.mean(hours_daily), 2) if hours_daily else 0,
                'hours_training_avg': round(statistics.mean(hours_training), 2) if hours_training else 0,
                'hours_planning_avg': round(statistics.mean(hours_planning), 2) if hours_planning else 0
            },
            'demographics': self._get_teacher_demographics(teachers)
        }

    def get_comparative_analysis(self, include_non_teaching: bool = False, only_non_teaching: bool = False) -> Dict[str, Any]:
        """Analisi comparativa tra studenti e insegnanti sulle domande speculari"""
        students = self.db.query(StudentResponse).all()

        # Filtra insegnanti in base ai parametri
        teacher_query = self.db.query(TeacherResponse)
        if only_non_teaching:
            teacher_query = teacher_query.filter(TeacherResponse.currently_teaching != 'Attualmente insegno.')
        elif not include_non_teaching:
            teacher_query = teacher_query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')

        teachers = teacher_query.all()

        comparisons = []

        # Competenza pratica
        student_practical = [s.practical_competence for s in students if s.practical_competence]
        teacher_practical = [t.practical_competence for t in teachers if t.practical_competence]

        if student_practical and teacher_practical:
            comparisons.append({
                'question': 'Competenza pratica AI',
                'category': 'competenze',
                'students': {
                    'mean': round(statistics.mean(student_practical), 2),
                    'median': statistics.median(student_practical),
                    'distribution': self._get_distribution(student_practical, 7)
                },
                'teachers': {
                    'mean': round(statistics.mean(teacher_practical), 2),
                    'median': statistics.median(teacher_practical),
                    'distribution': self._get_distribution(teacher_practical, 7)
                },
                'difference': round(statistics.mean(teacher_practical) - statistics.mean(student_practical), 2)
            })

        # Competenza teorica
        student_theoretical = [s.theoretical_competence for s in students if s.theoretical_competence]
        teacher_theoretical = [t.theoretical_competence for t in teachers if t.theoretical_competence]

        if student_theoretical and teacher_theoretical:
            comparisons.append({
                'question': 'Competenza teorica AI',
                'category': 'competenze',
                'students': {
                    'mean': round(statistics.mean(student_theoretical), 2),
                    'median': statistics.median(student_theoretical),
                    'distribution': self._get_distribution(student_theoretical, 7)
                },
                'teachers': {
                    'mean': round(statistics.mean(teacher_theoretical), 2),
                    'median': statistics.median(teacher_theoretical),
                    'distribution': self._get_distribution(teacher_theoretical, 7)
                },
                'difference': round(statistics.mean(teacher_theoretical) - statistics.mean(student_theoretical), 2)
            })

        # Fiducia nell'integrazione
        student_trust = [s.trust_integration for s in students if s.trust_integration]
        teacher_trust = [t.trust_integration for t in teachers if t.trust_integration]

        if student_trust and teacher_trust:
            comparisons.append({
                'question': 'Fiducia integrazione AI',
                'category': 'fiducia',
                'students': {
                    'mean': round(statistics.mean(student_trust), 2),
                    'median': statistics.median(student_trust),
                    'distribution': self._get_distribution(student_trust, 7)
                },
                'teachers': {
                    'mean': round(statistics.mean(teacher_trust), 2),
                    'median': statistics.median(teacher_trust),
                    'distribution': self._get_distribution(teacher_trust, 7)
                },
                'difference': round(statistics.mean(teacher_trust) - statistics.mean(student_trust), 2)
            })

        return {
            'comparisons': comparisons,
            'summary': {
                'total_students': len(students),
                'total_teachers': len(teachers)
            }
        }

    def _get_distribution(self, values: List[float], max_value: int) -> Dict[int, int]:
        """Calcola la distribuzione dei valori"""
        distribution = {i: 0 for i in range(1, max_value + 1)}
        for value in values:
            if 1 <= value <= max_value:
                distribution[int(value)] += 1
        return distribution

    def _get_student_demographics(self, students: List[StudentResponse]) -> Dict[str, Any]:
        """Calcola dati demografici studenti"""
        ages = [s.age for s in students if s.age]
        genders = {}
        school_types = {}

        for s in students:
            if s.gender:
                genders[s.gender] = genders.get(s.gender, 0) + 1
            if s.school_type:
                school_types[s.school_type] = school_types.get(s.school_type, 0) + 1

        return {
            'age_avg': round(statistics.mean(ages), 1) if ages else 0,
            'age_min': min(ages) if ages else 0,
            'age_max': max(ages) if ages else 0,
            'gender_distribution': genders,
            'school_type_distribution': school_types
        }

    def _get_teacher_demographics(self, teachers: List[TeacherResponse]) -> Dict[str, Any]:
        """Calcola dati demografici insegnanti"""
        ages = [t.age for t in teachers if t.age]
        genders = {}
        school_levels = {}
        teaching_status = {}

        for t in teachers:
            if t.gender:
                genders[t.gender] = genders.get(t.gender, 0) + 1
            if t.school_level:
                school_levels[t.school_level] = school_levels.get(t.school_level, 0) + 1
            if t.currently_teaching:
                teaching_status[t.currently_teaching] = teaching_status.get(t.currently_teaching, 0) + 1

        return {
            'age_avg': round(statistics.mean(ages), 1) if ages else 0,
            'age_min': min(ages) if ages else 0,
            'age_max': max(ages) if ages else 0,
            'gender_distribution': genders,
            'school_level_distribution': school_levels,
            'teaching_status_distribution': teaching_status
        }

    def get_correlation_analysis(self) -> Dict[str, Any]:
        """
        Analizza correlazioni tra fattori Likert (1-7) e variabili di utilizzo.

        Studenti: correlazione tra fattori di influenzamento e:
        - uso quotidiano AI (Sì/No)
        - ore settimanali utilizzo AI
        - ore studio con AI
        - ore risparmiate

        Insegnanti (attivi): correlazione tra fattori e:
        - uso quotidiano AI
        - ore settimanali utilizzo AI
        - ore formazione/autoapprendimento
        - ore preparazione lezioni

        Insegnanti in formazione: stesse correlazioni degli attivi
        """

        result = {
            'students': self._get_student_correlations(),
            'teachers_active': self._get_teacher_correlations(include_non_teaching=False),
            'teachers_in_training': self._get_teacher_correlations(only_non_teaching=True)
        }

        return result

    def _get_student_correlations(self) -> Dict[str, Any]:
        """Calcola correlazioni per gli studenti"""
        students = self.db.query(StudentResponse).all()

        if not students:
            return {}

        # Fattori Likert (scala 1-7)
        likert_factors = {
            'practical_competence': [s.practical_competence for s in students if s.practical_competence],
            'theoretical_competence': [s.theoretical_competence for s in students if s.theoretical_competence],
            'ai_change_study': [s.ai_change_study for s in students if s.ai_change_study],
            'training_adequacy': [s.training_adequacy for s in students if s.training_adequacy],
            'trust_integration': [s.trust_integration for s in students if s.trust_integration],
            'teacher_preparation': [s.teacher_preparation for s in students if s.teacher_preparation],
            'concern_ai_school': [s.concern_ai_school for s in students if s.concern_ai_school],
            'concern_ai_peers': [s.concern_ai_peers for s in students if s.concern_ai_peers]
        }

        # Variabili di utilizzo
        usage_vars = {
            'uses_ai_daily': [1 if s.uses_ai_daily == 'Sì' else 0 for s in students if s.uses_ai_daily],
            'hours_daily': [s.hours_daily for s in students if s.hours_daily],
            'hours_study': [s.hours_study for s in students if s.hours_study],
            'hours_saved': [s.hours_saved for s in students if s.hours_saved]
        }

        correlations = {}

        for factor_name, factor_values in likert_factors.items():
            if not factor_values:
                continue

            correlations[factor_name] = {}

            for usage_name, usage_values in usage_vars.items():
                if not usage_values:
                    continue

                # Allinea le liste (stesso numero di elementi)
                aligned_data = self._align_data(students, factor_name, usage_name)

                if len(aligned_data['factor']) < 3:  # Minimo 3 punti per correlazione significativa
                    continue

                # Calcola correlazione di Pearson
                corr_coef = np.corrcoef(aligned_data['factor'], aligned_data['usage'])[0, 1]

                correlations[factor_name][usage_name] = {
                    'coefficient': round(float(corr_coef), 3),
                    'strength': self._interpret_correlation(corr_coef),
                    'n_samples': len(aligned_data['factor'])
                }

        return {
            'correlations': correlations,
            'total_students': len(students)
        }

    def _get_teacher_correlations(self, include_non_teaching: bool = False, only_non_teaching: bool = False) -> Dict[str, Any]:
        """Calcola correlazioni per insegnanti (attivi o in formazione)"""
        query = self.db.query(TeacherResponse)

        if only_non_teaching:
            query = query.filter(TeacherResponse.currently_teaching != 'Attualmente insegno.')
        elif not include_non_teaching:
            query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')

        teachers = query.all()

        if not teachers:
            return {}

        # Fattori Likert (scala 1-7)
        likert_factors = {
            'practical_competence': [t.practical_competence for t in teachers if t.practical_competence],
            'theoretical_competence': [t.theoretical_competence for t in teachers if t.theoretical_competence],
            'ai_change_teaching': [t.ai_change_teaching for t in teachers if t.ai_change_teaching],
            'ai_change_my_teaching': [t.ai_change_my_teaching for t in teachers if t.ai_change_my_teaching],
            'training_adequacy': [t.training_adequacy for t in teachers if t.training_adequacy],
            'trust_integration': [t.trust_integration for t in teachers if t.trust_integration],
            'trust_students_responsible': [t.trust_students_responsible for t in teachers if t.trust_students_responsible],
            'concern_ai_education': [t.concern_ai_education for t in teachers if t.concern_ai_education],
            'concern_ai_students': [t.concern_ai_students for t in teachers if t.concern_ai_students]
        }

        # Variabili di utilizzo
        usage_vars = {
            'uses_ai_daily': [1 if t.uses_ai_daily == 'Sì' else 0 for t in teachers if t.uses_ai_daily],
            'hours_daily': [t.hours_daily for t in teachers if t.hours_daily],
            'hours_training': [t.hours_training for t in teachers if t.hours_training],
            'hours_lesson_planning': [t.hours_lesson_planning for t in teachers if t.hours_lesson_planning]
        }

        correlations = {}

        for factor_name, factor_values in likert_factors.items():
            if not factor_values:
                continue

            correlations[factor_name] = {}

            for usage_name, usage_values in usage_vars.items():
                if not usage_values:
                    continue

                # Allinea le liste
                aligned_data = self._align_teacher_data(teachers, factor_name, usage_name)

                if len(aligned_data['factor']) < 3:
                    continue

                # Calcola correlazione di Pearson
                corr_coef = np.corrcoef(aligned_data['factor'], aligned_data['usage'])[0, 1]

                correlations[factor_name][usage_name] = {
                    'coefficient': round(float(corr_coef), 3),
                    'strength': self._interpret_correlation(corr_coef),
                    'n_samples': len(aligned_data['factor'])
                }

        return {
            'correlations': correlations,
            'total_teachers': len(teachers)
        }

    def _align_data(self, students: List[StudentResponse], factor_name: str, usage_name: str) -> Dict[str, List[float]]:
        """Allinea dati di fattori Likert e variabili di utilizzo per studenti"""
        factor_values = []
        usage_values = []

        for s in students:
            factor_val = getattr(s, factor_name, None)

            if usage_name == 'uses_ai_daily':
                usage_val = 1 if s.uses_ai_daily == 'Sì' else 0 if s.uses_ai_daily == 'No' else None
            else:
                usage_val = getattr(s, usage_name, None)

            if factor_val is not None and usage_val is not None:
                factor_values.append(float(factor_val))
                usage_values.append(float(usage_val))

        return {'factor': factor_values, 'usage': usage_values}

    def _align_teacher_data(self, teachers: List[TeacherResponse], factor_name: str, usage_name: str) -> Dict[str, List[float]]:
        """Allinea dati di fattori Likert e variabili di utilizzo per insegnanti"""
        factor_values = []
        usage_values = []

        for t in teachers:
            factor_val = getattr(t, factor_name, None)

            if usage_name == 'uses_ai_daily':
                usage_val = 1 if t.uses_ai_daily == 'Sì' else 0 if t.uses_ai_daily == 'No' else None
            else:
                usage_val = getattr(t, usage_name, None)

            if factor_val is not None and usage_val is not None:
                factor_values.append(float(factor_val))
                usage_values.append(float(usage_val))

        return {'factor': factor_values, 'usage': usage_values}

    def _interpret_correlation(self, coef: float) -> str:
        """Interpreta la forza della correlazione"""
        abs_coef = abs(coef)

        if abs_coef >= 0.7:
            strength = 'forte'
        elif abs_coef >= 0.4:
            strength = 'moderata'
        elif abs_coef >= 0.2:
            strength = 'debole'
        else:
            strength = 'molto debole'

        direction = 'positiva' if coef > 0 else 'negativa'

        return f"{strength} {direction}"
