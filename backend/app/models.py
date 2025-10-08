from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class StudentResponse(Base):
    __tablename__ = "student_responses"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    code = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    school_type = Column(String)
    education_level = Column(String)
    study_path = Column(String)

    # Competenze (scale 1-7)
    practical_competence = Column(Float)
    theoretical_competence = Column(Float)

    # Impatto e fiducia (scale 1-7)
    ai_change_study = Column(Float)
    training_adequacy = Column(Float)
    trust_integration = Column(Float)
    teacher_preparation = Column(Float)

    # Preoccupazioni (scale 1-7)
    concern_ai_school = Column(Float)
    concern_ai_peers = Column(Float)

    # Utilizzo
    uses_ai_daily = Column(String)
    hours_daily = Column(Float)
    uses_ai_study = Column(String)
    hours_study = Column(Float)
    hours_learning_tools = Column(Float)
    hours_saved = Column(Float)

    # Strumenti e pratiche
    ai_tools = Column(Text)
    ai_purposes = Column(Text)
    not_use_for = Column(Text)
    preferred_tools = Column(Text)

    # Risposte aperte (escluse dall'analisi principale)
    open_responses = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TeacherResponse(Base):
    __tablename__ = "teacher_responses"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    code = Column(String, index=True)
    currently_teaching = Column(String)
    age = Column(Integer)
    gender = Column(String)
    education_level = Column(String)
    school_level = Column(String)
    subject_type = Column(String)
    subject_area = Column(String)

    # Competenze (scale 1-7)
    practical_competence = Column(Float)
    theoretical_competence = Column(Float)

    # Impatto e cambiamento (scale 1-7)
    ai_change_teaching = Column(Float)
    ai_change_my_teaching = Column(Float)
    training_adequacy = Column(Float)

    # Fiducia (scale 1-7)
    trust_integration = Column(Float)
    trust_students_responsible = Column(Float)

    # Preoccupazioni (scale 1-7)
    concern_ai_education = Column(Float)
    concern_ai_students = Column(Float)

    # Utilizzo
    uses_ai_daily = Column(String)
    hours_daily = Column(Float)
    uses_ai_teaching = Column(String)
    hours_training = Column(Float)
    hours_lesson_planning = Column(Float)

    # Strumenti e pratiche
    ai_tools = Column(Text)
    ai_purposes = Column(Text)
    not_use_for = Column(Text)
    preferred_tools = Column(Text)

    # Risposte aperte (escluse dall'analisi principale)
    open_responses = Column(JSON)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuestionMapping(Base):
    __tablename__ = "question_mappings"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String)  # 'specular', 'student_only', 'teacher_only'
    student_question = Column(Text)
    teacher_question = Column(Text)
    category = Column(String)  # 'competenze', 'fiducia', 'preoccupazioni', 'utilizzo'
    field_name = Column(String)

class Question(Base):
    """Modello per rappresentare tutte le domande del questionario"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # 'closed' o 'open'
    respondent_type = Column(String, nullable=False)  # 'student' o 'teacher'
    category = Column(String)  # 'demographic', 'competence', 'usage', 'tools', 'open_reflection'
    response_format = Column(String)  # 'scale_1_7', 'yes_no', 'numeric', 'multiple_choice', 'text'
    column_index = Column(Integer)  # Indice della colonna nel file Excel
    field_name = Column(String)  # Nome del campo nel modello
    is_required = Column(String)  # 'yes' o 'no'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LLMConfig(Base):
    """Configurazione LLM per analisi qualitativa"""
    __tablename__ = "llm_config"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False)  # 'ollama', 'gemini', 'openai'
    endpoint = Column(String)  # URL endpoint (per Ollama)
    api_key = Column(String)  # API key (per Gemini/OpenAI)
    model_name = Column(String, nullable=False)  # Nome modello
    is_active = Column(Integer, default=1)  # 1=attivo, 0=inattivo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class QualitativePrompt(Base):
    """Prompt personalizzati per analisi qualitativa"""
    __tablename__ = "qualitative_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(String, nullable=False, unique=True)  # 'sentiment', 'thematic', etc.
    template_name = Column(String, nullable=False)  # Nome visualizzato
    description = Column(Text)  # Descrizione template
    system_prompt = Column(Text, nullable=False)  # System prompt
    user_prompt_template = Column(Text, nullable=False)  # User prompt template
    is_active = Column(Integer, default=1)  # 1=attivo, 0=inattivo
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class QualitativeTaxonomy(Base):
    """Tassonomia generata per analisi qualitativa"""
    __tablename__ = "qualitative_taxonomies"
    
    id = Column(Integer, primary_key=True, index=True)
    question_field = Column(String, nullable=False)  # 'learning_improvement', 'difficulties', etc.
    respondent_type = Column(String, nullable=False)  # 'student', 'teacher_active', 'teacher_training'
    taxonomy_data = Column(JSON, nullable=False)  # Array di categorie con definizioni
    n_clusters = Column(Integer)
    n_responses = Column(Integer)
    quality_score = Column(Float)  # Silhouette score o metrica simile
    narrative_report = Column(Text, nullable=True)  # NUOVO: Report discorsivo generato dall'AI
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QualitativeAnnotation(Base):
    """Annotazioni multi-label per risposte aperte"""
    __tablename__ = "qualitative_annotations"
    
    id = Column(Integer, primary_key=True, index=True)
    taxonomy_id = Column(Integer, nullable=False)  # FK a QualitativeTaxonomy
    respondent_code = Column(String, nullable=False)  # Codice anonimo
    response_text = Column(Text, nullable=False)
    labels = Column(JSON, nullable=False)  # Array di {category, confidence, relevant_phrase}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
