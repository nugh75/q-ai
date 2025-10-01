from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, get_db, Base
from .models import StudentResponse, TeacherResponse, Question
from .excel_parser import ExcelParser
from .analytics import Analytics
from .question_classifier import QuestionClassifier
from .question_stats_service import QuestionStatsService
from typing import Optional, List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crea le tabelle
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Questionnaire Analysis API",
    description="API per l'analisi di questionari studenti e insegnanti",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        analytics = Analytics(db)
        stats = analytics.get_student_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting student statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teachers")
def get_teacher_statistics(
    include_non_teaching: bool = False,
    db: Session = Depends(get_db)
):
    """Ottieni statistiche degli insegnanti (tutti per default, o solo attivi)"""
    try:
        analytics = Analytics(db)
        stats = analytics.get_teacher_statistics(include_non_teaching)
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
def get_comparative_analysis(db: Session = Depends(get_db)):
    """Ottieni analisi comparativa tra studenti e insegnanti"""
    try:
        analytics = Analytics(db)
        comparison = analytics.get_comparative_analysis()
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
