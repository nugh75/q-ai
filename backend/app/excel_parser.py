import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
import re

class ExcelParser:
    def __init__(self):
        self.student_file = "/app/dati/Studenti - Questionario -CNR.xlsx"
        self.teacher_file = "/app/dati/Insegnati - Questionario - CNR.xlsx"

    def clean_numeric_value(self, value, max_value=None):
        """Convert value to numeric, handling various formats and outliers"""
        if pd.isna(value):
            return None
        try:
            num_val = float(value)
            # Check for unreasonably large values or inf/nan
            if not pd.isna(num_val) and pd.notna(num_val) and abs(num_val) < 1e10:
                if max_value is not None and num_val > max_value:
                    return None
                return num_val
            return None
        except:
            return None

    def parse_student_responses(self) -> List[Dict[str, Any]]:
        """Parse student Excel file and extract closed questions data"""
        df = pd.read_excel(self.student_file, sheet_name='Risposte del modulo 1')

        responses = []

        for _, row in df.iterrows():
            # Estrai timestamp
            timestamp = row.iloc[0] if pd.notna(row.iloc[0]) else None

            response = {
                'timestamp': timestamp,
                'code': str(row.iloc[1]) if pd.notna(row.iloc[1]) else None,
                'age': self.clean_numeric_value(row.iloc[2], max_value=150),
                'gender': str(row.iloc[3]) if pd.notna(row.iloc[3]) else None,
                'school_type': str(row.iloc[4]) if pd.notna(row.iloc[4]) else None,
                'education_level': str(row.iloc[5]) if pd.notna(row.iloc[5]) else None,
                'study_path': str(row.iloc[6]) if pd.notna(row.iloc[6]) else None,

                # Domande chiuse - scale 1-7
                'practical_competence': self.clean_numeric_value(row.iloc[7]),
                'theoretical_competence': self.clean_numeric_value(row.iloc[8]),
                'ai_change_study': self.clean_numeric_value(row.iloc[9]),
                'training_adequacy': self.clean_numeric_value(row.iloc[10]),
                'trust_integration': self.clean_numeric_value(row.iloc[11]),
                'teacher_preparation': self.clean_numeric_value(row.iloc[12]),
                'concern_ai_school': self.clean_numeric_value(row.iloc[13]),
                'concern_ai_peers': self.clean_numeric_value(row.iloc[14]),

                # Utilizzo
                'uses_ai_daily': str(row.iloc[15]) if pd.notna(row.iloc[15]) else None,
                'hours_daily': self.clean_numeric_value(row.iloc[16]),
                'uses_ai_study': str(row.iloc[18]) if pd.notna(row.iloc[18]) else None,
                'hours_study': self.clean_numeric_value(row.iloc[20]),
                'hours_learning_tools': self.clean_numeric_value(row.iloc[21]),
                'hours_saved': self.clean_numeric_value(row.iloc[22]),

                # Strumenti e pratiche (domande chiuse)
                'ai_tools': str(row.iloc[23]) if pd.notna(row.iloc[23]) else None,
                'ai_purposes': str(row.iloc[24]) if pd.notna(row.iloc[24]) else None,
                'not_use_for': str(row.iloc[25]) if pd.notna(row.iloc[25]) else None,

                # Domande aperte (salvate come JSON ma non analizzate)
                'open_responses': {
                    'preferred_tools_why': str(row.iloc[27]) if pd.notna(row.iloc[27]) else None,
                    'personalization_examples': str(row.iloc[28]) if pd.notna(row.iloc[28]) else None,
                    'prompt_examples': str(row.iloc[29]) if pd.notna(row.iloc[29]) else None,
                    'learning_improvement': str(row.iloc[30]) if pd.notna(row.iloc[30]) else None,
                    'specific_examples': str(row.iloc[31]) if pd.notna(row.iloc[31]) else None,
                    'difficulties': str(row.iloc[32]) if pd.notna(row.iloc[32]) else None,
                    'why_not_use': str(row.iloc[33]) if pd.notna(row.iloc[33]) else None,
                    'pros_cons': str(row.iloc[34]) if pd.notna(row.iloc[34]) else None,
                    'not_recommended': str(row.iloc[35]) if pd.notna(row.iloc[35]) else None,
                    'survey_improvements': str(row.iloc[36]) if pd.notna(row.iloc[36]) else None,
                }
            }

            responses.append(response)

        return responses

    def parse_teacher_responses(self) -> List[Dict[str, Any]]:
        """Parse teacher Excel file and extract closed questions data"""
        df = pd.read_excel(self.teacher_file, sheet_name='Risposte del modulo 1')

        responses = []

        for _, row in df.iterrows():
            timestamp = row.iloc[0] if pd.notna(row.iloc[0]) else None

            response = {
                'timestamp': timestamp,
                'code': str(row.iloc[1]) if pd.notna(row.iloc[1]) else None,
                'currently_teaching': str(row.iloc[2]) if pd.notna(row.iloc[2]) else None,
                'age': self.clean_numeric_value(row.iloc[3], max_value=150),
                'gender': str(row.iloc[4]) if pd.notna(row.iloc[4]) else None,
                'education_level': str(row.iloc[5]) if pd.notna(row.iloc[5]) else None,
                'school_level': str(row.iloc[6]) if pd.notna(row.iloc[6]) else None,
                'subject_type': str(row.iloc[7]) if pd.notna(row.iloc[7]) else None,
                'subject_area': str(row.iloc[8]) if pd.notna(row.iloc[8]) else None,

                # Domande chiuse - scale 1-7
                'practical_competence': self.clean_numeric_value(row.iloc[9]),
                'theoretical_competence': self.clean_numeric_value(row.iloc[10]),
                'ai_change_teaching': self.clean_numeric_value(row.iloc[11]),
                'ai_change_my_teaching': self.clean_numeric_value(row.iloc[12]),
                'training_adequacy': self.clean_numeric_value(row.iloc[13]),
                'trust_integration': self.clean_numeric_value(row.iloc[14]),
                'trust_students_responsible': self.clean_numeric_value(row.iloc[15]),
                'concern_ai_education': self.clean_numeric_value(row.iloc[16]),
                'concern_ai_students': self.clean_numeric_value(row.iloc[17]),

                # Pratiche non consigliate
                'not_use_for': str(row.iloc[18]) if pd.notna(row.iloc[18]) else None,

                # Utilizzo
                'uses_ai_daily': str(row.iloc[19]) if pd.notna(row.iloc[19]) else None,
                'hours_daily': self.clean_numeric_value(row.iloc[20]),
                'uses_ai_teaching': str(row.iloc[22]) if pd.notna(row.iloc[22]) else None,
                'hours_training': self.clean_numeric_value(row.iloc[23]),
                'hours_lesson_planning': self.clean_numeric_value(row.iloc[24]),

                # Strumenti e pratiche
                'ai_tools': str(row.iloc[25]) if pd.notna(row.iloc[25]) else None,
                'ai_purposes': str(row.iloc[26]) if pd.notna(row.iloc[26]) else None,

                # Domande aperte (salvate come JSON ma non analizzate)
                'open_responses': {
                    'preferred_tools_why': str(row.iloc[27]) if pd.notna(row.iloc[27]) else None,
                    'individualization': str(row.iloc[28]) if pd.notna(row.iloc[28]) else None,
                    'personalization': str(row.iloc[29]) if pd.notna(row.iloc[29]) else None,
                    'prompt_examples': str(row.iloc[30]) if pd.notna(row.iloc[30]) else None,
                    'learning_improvement': str(row.iloc[31]) if pd.notna(row.iloc[31]) else None,
                    'specific_examples': str(row.iloc[32]) if pd.notna(row.iloc[32]) else None,
                    'difficulties': str(row.iloc[33]) if pd.notna(row.iloc[33]) else None,
                    'why_not_use': str(row.iloc[34]) if pd.notna(row.iloc[34]) else None,
                    'pros_cons': str(row.iloc[35]) if pd.notna(row.iloc[35]) else None,
                    'not_recommended': str(row.iloc[36]) if pd.notna(row.iloc[36]) else None,
                    'survey_improvements': str(row.iloc[37]) if pd.notna(row.iloc[37]) else None,
                }
            }

            responses.append(response)

        return responses

    def get_specular_questions(self) -> List[Dict[str, str]]:
        """Identifica le domande speculari tra i due questionari"""
        return [
            {
                'category': 'competenze',
                'student_question': 'Competenza pratica AI',
                'teacher_question': 'Competenza pratica AI',
                'student_field': 'practical_competence',
                'teacher_field': 'practical_competence'
            },
            {
                'category': 'competenze',
                'student_question': 'Competenza teorica AI',
                'teacher_question': 'Competenza teorica AI',
                'student_field': 'theoretical_competence',
                'teacher_field': 'theoretical_competence'
            },
            {
                'category': 'fiducia',
                'student_question': 'Fiducia integrazione AI',
                'teacher_question': 'Fiducia integrazione AI',
                'student_field': 'trust_integration',
                'teacher_field': 'trust_integration'
            },
            {
                'category': 'formazione',
                'student_question': 'Adeguatezza formazione AI',
                'teacher_question': 'Adeguatezza formazione AI',
                'student_field': 'training_adequacy',
                'teacher_field': 'training_adequacy'
            },
            {
                'category': 'utilizzo',
                'student_question': 'Usa AI quotidianamente',
                'teacher_question': 'Usa AI quotidianamente',
                'student_field': 'uses_ai_daily',
                'teacher_field': 'uses_ai_daily'
            },
            {
                'category': 'utilizzo',
                'student_question': 'Ore settimanali uso quotidiano',
                'teacher_question': 'Ore settimanali uso quotidiano',
                'student_field': 'hours_daily',
                'teacher_field': 'hours_daily'
            }
        ]
