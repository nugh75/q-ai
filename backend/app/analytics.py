from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import StudentResponse, TeacherResponse
from typing import Dict, List, Any
import statistics

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

    def get_teacher_statistics(self, include_non_teaching: bool = False) -> Dict[str, Any]:
        """Calcola statistiche per gli insegnanti"""
        query = self.db.query(TeacherResponse)

        if not include_non_teaching:
            query = query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')

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

    def get_comparative_analysis(self) -> Dict[str, Any]:
        """Analisi comparativa tra studenti e insegnanti sulle domande speculari"""
        students = self.db.query(StudentResponse).all()
        teachers = self.db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Sì, insegno attualmente'
        ).all()

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
