from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, get_db, Base
from .models import StudentResponse, TeacherResponse, Question
from .excel_parser import ExcelParser
from .analytics import Analytics
from .question_classifier import QuestionClassifier
from .question_stats_service import QuestionStatsService
from .cache import cache
from .statistics import InferentialStats, CorrelationAnalysis, RegressionAnalysis, calculate_mean_with_ci
from typing import Optional, List, Dict, Any
import logging
import os
import statistics
import numpy as np
import pandas as pd
from pathlib import Path

# Funzioni di codifica per variabili categoriche
def encode_gender(gender: str) -> int:
    """Codifica il genere: Maschio=1, Femmina=2, Altro=3, Preferisco non rispondere=4"""
    mapping = {
        'Maschio': 1,
        'Femmina': 2,
        'Altro': 3,
        'Preferisco non rispondere': 4
    }
    return mapping.get(gender, 0)

def encode_yes_no(value: str) -> int:
    """Codifica Sì/No: Sì=1, No=0"""
    return 1 if value == 'Sì' else 0

def encode_school_type(school_type: str) -> int:
    """Codifica tipo scuola studenti"""
    mapping = {
        'Liceo': 1,
        'Istituto Tecnico': 2,
        'Istituto Professionale': 3,
        'Altro': 4
    }
    return mapping.get(school_type, 0)

def encode_school_level(school_level: str) -> int:
    """Codifica livello scuola insegnanti"""
    mapping = {
        'Scuola Primaria': 1,
        'Scuola Secondaria di Primo Grado': 2,
        'Scuola Secondaria di Secondo Grado': 3,
        'Università': 4,
        'Altro': 5
    }
    return mapping.get(school_level, 0)

def encode_currently_teaching(value: str) -> int:
    """Codifica se insegna attualmente: Attualmente insegno=1, In formazione=0"""
    return 1 if value == 'Attualmente insegno.' else 0

def encode_subject_type(subject_type: str) -> int:
    """Codifica tipo di materia: STEM=1, Umanistica=0"""
    return 1 if subject_type and 'STEM' in subject_type else 0

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crea le tabelle
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Questionnaire Analysis API",
    description="API per l'analisi di questionari studenti e insegnanti",
    version="1.0.0"
)

# CORS - Configurazione sicura
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5180,http://localhost:5173").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]  # Remove whitespace

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/")
def read_root():
    return {
        "message": "Questionnaire Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "import": "/api/import",
            "students": "/api/students",
            "teachers": "/api/teachers",
            "comparison": "/api/comparison"
        }
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        student_count = db.query(StudentResponse).count()
        teacher_count = db.query(TeacherResponse).count()
        return {
            "status": "healthy",
            "database": "connected",
            "student_responses": student_count,
            "teacher_responses": teacher_count
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/homepage")
def get_homepage_content():
    """
    Legge e restituisce il contenuto del file HOMEPAGE.md
    """
    try:
        # Il file è nella directory backend
        homepage_path = Path(__file__).parent.parent / "HOMEPAGE.md"
        
        if not homepage_path.exists():
            raise HTTPException(status_code=404, detail="File HOMEPAGE.md non trovato")
        
        with open(homepage_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            "content": content,
            "last_modified": homepage_path.stat().st_mtime
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore lettura HOMEPAGE.md: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore lettura file: {str(e)}")

@app.post("/api/homepage")
def update_homepage_content(content: dict):
    """
    Aggiorna il contenuto del file HOMEPAGE.md
    Richiede password di autenticazione nel body
    """
    try:
        # Verifica password
        password = content.get('password', '')
        if password != 'Lagom129.':
            raise HTTPException(status_code=403, detail="Password non valida")
        
        new_content = content.get('content', '')
        if not new_content:
            raise HTTPException(status_code=400, detail="Contenuto mancante")
        
        # Il file è nella directory backend
        homepage_path = Path(__file__).parent.parent / "HOMEPAGE.md"
        
        # Backup del file corrente
        if homepage_path.exists():
            backup_path = Path(__file__).parent.parent / f"HOMEPAGE_backup_{int(homepage_path.stat().st_mtime)}.md"
            import shutil
            shutil.copy2(homepage_path, backup_path)
            logger.info(f"Backup creato: {backup_path}")
        
        # Salva il nuovo contenuto
        with open(homepage_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        logger.info("File HOMEPAGE.md aggiornato con successo")
        
        return {
            "success": True,
            "message": "Contenuto aggiornato con successo",
            "last_modified": homepage_path.stat().st_mtime
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore aggiornamento HOMEPAGE.md: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore aggiornamento file: {str(e)}")

@app.post("/api/import")
def import_data(db: Session = Depends(get_db)):
    """Importa i dati dai file Excel nel database"""
    try:
        parser = ExcelParser()

        # Elimina dati esistenti
        db.query(StudentResponse).delete()
        db.query(TeacherResponse).delete()
        db.commit()

        # Importa studenti
        student_responses = parser.parse_student_responses()
        for response in student_responses:
            db_response = StudentResponse(**response)
            db.add(db_response)

        # Importa insegnanti
        teacher_responses = parser.parse_teacher_responses()
        for response in teacher_responses:
            db_response = TeacherResponse(**response)
            db.add(db_response)

        db.commit()

        # Invalidate all caches after import
        cache.clear()
        logger.info("Cache cleared after data import")

        return {
            "status": "success",
            "students_imported": len(student_responses),
            "teachers_imported": len(teacher_responses)
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students")
def get_student_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche degli studenti"""
    try:
        # Check cache first
        cached = cache.get('students')
        if cached:
            logger.info("Returning cached student statistics")
            return cached

        analytics = Analytics(db)
        stats = analytics.get_student_statistics()

        # Cache the result
        cache.set('students', stats)
        logger.info("Student statistics computed and cached")
        return stats
    except Exception as e:
        logger.error(f"Error getting student statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers")
def get_teacher_statistics(
    include_non_teaching: bool = False,
    only_non_teaching: bool = False,
    db: Session = Depends(get_db)
):
    """Ottieni statistiche degli insegnanti
    - include_non_teaching=True: tutti gli insegnanti (455)
    - only_non_teaching=True: solo insegnanti in formazione (99)
    - default: solo insegnanti attivi (356)
    """
    try:
        # Cache key includes filter parameters
        cache_key = f"teachers_{include_non_teaching}_{only_non_teaching}"
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached teacher statistics (include_non_teaching={include_non_teaching}, only_non_teaching={only_non_teaching})")
            return cached

        analytics = Analytics(db)
        stats = analytics.get_teacher_statistics(include_non_teaching, only_non_teaching)

        cache.set(cache_key, stats)
        logger.info(f"Teacher statistics computed and cached (include_non_teaching={include_non_teaching})")
        return stats
    except Exception as e:
        logger.error(f"Error getting teacher statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers/active")
def get_active_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche solo degli insegnanti attivi (356)"""
    try:
        analytics = Analytics(db)
        stats = analytics.get_teacher_statistics(include_non_teaching=False)
        return stats
    except Exception as e:
        logger.error(f"Error getting active teacher statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers/training")
def get_training_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche solo degli insegnanti in formazione (99)"""
    try:
        analytics = Analytics(db)
        # Crea statistiche solo per insegnanti in formazione
        query = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).'
        )
        
        total_responses = query.count()
        
        # Se non ci sono risposte, restituisci struttura vuota
        if total_responses == 0:
            return {
                'total_responses': 0,
                'competenze': {},
                'utilizzo': {},
                'impatto': {},
                'fiducia': {}
            }
        
        # Calcola statistiche base
        from app.analytics import Analytics
        # Usa temporaneamente l'analytics standard ma con query filtrata
        base_stats = {
            'total_responses': total_responses,
            'competenze': {},
            'utilizzo': {},
            'impatto': {},
            'fiducia': {}
        }
        
        return base_stats
    except Exception as e:
        logger.error(f"Error getting training teacher statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers/total")
def get_total_teacher_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche di tutti gli insegnanti (455 totali)"""
    try:
        analytics = Analytics(db)
        stats = analytics.get_teacher_statistics(include_non_teaching=True)
        return stats
    except Exception as e:
        logger.error(f"Error getting total teacher statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/overview")
def get_overview_statistics(db: Session = Depends(get_db)):
    """Ottieni statistiche di overview per l'intestazione"""
    try:
        # Conta studenti
        total_students = db.query(StudentResponse).count()
        
        # Conta insegnanti attivi
        active_teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Attualmente insegno.'
        ).count()
        
        # Conta insegnanti in formazione
        training_teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Ancora non insegno, ma sto seguendo o ho concluso un percorso PEF (Percorso di formazione iniziale degli insegnanti).'
        ).count()
        
        return {
            'students': total_students,
            'active_teachers': active_teachers,
            'training_teachers': training_teachers,
            'total_teachers': active_teachers + training_teachers
        }
    except Exception as e:
        logger.error(f"Error getting overview statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/comparison")
def get_comparative_analysis(
    include_non_teaching: bool = False,
    only_non_teaching: bool = False,
    db: Session = Depends(get_db)
):
    """Ottieni analisi comparativa tra studenti e insegnanti
    - include_non_teaching=True: confronta con tutti gli insegnanti
    - only_non_teaching=True: confronta con solo insegnanti in formazione
    - default: confronta con solo insegnanti attivi
    """
    try:
        analytics = Analytics(db)
        comparison = analytics.get_comparative_analysis(include_non_teaching, only_non_teaching)
        return comparison
    except Exception as e:
        logger.error(f"Error getting comparative analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools")
def get_tools_analysis(db: Session = Depends(get_db)):
    """Analizza gli strumenti AI utilizzati"""
    try:
        # Studenti
        students = db.query(StudentResponse).filter(StudentResponse.ai_tools.isnot(None)).all()
        student_tools = {}
        for s in students:
            if s.ai_tools:
                tools = [t.strip() for t in s.ai_tools.split(',')]
                for tool in tools:
                    student_tools[tool] = student_tools.get(tool, 0) + 1

        # Insegnanti
        teachers = db.query(TeacherResponse).filter(TeacherResponse.ai_tools.isnot(None)).all()
        teacher_tools = {}
        for t in teachers:
            if t.ai_tools:
                tools = [tool.strip() for tool in t.ai_tools.split(',')]
                for tool in tools:
                    teacher_tools[tool] = teacher_tools.get(tool, 0) + 1

        return {
            'student_tools': dict(sorted(student_tools.items(), key=lambda x: x[1], reverse=True)),
            'teacher_tools': dict(sorted(teacher_tools.items(), key=lambda x: x[1], reverse=True))
        }

    except Exception as e:
        logger.error(f"Error getting tools analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions")
def get_all_questions(
    respondent_type: Optional[str] = None,
    question_type: Optional[str] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ottieni tutte le domande del questionario con classificazione automatica
    
    Parametri:
    - respondent_type: 'student' o 'teacher' per filtrare per tipo di rispondente
    - question_type: 'open' o 'closed' per filtrare per tipo di domanda
    - category: filtra per categoria (demographic, competence, usage, etc.)
    """
    try:
        classifier = QuestionClassifier()
        all_questions = classifier.get_all_questions()
        
        # Applica filtri
        filtered = all_questions
        if respondent_type:
            filtered = [q for q in filtered if q['respondent_type'] == respondent_type]
        if question_type:
            filtered = [q for q in filtered if q['question_type'] == question_type]
        if category:
            filtered = [q for q in filtered if q['category'] == category]
        
        # Statistiche
        total_questions = len(all_questions)
        open_questions = len([q for q in all_questions if q['question_type'] == 'open'])
        closed_questions = len([q for q in all_questions if q['question_type'] == 'closed'])
        
        student_questions = len([q for q in all_questions if q['respondent_type'] == 'student'])
        teacher_questions = len([q for q in all_questions if q['respondent_type'] == 'teacher'])
        
        # Raggruppa per categoria
        categories = {}
        for q in all_questions:
            cat = q['category']
            if cat not in categories:
                categories[cat] = {'total': 0, 'open': 0, 'closed': 0}
            categories[cat]['total'] += 1
            if q['question_type'] == 'open':
                categories[cat]['open'] += 1
            else:
                categories[cat]['closed'] += 1
        
        return {
            'questions': filtered,
            'statistics': {
                'total_questions': total_questions,
                'open_questions': open_questions,
                'closed_questions': closed_questions,
                'student_questions': student_questions,
                'teacher_questions': teacher_questions,
                'categories': categories
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions/summary")
def get_questions_summary() -> Dict[str, Any]:
    """Ottieni un riepilogo delle domande raggruppate per tipo e categoria"""
    try:
        classifier = QuestionClassifier()
        all_questions = classifier.get_all_questions()
        
        # Raggruppa per respondent_type e question_type
        summary = {
            'student': {'open': [], 'closed': []},
            'teacher': {'open': [], 'closed': []}
        }
        
        for q in all_questions:
            resp_type = q['respondent_type']
            quest_type = q['question_type']
            summary[resp_type][quest_type].append({
                'index': q['column_index'],
                'text': q['question_text'][:100] + '...' if len(q['question_text']) > 100 else q['question_text'],
                'category': q['category'],
                'response_format': q['response_format']
            })
        
        return {
            'summary': summary,
            'counts': {
                'student': {
                    'open': len(summary['student']['open']),
                    'closed': len(summary['student']['closed']),
                    'total': len(summary['student']['open']) + len(summary['student']['closed'])
                },
                'teacher': {
                    'open': len(summary['teacher']['open']),
                    'closed': len(summary['teacher']['closed']),
                    'total': len(summary['teacher']['open']) + len(summary['teacher']['closed'])
                }
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting questions summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions/{respondent_type}/{column_index}/stats")
def get_question_statistics(
    respondent_type: str,
    column_index: int,
    teacher_type: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Ottieni statistiche dettagliate per una domanda specifica
    
    Parametri:
    - respondent_type: 'student' o 'teacher'
    - column_index: Indice della colonna nel questionario
    - teacher_type: 'active', 'training', o None (tutti) - solo per teacher
    
    Returns:
    - Statistiche complete: media, mediana, deviazione standard, distribuzione, grafici consigliati
    """
    try:
        if respondent_type not in ['student', 'teacher']:
            raise HTTPException(status_code=400, detail="respondent_type must be 'student' or 'teacher'")
        
        stats_service = QuestionStatsService(db)
        stats = stats_service.get_question_stats(column_index, respondent_type, teacher_type)
        
        return stats
    
    except Exception as e:
        logger.error(f"Error getting question statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/questions/with-stats")
def get_questions_with_stats_info(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Ottieni tutte le domande con informazione se hanno statistiche disponibili
    """
    try:
        stats_service = QuestionStatsService(db)
        questions = stats_service.get_all_questions_with_stats_summary()

        return {
            "questions": questions,
            "total": len(questions),
            "with_stats": len([q for q in questions if q.get('has_statistics', False)])
        }

    except Exception as e:
        logger.error(f"Error getting questions with stats info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STATISTICAL INFERENCE ENDPOINTS
# ============================================================================

@app.get("/api/statistics/ttest/{variable}")
def compare_groups_ttest(variable: str, db: Session = Depends(get_db)):
    """
    Confronta studenti vs insegnanti con t-test indipendente.

    Variabili disponibili:
    - practical_competence: Competenza pratica AI (scala 1-7)
    - theoretical_competence: Competenza teorica AI (scala 1-7)
    - trust_integration: Fiducia nell'integrazione AI (scala 1-7)
    - training_adequacy: Adeguatezza formazione ricevuta (scala 1-7)
    - hours_daily: Ore di utilizzo quotidiano AI

    Returns:
    - Test statistico completo con t-statistic, p-value, Cohen's d, IC 95%
    """
    try:
        # Mapping variabili disponibili
        valid_variables = [
            'practical_competence',
            'theoretical_competence',
            'trust_integration',
            'training_adequacy',
            'hours_daily'
        ]

        if variable not in valid_variables:
            raise HTTPException(
                status_code=400,
                detail=f"Variable must be one of: {', '.join(valid_variables)}"
            )

        # Ottieni dati studenti
        students = db.query(StudentResponse).all()
        student_values = [
            getattr(s, variable)
            for s in students
            if getattr(s, variable) is not None
        ]

        # Ottieni dati insegnanti (solo attivi)
        teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Attualmente insegno.'
        ).all()
        teacher_values = [
            getattr(t, variable)
            for t in teachers
            if getattr(t, variable) is not None
        ]

        if not student_values or not teacher_values:
            raise HTTPException(
                status_code=404,
                detail="Insufficient data for comparison"
            )

        # Esegui t-test
        result = InferentialStats.independent_ttest(
            student_values,
            teacher_values,
            labels=("Students", "Teachers")
        )

        # Aggiungi metadati
        result["variable"] = variable
        result["variable_description"] = {
            'practical_competence': 'Practical AI Competence (1-7)',
            'theoretical_competence': 'Theoretical AI Competence (1-7)',
            'trust_integration': 'Trust in AI Integration (1-7)',
            'training_adequacy': 'Training Adequacy (1-7)',
            'hours_daily': 'Daily AI Usage Hours'
        }.get(variable, variable)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in t-test comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/chi-square/usage")
def chi_square_daily_usage(db: Session = Depends(get_db)):
    """
    Test chi-quadrato: Uso quotidiano AI (Sì/No) x Gruppo (Studenti/Insegnanti).

    Verifica se c'è una relazione significativa tra il tipo di utente
    (studente vs insegnante) e l'utilizzo quotidiano di AI.

    Returns:
    - Test chi-quadrato con statistica, p-value, Cramer's V, tabelle di contingenza
    """
    try:
        # Ottieni dati studenti
        students = db.query(StudentResponse).all()
        student_yes = sum(1 for s in students if s.uses_ai_daily == 'Sì')
        student_no = len(students) - student_yes

        # Ottieni dati insegnanti attivi
        teachers = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Attualmente insegno.'
        ).all()
        teacher_yes = sum(1 for t in teachers if t.uses_ai_daily == 'Sì')
        teacher_no = len(teachers) - teacher_yes

        # Crea tabella di contingenza
        # Righe: Studenti, Insegnanti
        # Colonne: Usa AI quotidianamente (Sì), Non usa quotidianamente (No)
        contingency = np.array([
            [student_yes, student_no],
            [teacher_yes, teacher_no]
        ])

        # Esegui test chi-quadrato
        result = InferentialStats.chi_square_test(
            contingency,
            row_labels=["Students", "Teachers"],
            col_labels=["Uses AI Daily (Yes)", "Does Not Use Daily (No)"]
        )

        # Aggiungi metadati
        result["variable"] = "daily_ai_usage"
        result["description"] = "Relationship between user type and daily AI usage"

        return result

    except Exception as e:
        logger.error(f"Error in chi-square test: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/anova/competence-by-school")
def anova_competence_by_school(
    competence_type: str = "practical_competence",
    respondent: str = "student",
    db: Session = Depends(get_db)
):
    """
    ANOVA one-way: Competenza x Tipo di Scuola.

    Parametri:
    - competence_type: 'practical_competence' o 'theoretical_competence'
    - respondent: 'student' o 'teacher'

    Verifica se ci sono differenze significative nella competenza
    tra diversi livelli scolastici.

    Returns:
    - ANOVA con F-statistic, p-value, eta squared, post-hoc Tukey (se significativo)
    """
    try:
        # Validazione parametri
        if competence_type not in ['practical_competence', 'theoretical_competence']:
            raise HTTPException(
                status_code=400,
                detail="competence_type must be 'practical_competence' or 'theoretical_competence'"
            )

        if respondent not in ['student', 'teacher']:
            raise HTTPException(
                status_code=400,
                detail="respondent must be 'student' or 'teacher'"
            )

        # Raggruppa dati per tipo scuola
        groups = {}

        if respondent == 'student':
            students = db.query(StudentResponse).all()
            for s in students:
                if s.school_type and getattr(s, competence_type):
                    if s.school_type not in groups:
                        groups[s.school_type] = []
                    groups[s.school_type].append(getattr(s, competence_type))
        else:  # teacher
            teachers = db.query(TeacherResponse).filter(
                TeacherResponse.currently_teaching == 'Attualmente insegno.'
            ).all()
            for t in teachers:
                if t.school_level and getattr(t, competence_type):
                    if t.school_level not in groups:
                        groups[t.school_level] = []
                    groups[t.school_level].append(getattr(t, competence_type))

        # Filtra gruppi con almeno 10 osservazioni (per robustezza statistica)
        groups = {k: v for k, v in groups.items() if len(v) >= 10}

        if len(groups) < 2:
            raise HTTPException(
                status_code=404,
                detail="Not enough groups (minimum 2 with ≥10 observations each) for ANOVA"
            )

        # Esegui ANOVA
        result = InferentialStats.one_way_anova(groups)

        # Aggiungi metadati
        result["variable"] = competence_type
        result["variable_description"] = {
            'practical_competence': 'Practical AI Competence (1-7)',
            'theoretical_competence': 'Theoretical AI Competence (1-7)'
        }.get(competence_type)
        result["grouping_variable"] = "school_type" if respondent == "student" else "school_level"
        result["respondent_type"] = respondent

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ANOVA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/correlation-matrix/{respondent_type}")
def correlation_matrix(
    respondent_type: str,
    method: str = "pearson",
    include_non_teaching: bool = False,
    only_non_teaching: bool = False,
    subject_type: str = None,
    db: Session = Depends(get_db)
):
    """
    Calcola matrice di correlazione per variabili continue.

    Parametri:
    - respondent_type: 'student' o 'teacher'
    - method: 'pearson' (default) o 'spearman'
    - subject_type: (solo per teacher) 'Umanistica' o 'STEM (Science, Technology, Engineering, Mathematics)' per filtrare

    Variabili incluse nell'analisi:
    - practical_competence: Competenza pratica (1-7)
    - theoretical_competence: Competenza teorica (1-7)
    - trust_integration: Fiducia integrazione AI (1-7)
    - training_adequacy: Adeguatezza formazione (1-7)
    - hours_daily: Ore utilizzo quotidiano
    - age: Età

    Returns:
    - Matrice di correlazione completa con p-values e correlazioni significative
    """
    try:
        if respondent_type not in ['student', 'teacher']:
            raise HTTPException(
                status_code=400,
                detail="respondent_type must be 'student' or 'teacher'"
            )

        if method not in ['pearson', 'spearman']:
            raise HTTPException(
                status_code=400,
                detail="method must be 'pearson' or 'spearman'"
            )

        # Costruisci DataFrame con variabili di interesse
        if respondent_type == 'student':
            responses = db.query(StudentResponse).all()
            data_dict = {
                # Variabili Likert (1-7)
                'practical_competence': [],
                'theoretical_competence': [],
                'ai_change_study': [],
                'training_adequacy': [],
                'trust_integration': [],
                'concern_ai_school': [],
                'concern_ai_peers': [],
                # Variabili numeriche continue
                'age': [],
                'hours_daily': [],
                'hours_study': [],
                # Variabili categoriche codificate
                'gender_code': [],
                'uses_ai_daily_code': [],
                'uses_ai_study_code': [],
                'school_type_code': []
            }

            for r in responses:
                # Likert
                data_dict['practical_competence'].append(r.practical_competence)
                data_dict['theoretical_competence'].append(r.theoretical_competence)
                data_dict['ai_change_study'].append(r.ai_change_study)
                data_dict['training_adequacy'].append(r.training_adequacy)
                data_dict['trust_integration'].append(r.trust_integration)
                data_dict['concern_ai_school'].append(r.concern_ai_school)
                data_dict['concern_ai_peers'].append(r.concern_ai_peers)
                # Numeriche
                data_dict['age'].append(r.age)
                data_dict['hours_daily'].append(r.hours_daily)
                data_dict['hours_study'].append(r.hours_study)
                # Categoriche codificate
                data_dict['gender_code'].append(encode_gender(r.gender) if r.gender else None)
                data_dict['uses_ai_daily_code'].append(encode_yes_no(r.uses_ai_daily) if r.uses_ai_daily else None)
                data_dict['uses_ai_study_code'].append(encode_yes_no(r.uses_ai_study) if r.uses_ai_study else None)
                data_dict['school_type_code'].append(encode_school_type(r.school_type) if r.school_type else None)

        else:  # teacher
            # Filtra insegnanti in base ai parametri
            teacher_query = db.query(TeacherResponse)
            if only_non_teaching:
                teacher_query = teacher_query.filter(TeacherResponse.currently_teaching != 'Attualmente insegno.')
            elif not include_non_teaching:
                teacher_query = teacher_query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')
            
            # Filtra per tipo di materia se specificato
            if subject_type:
                teacher_query = teacher_query.filter(TeacherResponse.subject_type == subject_type)

            responses = teacher_query.all()
            data_dict = {
                # Variabili Likert (1-7)
                'practical_competence': [],
                'theoretical_competence': [],
                'ai_change_teaching': [],
                'training_adequacy': [],
                'trust_integration': [],
                'concern_ai_education': [],
                'concern_ai_students': [],
                # Variabili numeriche continue
                'age': [],
                'hours_daily': [],
                'hours_training': [],
                'hours_lesson_planning': [],
                # Variabili categoriche codificate (binarie 0/1)
                'gender_code': [],
                'uses_ai_daily_code': [],
                'school_level_code': [],
                'currently_teaching_binary': [],  # 1=Insegna, 0=Non insegna
                'subject_type_stem': []  # 1=STEM, 0=Umanistica
            }

            for r in responses:
                # Likert
                data_dict['practical_competence'].append(r.practical_competence)
                data_dict['theoretical_competence'].append(r.theoretical_competence)
                data_dict['ai_change_teaching'].append(r.ai_change_teaching)
                data_dict['training_adequacy'].append(r.training_adequacy)
                data_dict['trust_integration'].append(r.trust_integration)
                data_dict['concern_ai_education'].append(r.concern_ai_education)
                data_dict['concern_ai_students'].append(r.concern_ai_students)
                # Numeriche
                data_dict['age'].append(r.age)
                data_dict['hours_daily'].append(r.hours_daily)
                data_dict['hours_training'].append(r.hours_training)
                data_dict['hours_lesson_planning'].append(r.hours_lesson_planning)
                # Categoriche codificate
                data_dict['gender_code'].append(encode_gender(r.gender) if r.gender else None)
                data_dict['uses_ai_daily_code'].append(encode_yes_no(r.uses_ai_daily) if r.uses_ai_daily else None)
                data_dict['school_level_code'].append(encode_school_level(r.school_level) if r.school_level else None)
                # Variabili binarie per correlazioni (0/1)
                data_dict['currently_teaching_binary'].append(encode_currently_teaching(r.currently_teaching) if r.currently_teaching else None)
                data_dict['subject_type_stem'].append(encode_subject_type(r.subject_type) if r.subject_type else None)

        # Crea DataFrame e rimuovi colonne completamente vuote
        df = pd.DataFrame(data_dict)
        df = df.dropna(axis=1, how='all')  # Rimuovi colonne senza dati
        df = df.loc[:, df.notna().sum() > 10]  # Mantieni solo colonne con almeno 10 valori validi

        # Calcola correlazioni (Pearson/Spearman standard)
        result = CorrelationAnalysis.correlation_matrix(df, method=method)

        # Aggiungi metadati
        result['respondent_type'] = respondent_type
        result['n_total'] = len(responses)
        if subject_type:
            result['subject_type'] = subject_type

        # Identifica variabili dicotomiche per punto-biserial
        dichotomous_vars = [col for col in df.columns if col.endswith('_code') and df[col].nunique() <= 2]
        result['dichotomous_variables'] = dichotomous_vars
        result['note'] = "Use /api/statistics/correlation-point-biserial for explicit point-biserial correlations with dichotomous variables"

        # Aggiungi raw_data per scatter plots (solo prime 500 righe per performance)
        raw_data_dict = {}
        for col in df.columns:
            # Converti a lista, sostituendo NaN con None
            values = df[col].head(500).tolist()
            raw_data_dict[col] = [None if pd.isna(v) else float(v) for v in values]

        result['raw_data'] = raw_data_dict
        result['raw_data_n'] = min(500, len(df))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in correlation matrix: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/regression/practical-competence")
def regression_practical_competence(
    respondent_type: str = "student",
    db: Session = Depends(get_db)
):
    """
    Regressione multipla: Predittori della Competenza Pratica.

    Parametri:
    - respondent_type: 'student' o 'teacher'

    Modello Studenti:
    - DV: practical_competence
    - IVs: hours_daily, theoretical_competence, age, uses_ai_daily (dummy)

    Modello Insegnanti:
    - DV: practical_competence
    - IVs: hours_daily, theoretical_competence, age, training_adequacy

    Returns:
    - R², coefficienti, beta standardizzati, interpretazione predittori
    """
    try:
        if respondent_type not in ['student', 'teacher']:
            raise HTTPException(
                status_code=400,
                detail="respondent_type must be 'student' or 'teacher'"
            )

        # Prepara dati
        if respondent_type == 'student':
            responses = db.query(StudentResponse).all()
            data = []

            for s in responses:
                if all([
                    s.practical_competence is not None,
                    s.hours_daily is not None,
                    s.theoretical_competence is not None,
                    s.age is not None,
                    s.uses_ai_daily is not None
                ]):
                    data.append({
                        'practical_competence': s.practical_competence,
                        'hours_daily': s.hours_daily,
                        'theoretical_competence': s.theoretical_competence,
                        'age': s.age,
                        'uses_ai_daily': 1 if s.uses_ai_daily == 'Sì' else 0
                    })

            if len(data) < 10:
                raise HTTPException(
                    status_code=404,
                    detail="Insufficient complete data for regression"
                )

            df = pd.DataFrame(data)
            X = df[['hours_daily', 'theoretical_competence', 'age', 'uses_ai_daily']]
            y = df['practical_competence']
            feature_names = [
                'Hours Daily Use',
                'Theoretical Competence',
                'Age',
                'Uses AI Daily (Yes=1)'
            ]

        else:  # teacher
            responses = db.query(TeacherResponse).filter(
                TeacherResponse.currently_teaching == 'Attualmente insegno.'
            ).all()
            data = []

            for t in responses:
                if all([
                    t.practical_competence is not None,
                    t.hours_daily is not None,
                    t.theoretical_competence is not None,
                    t.age is not None,
                    t.training_adequacy is not None
                ]):
                    data.append({
                        'practical_competence': t.practical_competence,
                        'hours_daily': t.hours_daily,
                        'theoretical_competence': t.theoretical_competence,
                        'age': t.age,
                        'training_adequacy': t.training_adequacy
                    })

            if len(data) < 10:
                raise HTTPException(
                    status_code=404,
                    detail="Insufficient complete data for regression"
                )

            df = pd.DataFrame(data)
            X = df[['hours_daily', 'theoretical_competence', 'age', 'training_adequacy']]
            y = df['practical_competence']
            feature_names = [
                'Hours Daily Use',
                'Theoretical Competence',
                'Age',
                'Training Adequacy'
            ]

        # Esegui regressione
        result = RegressionAnalysis.multiple_regression(X, y, feature_names)

        # Aggiungi metadati
        result['dependent_variable'] = 'Practical AI Competence (1-7)'
        result['respondent_type'] = respondent_type

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in regression analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/comparison-with-ci")
def comparison_with_confidence_intervals(
    include_non_teaching: bool = False,
    only_non_teaching: bool = False,
    db: Session = Depends(get_db)
):
    """
    Confronto studenti vs insegnanti per variabili chiave con intervalli di confidenza.

    Ottimizzato per visualizzazioni con error bars.

    Parameters:
    - include_non_teaching: True per tutti gli insegnanti (455)
    - only_non_teaching: True per solo insegnanti in formazione (99)
    - default: solo insegnanti attivi (356)

    Returns:
    - Statistiche complete (mean, SD, IC 95%) per ogni variabile comparata
    """
    try:
        # Variabili da confrontare
        variables = [
            'practical_competence',
            'theoretical_competence',
            'trust_integration',
            'training_adequacy'
        ]

        variable_labels = {
            'practical_competence': 'Competenza Pratica',
            'theoretical_competence': 'Competenza Teorica',
            'trust_integration': 'Fiducia Integrazione AI',
            'training_adequacy': 'Adeguatezza Formazione'
        }

        # Ottieni dati studenti
        students = db.query(StudentResponse).all()

        # Filtra insegnanti in base ai parametri
        teacher_query = db.query(TeacherResponse)
        if only_non_teaching:
            teacher_query = teacher_query.filter(TeacherResponse.currently_teaching != 'Attualmente insegno.')
        elif not include_non_teaching:
            teacher_query = teacher_query.filter(TeacherResponse.currently_teaching == 'Attualmente insegno.')

        teachers = teacher_query.all()

        comparisons = []

        for var in variables:
            # Estrai valori
            student_values = [
                getattr(s, var) for s in students
                if getattr(s, var) is not None
            ]
            teacher_values = [
                getattr(t, var) for t in teachers
                if getattr(t, var) is not None
            ]

            if not student_values or not teacher_values:
                continue

            # Calcola statistiche con IC
            student_stats = calculate_mean_with_ci(student_values)
            teacher_stats = calculate_mean_with_ci(teacher_values)

            comparisons.append({
                "variable": var,
                "label": variable_labels[var],
                "students": student_stats,
                "teachers": teacher_stats,
                "difference": round(student_stats['mean'] - teacher_stats['mean'], 2)
            })

        return {
            "comparisons": comparisons,
            "note": "IC 95% calcolati usando distribuzione t di Student"
        }

    except Exception as e:
        logger.error(f"Error in comparison with CI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/respondents/list")
def get_respondents_list(
    respondent_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Ottieni la lista di tutti i codici rispondenti disponibili.
    
    Parameters:
    - respondent_type: 'student', 'teacher', 'teacher_active', 'teacher_training', o None per tutti
    
    Returns:
    - Lista di codici rispondenti con tipo e conteggio
    """
    try:
        respondents = []
        
        # Aggiungi studenti
        if respondent_type in [None, 'student']:
            students = db.query(StudentResponse.code).distinct().all()
            respondents.extend([
                {"code": s.code, "type": "student"}
                for s in students if s.code
            ])
        
        # Aggiungi insegnanti
        if respondent_type in [None, 'teacher', 'teacher_active', 'teacher_training']:
            teacher_query = db.query(TeacherResponse.code, TeacherResponse.currently_teaching).distinct()
            teachers = teacher_query.all()
            
            for t in teachers:
                if not t.code:
                    continue
                
                is_teaching = t.currently_teaching == 'Attualmente insegno.'
                
                # Filtra in base al tipo richiesto
                if respondent_type == 'teacher_active' and not is_teaching:
                    continue
                if respondent_type == 'teacher_training' and is_teaching:
                    continue
                
                respondents.append({
                    "code": t.code,
                    "type": "teacher_active" if is_teaching else "teacher_training"
                })
        
        return {
            "total": len(respondents),
            "respondents": sorted(respondents, key=lambda x: x['code'])
        }
        
    except Exception as e:
        logger.error(f"Error getting respondents list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/respondent/{code}")
def get_respondent_data(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Ottieni tutte le risposte di un singolo rispondente basandosi sul codice identificativo.
    
    Parameters:
    - code: Codice identificativo del rispondente (ultimi 4 caratteri cognome madre + gg nascita)
    
    Returns:
    - Tutte le risposte del rispondente con domande e valori
    """
    try:
        # Cerca prima tra gli studenti
        student = db.query(StudentResponse).filter(StudentResponse.code == code).first()
        if student:
            # Ottieni l'oggetto come dizionario
            data = {
                "found": True,
                "code": student.code,
                "respondent_type": "student",
                "timestamp": str(student.timestamp) if student.timestamp else None,
                "responses": []
            }
            
            # Mappa COMPLETA field -> (domanda, categoria) per TUTTI i campi
            field_questions = [
                ("age", "Età", "Dati Demografici"),
                ("gender", "Genere", "Dati Demografici"),
                ("school_type", "Tipo di scuola", "Dati Demografici"),
                ("education_level", "Livello di istruzione", "Dati Demografici"),
                ("study_path", "Percorso di studi", "Dati Demografici"),
                ("practical_competence", "Competenze pratiche in IA (1-7)", "Competenze e Conoscenze"),
                ("theoretical_competence", "Competenze teoriche in IA (1-7)", "Competenze e Conoscenze"),
                ("ai_change_study", "L'IA cambierà il mio percorso di studi (1-7)", "Impatto e Cambiamento"),
                ("training_adequacy", "Adeguatezza della formazione ricevuta (1-7)", "Formazione e Preparazione"),
                ("trust_integration", "Fiducia nell'integrazione dell'IA (1-7)", "Fiducia e Atteggiamenti"),
                ("teacher_preparation", "Preparazione degli insegnanti (1-7)", "Fiducia e Atteggiamenti"),
                ("concern_ai_school", "Preoccupazione per l'IA a scuola (1-7)", "Preoccupazioni e Rischi"),
                ("concern_ai_peers", "Preoccupazione per l'uso dell'IA tra i compagni (1-7)", "Preoccupazioni e Rischi"),
                ("uses_ai_daily", "Usa l'IA quotidianamente", "Utilizzo e Frequenza"),
                ("hours_daily", "Ore giornaliere uso IA", "Utilizzo e Frequenza"),
                ("uses_ai_study", "Usa l'IA per studiare", "Utilizzo e Frequenza"),
                ("hours_study", "Ore settimanali uso IA per studio", "Utilizzo e Frequenza"),
                ("hours_learning_tools", "Ore settimanali strumenti apprendimento IA", "Utilizzo e Frequenza"),
                ("hours_saved", "Ore risparmiate grazie all'IA", "Utilizzo e Frequenza"),
                ("ai_tools", "Strumenti IA utilizzati", "Strumenti e Pratiche"),
                ("ai_purposes", "Scopi utilizzo IA", "Strumenti e Pratiche"),
                ("not_use_for", "Non usa l'IA per", "Strumenti e Pratiche"),
                ("preferred_tools", "Strumenti preferiti", "Strumenti e Pratiche"),
            ]
            
            # Aggiungi tutti i campi standard
            for field_info in field_questions:
                field_name, question_text, category = field_info
                if hasattr(student, field_name):
                    value = getattr(student, field_name)
                    if value is not None and value != "":
                        data["responses"].append({
                            "question": question_text,
                            "value": str(value),
                            "type": "closed",
                            "category": category
                        })
            
            # Aggiungi le risposte APERTE dal campo JSON
            if student.open_responses:
                open_resp = student.open_responses
                # Mappa delle domande aperte in italiano
                open_questions_map = {
                    "preferred_tools_why": "Perché preferisci questi strumenti IA?",
                    "personalization_examples": "Esempi di personalizzazione dell'apprendimento con IA",
                    "prompt_examples": "Esempi di prompt che hai utilizzato",
                    "learning_improvement": "Come l'IA ha migliorato il tuo apprendimento?",
                    "specific_examples": "Esempi specifici di utilizzo dell'IA",
                    "difficulties": "Difficoltà incontrate nell'utilizzo dell'IA",
                    "why_not_use": "Perché non usi l'IA?",
                    "pros_cons": "Pro e contro dell'IA nell'apprendimento",
                    "not_recommended": "Cosa non consiglieresti riguardo l'IA?",
                    "survey_improvements": "Suggerimenti per migliorare questo questionario"
                }
                
                if isinstance(open_resp, dict):
                    for key, answer in open_resp.items():
                        if answer and str(answer).strip() and str(answer).strip() != '-' and str(answer).strip().lower() != 'null':
                            question_text = open_questions_map.get(key, key)
                            data["responses"].append({
                                "question": question_text,
                                "value": str(answer),
                                "type": "open",
                                "category": "Risposte Aperte"
                            })
            
            return data
        
        # Cerca tra gli insegnanti
        teacher = db.query(TeacherResponse).filter(TeacherResponse.code == code).first()
        if teacher:
            # Ottieni l'oggetto come dizionario
            data = {
                "found": True,
                "code": teacher.code,
                "respondent_type": "teacher_active" if teacher.currently_teaching == 'Attualmente insegno.' else "teacher_training",
                "timestamp": str(teacher.timestamp) if teacher.timestamp else None,
                "responses": []
            }
            
            # Mappa COMPLETA field -> (domanda, categoria) per TUTTI i campi insegnanti
            field_questions = [
                ("currently_teaching", "Attualmente insegna", "Dati Demografici"),
                ("age", "Età", "Dati Demografici"),
                ("gender", "Genere", "Dati Demografici"),
                ("education_level", "Livello di istruzione", "Dati Demografici"),
                ("school_level", "Livello scolastico di insegnamento", "Dati Demografici"),
                ("subject_type", "Tipo di materia", "Dati Demografici"),
                ("subject_area", "Area disciplinare", "Dati Demografici"),
                ("practical_competence", "Competenze pratiche in IA (1-7)", "Competenze e Conoscenze"),
                ("theoretical_competence", "Competenze teoriche in IA (1-7)", "Competenze e Conoscenze"),
                ("ai_change_teaching", "L'IA cambierà l'insegnamento in generale (1-7)", "Impatto e Cambiamento"),
                ("ai_change_my_teaching", "L'IA cambierà il mio insegnamento (1-7)", "Impatto e Cambiamento"),
                ("training_adequacy", "Adeguatezza della formazione ricevuta (1-7)", "Formazione e Preparazione"),
                ("trust_integration", "Fiducia nell'integrazione dell'IA (1-7)", "Fiducia e Atteggiamenti"),
                ("trust_students_responsible", "Fiducia nell'uso responsabile dell'IA da parte degli studenti (1-7)", "Fiducia e Atteggiamenti"),
                ("concern_ai_education", "Preoccupazione per l'IA nell'istruzione (1-7)", "Preoccupazioni e Rischi"),
                ("concern_ai_students", "Preoccupazione per l'uso dell'IA da parte degli studenti (1-7)", "Preoccupazioni e Rischi"),
                ("uses_ai_daily", "Usa l'IA quotidianamente", "Utilizzo e Frequenza"),
                ("hours_daily", "Ore giornaliere uso IA", "Utilizzo e Frequenza"),
                ("uses_ai_teaching", "Usa l'IA per l'insegnamento", "Utilizzo e Frequenza"),
                ("hours_training", "Ore settimanali formazione con IA", "Utilizzo e Frequenza"),
                ("hours_lesson_planning", "Ore settimanali pianificazione lezioni con IA", "Utilizzo e Frequenza"),
                ("ai_tools", "Strumenti IA utilizzati", "Strumenti e Pratiche"),
                ("ai_purposes", "Scopi utilizzo IA", "Strumenti e Pratiche"),
                ("not_use_for", "Non usa l'IA per", "Strumenti e Pratiche"),
                ("preferred_tools", "Strumenti preferiti", "Strumenti e Pratiche"),
            ]
            
            # Aggiungi tutti i campi standard
            for field_info in field_questions:
                field_name, question_text, category = field_info
                if hasattr(teacher, field_name):
                    value = getattr(teacher, field_name)
                    if value is not None and value != "":
                        # Normalizza school_level
                        if field_name == "school_level":
                            value = normalize_school_level(value)
                        data["responses"].append({
                            "question": question_text,
                            "value": str(value),
                            "type": "closed",
                            "category": category
                        })
            
            # Aggiungi le risposte APERTE dal campo JSON
            if teacher.open_responses:
                open_resp = teacher.open_responses
                # Mappa delle domande aperte in italiano per insegnanti
                open_questions_map = {
                    "preferred_tools_why": "Perché preferisci questi strumenti IA?",
                    "individualization": "Come l'IA aiuta nell'individualizzazione dell'insegnamento?",
                    "personalization": "Come personalizzi l'insegnamento con l'IA?",
                    "prompt_examples": "Esempi di prompt che hai utilizzato",
                    "learning_improvement": "Come l'IA ha migliorato l'insegnamento/apprendimento?",
                    "specific_examples": "Esempi specifici di utilizzo dell'IA nell'insegnamento",
                    "difficulties": "Difficoltà incontrate nell'utilizzo dell'IA",
                    "why_not_use": "Perché non usi l'IA nell'insegnamento?",
                    "pros_cons": "Pro e contro dell'IA nell'insegnamento",
                    "not_recommended": "Cosa non consiglieresti riguardo l'IA nell'insegnamento?",
                    "survey_improvements": "Suggerimenti per migliorare questo questionario"
                }
                
                if isinstance(open_resp, dict):
                    for key, answer in open_resp.items():
                        if answer and str(answer).strip() and str(answer).strip() != '-' and str(answer).strip().lower() != 'null':
                            question_text = open_questions_map.get(key, key)
                            data["responses"].append({
                                "question": question_text,
                                "value": str(answer),
                                "type": "open",
                                "category": "Risposte Aperte"
                            })
            
            return data
        
        # Rispondente non trovato
        return {
            "found": False,
            "code": code,
            "message": "Nessun rispondente trovato con questo codice"
        }
        
    except Exception as e:
        logger.error(f"Error getting respondent data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def normalize_school_level(level):
    """Normalizza il livello scolastico per accorpare varianti"""
    if not level:
        return level
    level_str = str(level).strip()
    level_lower = level_str.lower()
    
    # Normalizza tutte le varianti di Infanzia
    if 'infanzia' in level_lower:
        return "Scuola dell'Infanzia"
    # Normalizza Primaria
    if 'primaria' in level_lower:
        return "Scuola Primaria"
    # Normalizza Secondaria I grado
    if 'secondaria' in level_lower and ('i grado' in level_lower or 'primo grado' in level_lower or 'medie' in level_lower):
        return "Scuola Secondaria di I Grado"
    # Normalizza Secondaria II grado
    if 'secondaria' in level_lower and ('ii grado' in level_lower or 'secondo grado' in level_lower or 'superiori' in level_lower):
        return "Scuola Secondaria di II Grado"
    
    return level_str

@app.get("/api/demographics")
def get_demographics_profiles(db: Session = Depends(get_db)):
    """
    Ottieni profili demografici aggregati per le 3 categorie:
    - Studenti
    - Insegnanti attivi
    - Insegnanti in formazione
    
    Returns statistiche demografiche complete per confronto e drill-down
    """
    try:
        from collections import Counter
        
        # Query studenti
        students = db.query(StudentResponse).all()
        
        # Query insegnanti (separati per tipo)
        teachers_active = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching == 'Attualmente insegno.'
        ).all()
        
        teachers_training = db.query(TeacherResponse).filter(
            TeacherResponse.currently_teaching != 'Attualmente insegno.'
        ).all()
        
        def calculate_age_distribution(respondents):
            """Calcola distribuzione età con fasce e statistiche descrittive"""
            ages = sorted([r.age for r in respondents if r.age is not None])
            if not ages:
                return {
                    "ranges": {},
                    "avg": 0,
                    "min": 0,
                    "max": 0,
                    "total": 0,
                    "median": 0,
                    "q1": 0,
                    "q3": 0,
                    "iqr": 0,
                    "whisker_low": 0,
                    "whisker_high": 0,
                    "outliers": []
                }

            # Fasce età
            ranges = {
                "18-25": len([a for a in ages if 18 <= a <= 25]),
                "26-35": len([a for a in ages if 26 <= a <= 35]),
                "36-45": len([a for a in ages if 36 <= a <= 45]),
                "46-55": len([a for a in ages if 46 <= a <= 55]),
                "56+": len([a for a in ages if a >= 56])
            }

            # Quartili e outlier (metodo IQR)
            if len(ages) >= 4:
                quartiles = statistics.quantiles(ages, n=4, method="inclusive")
                q1, q2, q3 = quartiles[0], statistics.median(ages), quartiles[2]
            else:
                # Con meno di 4 valori assumiamo Q1/Q3 uguali alla mediana per evitare valori incoerenti
                q2 = statistics.median(ages)
                q1 = min(ages)
                q3 = max(ages)

            iqr = q3 - q1
            lower_fence = q1 - 1.5 * iqr
            upper_fence = q3 + 1.5 * iqr

            in_fence_values = [a for a in ages if lower_fence <= a <= upper_fence]
            outliers = [a for a in ages if a < lower_fence or a > upper_fence]

            whisker_low = min(in_fence_values) if in_fence_values else min(ages)
            whisker_high = max(in_fence_values) if in_fence_values else max(ages)

            return {
                "ranges": ranges,
                "avg": round(sum(ages) / len(ages), 1),
                "min": min(ages),
                "max": max(ages),
                "total": len(ages),
                "median": round(q2, 1),
                "q1": round(q1, 1),
                "q3": round(q3, 1),
                "iqr": round(iqr, 1),
                "whisker_low": round(whisker_low, 1),
                "whisker_high": round(whisker_high, 1),
                "outliers": outliers
            }
        
        def calculate_gender_distribution(respondents):
            """Calcola distribuzione genere"""
            genders = [r.gender for r in respondents if r.gender]
            counter = Counter(genders)
            total = len(genders)
            
            return {
                "distribution": dict(counter),
                "percentages": {k: round(v/total*100, 1) for k, v in counter.items()} if total > 0 else {},
                "total": total
            }
        
        def calculate_education_distribution(respondents):
            """Calcola distribuzione titoli di studio"""
            educations = [r.education_level for r in respondents if r.education_level]
            counter = Counter(educations)
            total = len(educations)
            
            return {
                "distribution": dict(counter),
                "percentages": {k: round(v/total*100, 1) for k, v in counter.items()} if total > 0 else {},
                "total": total
            }
        
        # STUDENTI
        students_profile = {
            "total": len(students),
            "age": calculate_age_distribution(students),
            "gender": calculate_gender_distribution(students),
            "education": calculate_education_distribution(students),
            "school_type": {
                "distribution": dict(Counter([s.school_type for s in students if s.school_type])),
                "total": len([s for s in students if s.school_type])
            },
            "study_path": {
                "distribution": dict(Counter([s.study_path for s in students if s.study_path])),
                "total": len([s for s in students if s.study_path])
            }
        }
        
        # INSEGNANTI ATTIVI
        teachers_active_profile = {
            "total": len(teachers_active),
            "age": calculate_age_distribution(teachers_active),
            "gender": calculate_gender_distribution(teachers_active),
            "education": calculate_education_distribution(teachers_active),
            "school_level": {
                "distribution": dict(Counter([normalize_school_level(t.school_level) for t in teachers_active if t.school_level])),
                "total": len([t for t in teachers_active if t.school_level])
            },
            "subject_type": {
                "distribution": dict(Counter([t.subject_type for t in teachers_active if t.subject_type])),
                "total": len([t for t in teachers_active if t.subject_type])
            },
            "subject_area": {
                "distribution": dict(Counter([t.subject_area for t in teachers_active if t.subject_area])),
                "total": len([t for t in teachers_active if t.subject_area])
            }
        }
        
        # INSEGNANTI IN FORMAZIONE
        teachers_training_profile = {
            "total": len(teachers_training),
            "age": calculate_age_distribution(teachers_training),
            "gender": calculate_gender_distribution(teachers_training),
            "education": calculate_education_distribution(teachers_training),
            "school_level": {
                "distribution": dict(Counter([normalize_school_level(t.school_level) for t in teachers_training if t.school_level])),
                "total": len([t for t in teachers_training if t.school_level])
            },
            "subject_type": {
                "distribution": dict(Counter([t.subject_type for t in teachers_training if t.subject_type])),
                "total": len([t for t in teachers_training if t.subject_type])
            },
            "subject_area": {
                "distribution": dict(Counter([t.subject_area for t in teachers_training if t.subject_area])),
                "total": len([t for t in teachers_training if t.subject_area])
            }
        }
        
        return {
            "students": students_profile,
            "teachers_active": teachers_active_profile,
            "teachers_training": teachers_training_profile,
            "totals": {
                "students": len(students),
                "teachers_active": len(teachers_active),
                "teachers_training": len(teachers_training),
                "all": len(students) + len(teachers_active) + len(teachers_training)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting demographics profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def format_response_value(value: Any, response_format: str) -> str:
    """Formatta il valore della risposta in base al formato"""
    if value is None:
        return "Nessuna risposta"
    
    if response_format == 'scale_1_7':
        return f"{value}/7"
    elif response_format == 'yes_no':
        return value
    elif response_format == 'numeric':
        return str(value)
    elif response_format in ['text', 'multiple_choice']:
        return str(value)
    else:
        return str(value)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
