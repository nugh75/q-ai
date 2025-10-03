"""
Classificatore automatico di domande aperte/chiuse
"""
import re
from typing import List, Dict, Any

class QuestionClassifier:
    """Classifica automaticamente le domande come aperte o chiuse"""
    
    # Pattern che indicano domande chiuse
    CLOSED_PATTERNS = [
        r'su una scala da \d+ a \d+',
        r'da una scala da \d+ a \d+',
        r'quanti anni',
        r'quante ore',
        r'\(seleziona.*\)',
        r'il tuo genere è',
        r'titolo di studio',
        r'che scuola',
        r'quale ordine',
        r'sì.*no|no.*sì',
        r'utilizzai.*\?$',  # Domande sì/no sull'utilizzo
    ]
    
    # Pattern che indicano domande aperte
    OPEN_PATTERNS = [
        r'puoi.*spiegare',
        r'in che modo',
        r'quali sono.*perché',
        r'puoi.*fornire.*esempi',
        r'puoi.*darci.*esempi',
        r'secondo te',
        r'secondo la tua esperienza',
        r'in base alla tua esperienza',
    ]
    
    # Parole chiave per determinare il formato di risposta
    SCALE_KEYWORDS = ['scala da', 'scala da']
    YES_NO_KEYWORDS = ['utilizzi', 'attualmente insegni']
    NUMERIC_KEYWORDS = ['quanti anni', 'quante ore']
    MULTIPLE_CHOICE_KEYWORDS = ['seleziona tutte', 'puoi selezionare più opzioni', 'quali sono gli strumenti', 'quale ordine', 'in quale ordine', 'che scuola', 'tipo di materia', 'settore scientifico']
    
    @staticmethod
    def classify_question(question_text: str) -> str:
        """
        Classifica una domanda come 'closed' o 'open'
        
        Args:
            question_text: Il testo della domanda
            
        Returns:
            'closed' o 'open'
        """
        if not question_text or question_text.strip() == '':
            return 'closed'  # Default
        
        question_lower = question_text.lower()
        
        # Controlla pattern chiusi
        for pattern in QuestionClassifier.CLOSED_PATTERNS:
            if re.search(pattern, question_lower):
                return 'closed'
        
        # Controlla pattern aperti
        for pattern in QuestionClassifier.OPEN_PATTERNS:
            if re.search(pattern, question_lower):
                return 'open'
        
        # Se contiene "quali sono" seguito da domanda breve -> chiuso (multiple choice)
        if re.search(r'quali sono.*\?$', question_lower) and len(question_text) < 200:
            return 'closed'
        
        # Se la domanda è molto lunga e chiede spiegazioni -> aperto
        if len(question_text) > 250 and any(word in question_lower for word in ['come', 'perché', 'modo']):
            return 'open'
        
        # Default: se non è chiaro, consideriamo chiusa
        return 'closed'
    
    @staticmethod
    def determine_response_format(question_text: str, question_type: str) -> str:
        """
        Determina il formato di risposta della domanda
        
        Args:
            question_text: Il testo della domanda
            question_type: 'closed' o 'open'
            
        Returns:
            'scale_1_7', 'yes_no', 'numeric', 'multiple_choice', 'text'
        """
        if question_type == 'open':
            return 'text'
        
        question_lower = question_text.lower()
        
        # Scala 1-7
        if any(keyword in question_lower for keyword in QuestionClassifier.SCALE_KEYWORDS):
            return 'scale_1_7'
        
        # Numerico (età, ore)
        if any(keyword in question_lower for keyword in QuestionClassifier.NUMERIC_KEYWORDS):
            return 'numeric'
        
        # Multiple choice
        if any(keyword in question_lower for keyword in QuestionClassifier.MULTIPLE_CHOICE_KEYWORDS):
            return 'multiple_choice'
        
        # Yes/No
        if any(keyword in question_lower for keyword in QuestionClassifier.YES_NO_KEYWORDS):
            return 'yes_no'
        
        # Default
        return 'multiple_choice'
    
    @staticmethod
    def categorize_question(question_text: str, column_index: int) -> str:
        """
        Categorizza la domanda in base al contenuto
        
        Args:
            question_text: Il testo della domanda
            column_index: Indice della colonna
            
        Returns:
            Categoria della domanda
        """
        question_lower = question_text.lower()
        
        # Demografiche (prime colonne e domande specifiche)
        if column_index <= 8 and any(word in question_lower for word in ['età', 'genere', 'scuola', 'titolo', 'studio', 'percorso', 'ordine', 'materia', 'settore', 'anni hai', 'attualmente insegni', 'professione docente']):
            return 'demographic'
        
        # Competenze
        if any(word in question_lower for word in ['competent', 'competenza', 'pratico', 'teorico']):
            return 'competence'
        
        # Fiducia
        if any(word in question_lower for word in ['fiducioso', 'fiducia']):
            return 'trust'
        
        # Preoccupazioni
        if any(word in question_lower for word in ['preoccupa', 'preoccupato']):
            return 'concern'
        
        # Formazione
        if any(word in question_lower for word in ['formazione', 'adeguata']):
            return 'training'
        
        # Utilizzo e ore
        if any(word in question_lower for word in ['utilizzi', 'ore', 'settimana', 'quotidian']):
            return 'usage'
        
        # Strumenti
        if any(word in question_lower for word in ['strumenti', 'quali sono', 'preferiti', 'tool']):
            return 'tools'
        
        # Prompt e personalizzazione
        if any(word in question_lower for word in ['prompt', 'personaliz', 'individualiz']):
            return 'personalization'
        
        # Cambiamento e impatto
        if any(word in question_lower for word in ['cambierà', 'miglior']):
            return 'impact'
        
        # Difficoltà e problemi
        if any(word in question_lower for word in ['difficoltà', 'pro e contro', 'non sono raccomandate']):
            return 'challenges'
        
        # Riflessioni aperte
        if any(word in question_lower for word in ['secondo te', 'esperienza', 'esempi specifici']):
            return 'open_reflection'
        
        return 'other'
    
    @staticmethod
    def extract_all_questions_students() -> List[Dict[str, Any]]:
        """Estrae tutte le domande dal questionario studenti"""
        questions = [
            {"index": 0, "text": "Informazioni cronologiche"},
            {"index": 1, "text": "Inserisci un codice di 6 caratteri costituito dalle ultime 4 lettere del cognome di tua madre, seguite dal suo giorno di nascita nel formato gg."},
            {"index": 2, "text": "Quanti anni hai?"},
            {"index": 3, "text": "Il tuo genere è"},
            {"index": 4, "text": "Che scuola frequenti"},
            {"index": 5, "text": "Titolo di studio"},
            {"index": 6, "text": "Il tuo percorso attuale di studio è di tipo"},
            {"index": 7, "text": "Su una scala da 1 a 7, quanto ti consideri competente nell'uso pratico di strumenti o tecnologie legati all'intelligenza artificiale?"},
            {"index": 8, "text": "Su una scala da 1 a 7, quanto ritieni adeguata la tua competenza teorica riguardo l'intelligenza artificiale?"},
            {"index": 9, "text": "Da una scala da 1 a 7, quanto pensi che l'intelligenza artificiale cambierà il tuo modo di studiare?"},
            {"index": 10, "text": "Su una scala da 1 a 7, quanto ritieni adeguata la formazione ricevuta in merito all'intelligenza artificiale?"},
            {"index": 11, "text": "Da una scala da 1 a 7, quanto sei fiducioso nell'integrazione dell'intelligenza artificiale nella scuola o università?"},
            {"index": 12, "text": "Su una scala da 1 a 7, quanto ritieni che i tuoi attuali insegnanti siano preparati e competenti nell'insegnare l'uso dell'intelligenza artificiale?"},
            {"index": 13, "text": "Da una scala da 1 a 7, ti preoccupa l'inserimento dell'intelligenza artificiale nella scuola o nell'università?"},
            {"index": 14, "text": "Da una scala da 1 a 7, quanto sei preoccupato riguardo all'utilizzo dell'intelligenza artificiale da parte dei tuoi compagni di scuola o universitarì?"},
            {"index": 15, "text": "Nella tua vita quotidiana utilizzi l'intelligenza artificiale?"},
            {"index": 16, "text": "Se sì, quante ore alla settimana, in media, utilizzi strumenti di intelligenza artificiale per le tue attività quotidiane?"},
            {"index": 17, "text": "Se no, puoi spiegare perché non la utilizzi?"},
            {"index": 18, "text": "Utilizzi l'intelligenza artificiale nello studio?"},
            {"index": 19, "text": "Quante ore alla settimana mediamente utilizzi l'intelligenza artificiale per le tue attività quotidiane?"},
            {"index": 20, "text": "Quante ore alla settimana mediamente utilizzi l'intelligenza artificiale per le attività riguardanti lo studio?"},
            {"index": 21, "text": "Quante ore alla settimana mediamente dedichi ad informarti sui nuovi strumenti di intelligenza artificiale per lo studio?"},
            {"index": 22, "text": "Sapresti quante ore ti fa risparmiare l'uso dell'intelligenza artificiale nel tuo studio in una settimana?"},
            {"index": 23, "text": "Quali sono gli strumenti di intelligenza artificiale che utilizzi?"},
            {"index": 24, "text": "Per quali scopi usi l'intelligenza artificiale nei tuoi studi?"},
            {"index": 25, "text": "Per quali tipi di attività NON deve essere utilizzata l'intelligenza artificiale per apprendere?"},
            {"index": 26, "text": "Quali strumenti di intelligenza artificiale utilizzi regolarmente nel tuo studio?"},
            {"index": 27, "text": "Quali sono i tuoi strumenti preferiti e perché?"},
            {"index": 28, "text": "In che modo utilizzi l'intelligenza artificiale per personalizzare il tuo studio?"},
            {"index": 29, "text": "Puoi darci uno o più esempi di prompt che utilizzi?"},
            {"index": 30, "text": "In che modo l'intelligenza artificiale ti aiuta a migliorare ad apprendere?"},
            {"index": 31, "text": "Puoi fornire esempi specifici di come l'IA ha migliorato il tuo apprendimento?"},
            {"index": 32, "text": "Quali difficoltà hai incontrato nell'implementazione di strumenti di IA nella tua pratica di studio?"},
            {"index": 33, "text": "Puoi spiegare in maniera più dettagliata perché non utilizzi l'IA nello studio?"},
            {"index": 34, "text": "In base alla tua esperiezia, quali sono i pro e i contro dell'uso dell'intelligenza artificiale nello studio?"},
            {"index": 35, "text": "Secondo la tua esperienza, quali pratiche che utilizzano l'intelligenza artificiale NON sono raccomandate o NON dovrebbero essere usate per lo studio?"},
            {"index": 36, "text": "Secondo te come è possibile migliorare questo questionario? Ci sono delle cose che cambieresti? o che leveresti?"},
        ]
        
        processed = []
        for q in questions:
            question_type = QuestionClassifier.classify_question(q["text"])
            processed.append({
                "column_index": q["index"],
                "question_text": q["text"],
                "question_type": question_type,
                "respondent_type": "student",
                "category": QuestionClassifier.categorize_question(q["text"], q["index"]),
                "response_format": QuestionClassifier.determine_response_format(q["text"], question_type),
            })
        
        return processed
    
    @staticmethod
    def extract_all_questions_teachers() -> List[Dict[str, Any]]:
        """Estrae tutte le domande dal questionario insegnanti"""
        questions = [
            {"index": 0, "text": "Informazioni cronologiche"},
            {"index": 1, "text": "Inserisci un codice di 6 caratteri costituito dalle ultime 4 lettere del cognome di tua madre, seguite dal suo giorno di nascita nel formato gg."},
            {"index": 2, "text": "Attualmente insegni o hai intenzione di intraprendere la professione docente?"},
            {"index": 3, "text": "Quanti anni hai?"},
            {"index": 4, "text": "Il tuo genere è"},
            {"index": 5, "text": "Titolo di studio"},
            {"index": 6, "text": "In quale ordine di scuola insegni? O vorresti insegnare?"},
            {"index": 7, "text": "Insegna (o insegnerà) una materia"},
            {"index": 8, "text": "Qual è il tuo settore scientifico-disciplinare attuale?"},
            {"index": 9, "text": "Su una scala da 1 a 7, quanto ti consideri competente nell'uso pratico di strumenti o tecnologie legati all'intelligenza artificiale?"},
            {"index": 10, "text": "Su una scala da 1 a 7, quanto ritieni adeguata la tua competenza teorica riguardo l'intelligenza artificiale?"},
            {"index": 11, "text": "Da una scala da 1 a 7 quanto pensi che l'intelligenza artificiale cambierà la didattica?"},
            {"index": 12, "text": "Da una scala da 1 a 7, quanto pensi che l'intelligenza artificiale cambierà la tua didattica?"},
            {"index": 13, "text": "Su una scala da 1 a 7, quanto ritieni adeguata la formazione ricevuta in merito all'intelligenza artificiale?"},
            {"index": 14, "text": "Da una scala da 1 a 7, quanto sei fiducioso nell'integrazione dell'intelligenza artificiale nella pratica educativa?"},
            {"index": 15, "text": "Da una scala da 1 a 7, quanto sei fiducioso nell'utilizzo da parte degli studenti di un uso responsabile e maturo dell'intelligenza artificiale?"},
            {"index": 16, "text": "Da una scala da 1 a 7, quanto sei preoccupato riguardo all'utilizzo dell'intelligenza artificiale nel mondo dell'educazione?"},
            {"index": 17, "text": "Da una scala da 1 a 7, quanto sei preoccupato riguardo all'utilizzo dell'intelligenza artificiale da parte degli studenti?"},
            {"index": 18, "text": "Per quali tipi di attività NON deve essere utilizzata l'intelligenza artificiale nell'insegnamento?"},
            {"index": 19, "text": "Nella tua vita quotidiana utilizzi l'intelligenza artificiale?"},
            {"index": 20, "text": "Se sì, quante ore alla settimana, in media, utilizzi strumenti di intelligenza artificiale per le tue attività quotidiane?"},
            {"index": 21, "text": "Se no, puoi spiegare perché non la utilizzi?"},
            {"index": 22, "text": "Utilizzi l'intelligenza artificiale nella didattica?"},
            {"index": 23, "text": "Quante ore alla settimana mediamente dedichi alla formazione e all'aggiornamento sulle tecnologie di intelligenza artificiale per l'insegnamento?"},
            {"index": 24, "text": "Quante ore alla settimana dedichi mediamente per integrare strumenti di intelligenza artificiale nei tuoi piani di lezione settimanali?"},
            {"index": 25, "text": "Quali sono gli strumenti di intelligenza artificiale che utilizzi?"},
            {"index": 26, "text": "Per quali tipi di attività usi l'intelligenza artificiale?"},
            {"index": 27, "text": "Quali sono i tuoi strumenti preferiti e perché?"},
            {"index": 28, "text": "In che modo utilizzi l'intelligenza artificiale per individualizzare l'insegnamento?"},
            {"index": 29, "text": "In che modo utilizzi l'intelligenza artificiale per personalizzare l'insegnamento?"},
            {"index": 30, "text": "Puoi darci uno o più esempi di prompt che utilizzi?"},
            {"index": 31, "text": "Puoi fornire esempi specifici di come l'IA ha migliorato l'apprendimento dei tuoi studenti?"},
            {"index": 32, "text": "In che modo l'intelligenza artificiale ti aiuta a migliorare l'apprendimento dei tuoi studenti?"},
            {"index": 33, "text": "Quali difficoltà hai incontrato nell'implementazione di strumenti di IA nella tua didattica?"},
            {"index": 34, "text": "Puoi spiegare in maniera più dettagliata perché non utilizzi l'IA nella didattica?"},
            {"index": 35, "text": "In base alla tua esperienza, quali sono i pro e i contro dell'uso dell'intelligenza artificiale nell'educazione?"},
            {"index": 36, "text": "Secondo la tua esperienza, quali pratiche che utilizzano l'intelligenza artificiale NON sono raccomandate o NON dovrebbero essere usate nell'insegnamento?"},
            {"index": 37, "text": "Secondo te come è possibile migliorare questo questionario?"},
        ]
        
        processed = []
        for q in questions:
            question_type = QuestionClassifier.classify_question(q["text"])
            processed.append({
                "column_index": q["index"],
                "question_text": q["text"],
                "question_type": question_type,
                "respondent_type": "teacher",
                "category": QuestionClassifier.categorize_question(q["text"], q["index"]),
                "response_format": QuestionClassifier.determine_response_format(q["text"], question_type),
            })
        
        return processed
    
    @staticmethod
    def get_all_questions() -> List[Dict[str, Any]]:
        """Ottiene tutte le domande classificate da entrambi i questionari"""
        students = QuestionClassifier.extract_all_questions_students()
        teachers = QuestionClassifier.extract_all_questions_teachers()
        return students + teachers
