import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Icons } from './Icons'
import QuestionStats from './QuestionStats'
import RespondentView from './RespondentView'
import RespondentProfiles from './RespondentProfiles'
import AdvancedStats from './AdvancedStats'
import UsageAnalysis from './UsageAnalysis'
import CorrelationAnalysis from './CorrelationAnalysis'
import LikertAnalysis from './LikertAnalysis'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

// Colori per categorie di rispondenti
const RESPONDENT_COLORS = {
  student: '#3b82f6',
  teacher_active: '#10b981',
  teacher_training: '#f59e0b',
  teacher: '#64748b'
}

function Dashboard({ data, onRefresh }) {
  const [activeTab, setActiveTab] = useState('progetto')
  const [teacherFilter, setTeacherFilter] = useState('current')
  const [questionsData, setQuestionsData] = useState(null)
  const [questionFilter, setQuestionFilter] = useState({ type: 'all', respondent: 'all', category: 'all', format: 'all' })
  const [expandedQuestions, setExpandedQuestions] = useState(new Set())
  const [overviewStats, setOverviewStats] = useState(null)

  if (!data) return null

  const { students, teachers, comparison, tools } = data

  // Carica statistiche overview
  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/overview`)
        const result = await response.json()
        setOverviewStats(result)
        console.log('Overview stats:', result)
      } catch (error) {
        console.error('Errore nel caricamento overview:', error)
      }
    }
    
    loadOverviewStats()
  }, [])

  // Carica le domande quando si accede al tab
  useEffect(() => {
    const loadQuestions = async () => {
      if (activeTab === 'questions' && !questionsData) {
        try {
          const response = await fetch(`${API_URL}/api/questions`)
          const result = await response.json()
          setQuestionsData(result)
          console.log('Domande caricate:', result)
        } catch (error) {
          console.error('Errore nel caricamento delle domande:', error)
        }
      }
    }
    
    loadQuestions()
  }, [activeTab, questionsData])

  // Prepara dati per i grafici
  const competenceData = [
    {
      competenza: 'Pratica',
      Studenti: students.competenze?.practical?.mean || 0,
      Insegnanti: teachers.competenze?.practical?.mean || 0
    },
    {
      competenza: 'Teorica',
      Studenti: students.competenze?.theoretical?.mean || 0,
      Insegnanti: teachers.competenze?.theoretical?.mean || 0
    }
  ]

  const trustData = [
    {
      aspect: 'Fiducia integrazione',
      Studenti: students.impatto_fiducia?.trust_integration?.mean || 0,
      Insegnanti: teachers.fiducia?.trust_integration?.mean || 0
    },
    {
      aspect: 'Formazione adeguata',
      Studenti: students.impatto_fiducia?.training_adequacy?.mean || 0,
      Insegnanti: teachers.impatto?.training_adequacy?.mean || 0
    }
  ]

  const usageData = [
    { categoria: 'Studenti', 'Usa quotidianamente': students.utilizzo?.uses_ai_daily_percentage || 0, 'Non usa': 100 - (students.utilizzo?.uses_ai_daily_percentage || 0) },
    { categoria: 'Insegnanti', 'Usa quotidianamente': teachers.utilizzo?.uses_ai_daily_percentage || 0, 'Non usa': 100 - (teachers.utilizzo?.uses_ai_daily_percentage || 0) }
  ]

  const hoursData = [
    {
      tipo: 'Ore quotidiane',
      Studenti: students.utilizzo?.hours_daily_avg || 0,
      Insegnanti: teachers.utilizzo?.hours_daily_avg || 0
    },
    {
      tipo: 'Ore studio/didattica',
      Studenti: students.utilizzo?.hours_study_avg || 0,
      Insegnanti: teachers.utilizzo?.hours_training_avg || 0
    }
  ]

  // Top tools
  const studentToolsArray = Object.entries(tools.student_tools || {}).slice(0, 5).map(([name, count]) => ({ name, count }))
  const teacherToolsArray = Object.entries(tools.teacher_tools || {}).slice(0, 5).map(([name, count]) => ({ name, count }))

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>
          <Icons.Chart className="w-8 h-8" />
          Analisi Questionari AI - CNR
        </h1>
        <div className="header-stats">
          <div className="stat-card students">
            <span className="stat-label">Studenti</span>
            <span className="stat-value">{overviewStats?.students || 0}</span>
          </div>
          <div className="stat-card teachers">
            <span className="stat-label">Insegnanti</span>
            <span className="stat-value">{overviewStats?.active_teachers || 0}</span>
          </div>
          <div className="stat-card training">
            <span className="stat-label">Insegnanti in Formazione</span>
            <span className="stat-value">{overviewStats?.training_teachers || 0}</span>
          </div>
          <button className="refresh-btn" onClick={onRefresh}>
            <Icons.Refresh className="w-5 h-5" />
            Aggiorna
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button className={activeTab === 'progetto' ? 'active' : ''} onClick={() => setActiveTab('progetto')}>
          <Icons.Chart className="w-5 h-5" />
          Progetto
        </button>
        <button className={activeTab === 'profiles' ? 'active' : ''} onClick={() => setActiveTab('profiles')}>
          <Icons.Users className="w-5 h-5" />
          Profili
        </button>
        <button className={activeTab === 'questions' ? 'active' : ''} onClick={() => setActiveTab('questions')}>
          <Icons.Question className="w-5 h-5" />
          Domande
        </button>
        <button className={activeTab === 'respondents' ? 'active' : ''} onClick={() => setActiveTab('respondents')}>
          <Icons.Search className="w-5 h-5" />
          Rispondenti
        </button>
        <button className={activeTab === 'likert' ? 'active' : ''} onClick={() => setActiveTab('likert')}>
          <Icons.Stats className="w-5 h-5" />
          Likert
        </button>
        <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>
          <Icons.Clock className="w-5 h-5" />
          Utilizzo
        </button>
        <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>
          <Icons.Tools className="w-5 h-5" />
          Strumenti
        </button>
        <button className={activeTab === 'advanced' ? 'active' : ''} onClick={() => setActiveTab('advanced')}>
          <Icons.Chart className="w-5 h-5" />
          Analisi Avanzata
        </button>
        <button className={activeTab === 'correlations' ? 'active' : ''} onClick={() => setActiveTab('correlations')}>
          <Icons.TrendingUp className="w-5 h-5" />
          Correlazioni
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'progetto' && (
          <div className="project-overview" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1e293b' }}>
              Progetto di Ricerca sull'Intelligenza Artificiale nell'Educazione
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
              Questa piattaforma presenta i risultati di un'indagine approfondita sull'utilizzo e la percezione
              dell'intelligenza artificiale nel contesto educativo italiano.
            </p>

            <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#334155' }}>
              Obiettivi della Ricerca
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: '#475569', marginBottom: '1rem' }}>
              La presente ricerca esplora in modo approfondito e multidimensionale il rapporto tra intelligenza artificiale ed educazione 
              nel contesto italiano, analizzando sia gli aspetti pratici che quelli percettivi dell'integrazione dell'IA nelle scuole 
              e università. L'obiettivo è comprendere non solo le dinamiche attuali, ma anche le prospettive future dell'educazione digitale.
            </p>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#475569' }}>
              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Student className="w-6 h-6" style={{ color: '#1e40af', flexShrink: 0 }} />
                  <strong style={{ color: '#1e40af', fontSize: '1.05rem' }}>Competenze e Conoscenze</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  La ricerca valuta il livello di preparazione e familiarità di studenti e insegnanti con gli strumenti di intelligenza artificiale. 
                  L'analisi si concentra sul grado di competenza percepito, sulle competenze specifiche possedute e sull'identificazione delle 
                  principali lacune formative, con l'obiettivo di individuare le aree di eccellenza e quelle che necessitano di maggiore supporto 
                  istituzionale e formativo.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.TrendingUp className="w-6 h-6" style={{ color: '#065f46', flexShrink: 0 }} />
                  <strong style={{ color: '#065f46', fontSize: '1.05rem' }}>Impatto e Cambiamento</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  Lo studio analizza le trasformazioni già in atto e quelle previste nei metodi di insegnamento e apprendimento. L'indagine 
                  esamina come l'intelligenza artificiale stia modificando le dinamiche della classe, ridefinendo il ruolo dell'insegnante 
                  e quello dello studente, e quali cambiamenti strutturali stia determinando nel panorama educativo italiano contemporaneo.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Teacher className="w-6 h-6" style={{ color: '#92400e', flexShrink: 0 }} />
                  <strong style={{ color: '#92400e', fontSize: '1.05rem' }}>Formazione e Preparazione</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  La ricerca esamina le esigenze formative specifiche e le strategie di sviluppo professionale necessarie per un'integrazione 
                  efficace dell'IA nella didattica. Vengono indagati i percorsi formativi più efficaci, le modalità di preparazione degli 
                  insegnanti attuali e futuri, e le competenze richieste per operare efficacemente come educatori nell'era dell'intelligenza 
                  artificiale.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Users className="w-6 h-6" style={{ color: '#5b21b6', flexShrink: 0 }} />
                  <strong style={{ color: '#5b21b6', fontSize: '1.05rem' }}>Fiducia e Atteggiamenti</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  Lo studio esplora le percezioni, le aspettative e le disposizioni emotive verso l'IA nel contesto educativo. Vengono analizzati 
                  i livelli di fiducia verso questi strumenti, le speranze e le resistenze espresse, e l'evoluzione degli atteggiamenti in 
                  relazione alla crescente presenza dell'IA nelle istituzioni scolastiche. La comprensione di questi aspetti risulta fondamentale 
                  per un'adozione consapevole e sostenibile delle tecnologie.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Warning className="w-6 h-6" style={{ color: '#991b1b', flexShrink: 0 }} />
                  <strong style={{ color: '#991b1b', fontSize: '1.05rem' }}>Preoccupazioni e Rischi</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  La ricerca identifica le criticità percepite e i potenziali rischi legati all'uso dell'IA in ambito educativo: dalle questioni 
                  etiche ai problemi di privacy, dall'equità nell'accesso agli strumenti all'affidabilità delle tecnologie, fino alle 
                  preoccupazioni relative alla dipendenza tecnologica e alla possibile sostituzione del ruolo umano nei processi di insegnamento 
                  e apprendimento.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #06b6d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Chart className="w-6 h-6" style={{ color: '#0e7490', flexShrink: 0 }} />
                  <strong style={{ color: '#0e7490', fontSize: '1.05rem' }}>Utilizzo e Frequenza</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  Lo studio mappa i pattern d'uso concreti dell'intelligenza artificiale nelle istituzioni educative: quali strumenti vengono 
                  effettivamente utilizzati nelle classi, con quale frequenza, in quali contesti educativi specifici e per quali finalità 
                  didattiche. Questa dimensione analitica permette di distinguere tra le promesse teoriche e la realtà effettiva dell'adozione 
                  dell'IA nel sistema educativo italiano.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #ec4899' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.Tools className="w-6 h-6" style={{ color: '#9f1239', flexShrink: 0 }} />
                  <strong style={{ color: '#9f1239', fontSize: '1.05rem' }}>Strumenti</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  La ricerca analizza gli strumenti di IA specifici utilizzati nel contesto educativo italiano: dalle piattaforme di apprendimento 
                  adattivo agli assistenti virtuali, dai sistemi di valutazione automatizzata ai generatori di contenuti didattici. Vengono 
                  esaminate le tecnologie più diffuse, quelle percepite come più utili e quelle che stanno realmente determinando un impatto 
                  significativo sui processi educativi.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                  <Icons.AlertCircle className="w-6 h-6" style={{ color: '#334155', flexShrink: 0 }} />
                  <strong style={{ color: '#334155', fontSize: '1.05rem' }}>Sfide</strong>
                </div>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  Lo studio esplora gli ostacoli pratici e strutturali che limitano l'adozione dell'IA nelle istituzioni educative: dalle barriere 
                  tecnologiche (infrastrutture inadeguate, carenza di dispositivi) a quelle organizzative (resistenza al cambiamento, vincoli 
                  temporali), fino alle sfide di natura culturale (scetticismo diffuso, assenza di visione strategica). L'identificazione di 
                  queste sfide risulta essenziale per la formulazione di strategie di superamento efficaci.
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#334155' }}>
              Partecipanti
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#475569' }}>
              Il questionario ha coinvolto:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0 2rem 0' }}>
              <div style={{ padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {overviewStats?.students || 272}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>Studenti</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46' }}>
                  {overviewStats?.active_teachers || 358}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#065f46' }}>Insegnanti attivi</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
                  {overviewStats?.training_teachers || 99}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#92400e' }}>In formazione</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginTop: '2rem', marginBottom: '0.8rem', color: '#334155' }}>
              Navigazione della Piattaforma
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#475569' }}>
              Utilizza i tab in alto per esplorare:
            </p>
            <ol style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#475569', paddingLeft: '1.5rem' }}>
              <li><strong>Profili</strong> - Statistiche demografiche aggregate dei rispondenti</li>
              <li><strong>Domande</strong> - Analisi dettagliata di ogni domanda con grafici interattivi</li>
              <li><strong>Rispondenti</strong> - Ricerca e visualizzazione delle risposte individuali</li>
              <li><strong>Analisi Avanzata</strong> - Analisi statistiche inferenziali, correlazioni e regressioni</li>
            </ol>
          </div>
        )}

        {activeTab === 'profiles' && <RespondentProfiles />}

        {activeTab === 'respondents' && <RespondentView />}

        {activeTab === 'likert' && <LikertAnalysis />}

        {activeTab === 'usage' && <UsageAnalysis />}

        {activeTab === 'advanced' && <AdvancedStats />}

        {activeTab === 'correlations' && <CorrelationAnalysis />}

        {activeTab === 'questions' && questionsData && (
          <div className="questions-tab">
            <section className="questions-header">
              <h2>Tutte le Domande del Questionario</h2>
              <div className="questions-stats">
                <div className="stat-badge">
                  <span className="badge-label">Totale</span>
                  <span className="badge-value">{questionsData.statistics.total_questions}</span>
                </div>
                <div className="stat-badge open">
                  <span className="badge-label">Aperte</span>
                  <span className="badge-value">{questionsData.statistics.open_questions}</span>
                </div>
                <div className="stat-badge closed">
                  <span className="badge-label">Chiuse</span>
                  <span className="badge-value">{questionsData.statistics.closed_questions}</span>
                </div>
              </div>
            </section>

            <section className="questions-filters">
              <div className="filter-group">
                <label>Tipo rispondente:</label>
                <select value={questionFilter.respondent} onChange={(e) => setQuestionFilter({...questionFilter, respondent: e.target.value})}>
                  <option value="all">Tutti</option>
                  <option value="student">Studenti</option>
                  <option value="teacher">Insegnanti Totali</option>
                  <option value="teacher_active">Insegnanti</option>
                  <option value="teacher_training">Insegnanti in Formazione</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Tipo domanda:</label>
                <select value={questionFilter.type} onChange={(e) => setQuestionFilter({...questionFilter, type: e.target.value})}>
                  <option value="all">Tutte</option>
                  <option value="open">Aperte</option>
                  <option value="closed">Chiuse</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Formato risposta:</label>
                <select value={questionFilter.format} onChange={(e) => setQuestionFilter({...questionFilter, format: e.target.value})}>
                  <option value="all">Tutti i formati</option>
                  <option value="scale_1_7">Scala Likert (1-7)</option>
                  <option value="yes_no">Sì/No</option>
                  <option value="single_choice">Scelta singola</option>
                  <option value="multiple_choice">Scelta multipla</option>
                  <option value="numeric">Numerica</option>
                  <option value="text">Testo aperto</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Categoria:</label>
                <select value={questionFilter.category} onChange={(e) => setQuestionFilter({...questionFilter, category: e.target.value})}>
                  <option value="all">Tutte</option>
                  {Object.keys(questionsData.statistics.categories).map(cat => {
                    const categoryLabels = {
                      'administrative': 'Amministrativa',
                      'demographic': 'Demografica',
                      'competence': 'Competenze',
                      'trust': 'Fiducia',
                      'concern': 'Preoccupazioni',
                      'training': 'Formazione',
                      'usage': 'Utilizzo',
                      'tools': 'Strumenti',
                      'personalization': 'Personalizzazione',
                      'impact': 'Impatto',
                      'challenges': 'Sfide',
                      'open_reflection': 'Riflessioni',
                      'other': 'Altro'
                    }
                    return <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                  })}
                </select>
              </div>
            </section>

            <section className="questions-categories">
              <h3>Domande per Categoria</h3>
              <div className="category-grid">
                {Object.entries(questionsData.statistics.categories).map(([category, stats]) => {
                  const categoryLabels = {
                    'administrative': 'Amministrativa',
                    'demographic': 'Demografica',
                    'competence': 'Competenze',
                    'trust': 'Fiducia',
                    'concern': 'Preoccupazioni',
                    'training': 'Formazione',
                    'usage': 'Utilizzo',
                    'tools': 'Strumenti',
                    'personalization': 'Personalizzazione',
                    'impact': 'Impatto',
                    'challenges': 'Sfide',
                    'open_reflection': 'Riflessioni',
                    'other': 'Altro'
                  }
                  return (
                    <div key={category} className="category-card">
                      <h4>{categoryLabels[category] || category}</h4>
                      <div className="category-stats">
                        <span className="total">Totale: {stats.total}</span>
                        <span className="open">Aperte: {stats.open}</span>
                        <span className="closed">Chiuse: {stats.closed}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="questions-list">
              <h3>Elenco Domande</h3>
              {questionsData.questions
                .filter(q => {
                  // Filtro per tipo rispondente
                  let respondentMatch = true
                  if (questionFilter.respondent === 'student') {
                    respondentMatch = q.respondent_type === 'student'
                  } else if (questionFilter.respondent === 'teacher' || questionFilter.respondent === 'teacher_active' || questionFilter.respondent === 'teacher_training') {
                    respondentMatch = q.respondent_type === 'teacher'
                  }
                  
                  return respondentMatch &&
                    (questionFilter.type === 'all' || q.question_type === questionFilter.type) &&
                    (questionFilter.category === 'all' || q.category === questionFilter.category) &&
                    (questionFilter.format === 'all' || q.response_format === questionFilter.format)
                })
                .map((q, idx) => {
                  const questionId = `${q.respondent_type}-${q.column_index}`
                  const isExpanded = expandedQuestions.has(questionId)
                  const hasStats = q.response_format !== 'text'
                  
                  // Determina etichetta e colore per rispondente
                  let respondentLabel = 'Studenti'
                  let respondentColor = RESPONDENT_COLORS.student
                  let RespondentIcon = Icons.Student
                  
                  if (q.respondent_type === 'teacher') {
                    RespondentIcon = Icons.Teacher
                    if (questionFilter.respondent === 'teacher_active') {
                      respondentLabel = 'Insegnanti Attivi'
                      respondentColor = RESPONDENT_COLORS.teacher_active
                    } else if (questionFilter.respondent === 'teacher_training') {
                      respondentLabel = 'Insegnanti in Formazione'
                      respondentColor = RESPONDENT_COLORS.teacher_training
                    } else if (questionFilter.respondent === 'teacher') {
                      respondentLabel = 'Insegnanti Totali'
                      respondentColor = RESPONDENT_COLORS.teacher
                    } else {
                      // Se il filtro è "all", mostra solo "Insegnanti"
                      respondentLabel = 'Insegnanti'
                      respondentColor = RESPONDENT_COLORS.teacher
                    }
                  }
                  
                  return (
                    <div key={questionId} className={`question-card ${q.question_type}`}>
                      <div className="question-header">
                        <span className={`question-badge ${q.question_type}`}>
                          {q.question_type === 'open' ? (
                            <>
                              <Icons.OpenQuestion className="w-4 h-4 inline" />
                              {' '}Aperta
                            </>
                          ) : (
                            <>
                              <Icons.ClosedQuestion className="w-4 h-4 inline" />
                              {' '}Chiusa
                            </>
                          )}
                        </span>
                        <span 
                          className="question-respondent" 
                          style={{ 
                            backgroundColor: respondentColor + '20', 
                            color: respondentColor,
                            border: `1px solid ${respondentColor}`
                          }}
                        >
                          <RespondentIcon className="w-4 h-4 inline" />
                          {' '}{respondentLabel}
                        </span>
                        <span className="question-category">
                          <Icons.Category className="w-3 h-3 inline" />
                          {' '}{(() => {
                            const categoryLabels = {
                              'administrative': 'Amministrativa',
                              'demographic': 'Demografica',
                              'competence': 'Competenze',
                              'trust': 'Fiducia',
                              'concern': 'Preoccupazioni',
                              'training': 'Formazione',
                              'usage': 'Utilizzo',
                              'tools': 'Strumenti',
                              'personalization': 'Personalizzazione',
                              'impact': 'Impatto',
                              'challenges': 'Sfide',
                              'open_reflection': 'Riflessioni',
                              'other': 'Altro'
                            }
                            return categoryLabels[q.category] || q.category
                          })()}
                        </span>
                        <span className="question-format">{(() => {
                          const formatLabels = {
                            'scale_1_7': 'Scala 1-7',
                            'yes_no': 'Sì/No',
                            'single_choice': 'Scelta singola',
                            'multiple_choice': 'Scelta multipla',
                            'numeric': 'Numerica',
                            'text': 'Testo aperto'
                          }
                          return formatLabels[q.response_format] || q.response_format
                        })()}</span>
                      </div>
                      <div className="question-text">
                        <strong>#{q.column_index + 1}:</strong> {q.question_text}
                      </div>
                      
                      {hasStats && (
                        <div className="question-card-toggle">
                          <button 
                            className={`toggle-stats-btn ${isExpanded ? 'open' : ''}`}
                            onClick={() => {
                              const newExpanded = new Set(expandedQuestions)
                              if (isExpanded) {
                                newExpanded.delete(questionId)
                              } else {
                                newExpanded.add(questionId)
                              }
                              setExpandedQuestions(newExpanded)
                            }}
                          >
                            <Icons.Chart className="w-4 h-4" />
                            {isExpanded ? 'Nascondi statistiche' : 'Mostra statistiche e grafici'}
                          </button>
                        </div>
                      )}
                      
                      {hasStats && isExpanded && (
                        <QuestionStats 
                          question={q} 
                          teacherFilter={questionFilter.respondent}
                        />
                      )}
                    </div>
                  )
                })}
            </section>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="tools-tab">
            <section className="chart-section">
              <h2>Top 5 Strumenti AI - Studenti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentToolsArray} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Top 5 Strumenti AI - Insegnanti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teacherToolsArray} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
