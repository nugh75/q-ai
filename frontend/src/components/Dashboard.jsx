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
import DocumentLayout, { Section } from './DocumentLayout'
import ToolWordCloud from './ToolWordCloud'
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
  const [toolsDistribution, setToolsDistribution] = useState(null)
  const [selectedToolGroup, setSelectedToolGroup] = useState('students')

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

  // Carica distribuzione strumenti quando si accede al tab tools
  useEffect(() => {
    const loadToolsDistribution = async () => {
      if (activeTab === 'tools' && !toolsDistribution) {
        try {
          const response = await fetch(`${API_URL}/api/tools-usage-distribution`)
          const result = await response.json()
          setToolsDistribution(result)
          console.log('Distribuzione strumenti caricata:', result)
        } catch (error) {
          console.error('Errore nel caricamento distribuzione strumenti:', error)
        }
      }
    }

    loadToolsDistribution()
  }, [activeTab, toolsDistribution])

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
  const teacherToolsActive = tools.teacher_tools_active || {}
  const teacherToolsTraining = tools.teacher_tools_training || {}

  const topStudentTools = Object.entries(tools.student_tools || {})
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topTeacherAll = Object.entries(tools.teacher_tools || {})
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topTeacherActive = Object.entries(teacherToolsActive)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const topTeacherTraining = Object.entries(teacherToolsTraining)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  const wordCloudStudents = Object.entries(tools.student_tools || {})
    .slice(0, 60)
    .map(([name, count]) => ({ name, count }))

  const wordCloudTeachersActive = Object.entries(teacherToolsActive)
    .slice(0, 60)
    .map(([name, count]) => ({ name, count }))

  const wordCloudTeachersTraining = Object.entries(teacherToolsTraining)
    .slice(0, 60)
    .map(([name, count]) => ({ name, count }))

  const getChartHeight = data => Math.max(300, (data?.length || 0) * 32 || 300)

  const toolDetailGroups = [
    { key: 'students', label: 'Studenti', color: RESPONDENT_COLORS.student },
    { key: 'teachers_active', label: 'Docenti in Servizio', color: RESPONDENT_COLORS.teacher_active },
    { key: 'teachers_training', label: 'Docenti Non in Servizio', color: RESPONDENT_COLORS.teacher_training }
  ]

  const distributionCategories = ['1', '2', '3', '4', '5+']

  const toolsChartData = distributionCategories.map(cat => {
    const label = cat === '1' ? '1 strumento' : cat === '5+' ? '5 o più' : `${cat} strumenti`
    return {
      category: label,
      Studenti: toolsDistribution?.students?.[cat] || 0,
      'Docenti Servizio': toolsDistribution?.teachers_active?.[cat] || 0,
      'Docenti Non Servizio': toolsDistribution?.teachers_training?.[cat] || 0
    }
  })

  const statsByGroup = {
    students: toolsDistribution?.stats?.students,
    teachers_active: toolsDistribution?.stats?.teachers_active,
    teachers_training: toolsDistribution?.stats?.teachers_training
  }

  const exclusionNotes = toolDetailGroups
    .map(group => ({
      key: group.key,
      label: group.label,
      color: group.color,
      stats: statsByGroup[group.key]
    }))
    .filter(item => item.stats?.excluded_zero)

  const calculateMedian = values => {
    if (!values.length) return 0
    const mid = Math.floor(values.length / 2)
    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2
    }
    return values[mid]
  }

  const calculateQuartiles = values => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const median = calculateMedian(sorted)
    const midIndex = Math.floor(sorted.length / 2)
    const lowerHalf = sorted.slice(0, midIndex)
    const upperHalf = sorted.length % 2 === 0
      ? sorted.slice(midIndex)
      : sorted.slice(midIndex + 1)

    const q1 = lowerHalf.length ? calculateMedian(lowerHalf) : median
    const q3 = upperHalf.length ? calculateMedian(upperHalf) : median
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length

    return {
      min: sorted[0],
      q1,
      median,
      q3,
      max: sorted[sorted.length - 1],
      mean: Number(mean.toFixed(2))
    }
  }

  const boxPlotData = toolDetailGroups
    .map(group => {
      const values = (toolsDistribution?.details?.[group.key] || []).map(detail => detail.tool_count)
      const stats = calculateQuartiles(values)
      return stats
        ? {
          key: group.key,
          label: group.label,
          color: group.color,
          stats,
          count: values.length
        }
        : null
    })
    .filter(Boolean)

  const maxBoxValue = boxPlotData.length
    ? Math.max(...boxPlotData.map(item => item.stats.max))
    : 0

  const axisMax = Math.max(1, Math.ceil((maxBoxValue || 1) * 1.1))
  const axisTicks = Array.from({ length: axisMax + 1 }, (_, i) => i)

  const BOX_PLOT_SCALE = 2
  const scaleCoord = value => value * BOX_PLOT_SCALE
  const boxPlotViewWidth = scaleCoord(620)
  const boxPlotViewHeight = scaleCoord(300)
  const boxPlotSvgHeight = scaleCoord(260)

  const chartFrame = {
    backgroundX: scaleCoord(70),
    backgroundY: scaleCoord(20),
    backgroundWidth: scaleCoord(500),
    backgroundHeight: scaleCoord(220),
    axisLeft: scaleCoord(90),
    axisRight: scaleCoord(560),
    axisTop: scaleCoord(40),
    axisBottom: scaleCoord(240),
    tickGuideLeft: scaleCoord(85),
    tickLabelX: scaleCoord(75),
    axisLabelX: scaleCoord(20),
    axisLabelY: scaleCoord(150),
    categoryLabelY: scaleCoord(260),
    countLabelY: scaleCoord(275)
  }

  const chartWidth = chartFrame.axisRight - chartFrame.axisLeft
  const chartHeight = chartFrame.axisBottom - chartFrame.axisTop
  const tickLabelOffset = scaleCoord(5)

  const selectedToolDetails = (toolsDistribution?.details?.[selectedToolGroup] || [])
    .slice()
    .sort((a, b) => b.tool_count - a.tool_count)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>
          <Icons.Chart className="w-8 h-8" />
          Analisi Questionari AI - CNR
        </h1>
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
          <DocumentLayout
            title="Progetto di ricerca sull'intelligenza artificiale nell'educazione"
            subtitle="Questa piattaforma presenta i risultati di un'indagine approfondita sull'utilizzo e la percezione dell'intelligenza artificiale nel contesto educativo italiano."
          >
            <Section id="obiettivi" title="Obiettivi della ricerca">
              <p>
                La presente ricerca esplora in modo approfondito e multidimensionale il rapporto tra intelligenza artificiale ed educazione
                nel contesto italiano, analizzando sia gli aspetti pratici che quelli percettivi dell'integrazione dell'IA nelle scuole
                e università. L'obiettivo è comprendere non solo le dinamiche attuali, ma anche le prospettive future dell'educazione digitale.
              </p>
            </Section>

            <Section id="competenze" title="Competenze e conoscenze" icon={Icons.Student}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #3b82f6' }}>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  La ricerca valuta il livello di preparazione e familiarità di studenti e insegnanti con gli strumenti di intelligenza artificiale. 
                  L'analisi si concentra sul grado di competenza percepito, sulle competenze specifiche possedute e sull'identificazione delle 
                  principali lacune formative, con l'obiettivo di individuare le aree di eccellenza e quelle che necessitano di maggiore supporto 
                  istituzionale e formativo.
                </p>
              </div>
            </Section>

            <Section id="impatto" title="Impatto e cambiamento" icon={Icons.TrendingUp}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #10b981' }}>
                <p style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                  Lo studio analizza le trasformazioni già in atto e quelle previste nei metodi di insegnamento e apprendimento. L'indagine 
                  esamina come l'intelligenza artificiale stia modificando le dinamiche della classe, ridefinendo il ruolo dell'insegnante 
                  e quello dello studente, e quali cambiamenti strutturali stia determinando nel panorama educativo italiano contemporaneo.
                </p>
              </div>
            </Section>

            <Section id="formazione" title="Formazione e preparazione" icon={Icons.Teacher}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #f59e0b' }}>
                <p>
                  La ricerca esamina le esigenze formative specifiche e le strategie di sviluppo professionale necessarie per un'integrazione
                  efficace dell'IA nella didattica. Vengono indagati i percorsi formativi più efficaci, le modalità di preparazione degli
                  insegnanti attuali e futuri, e le competenze richieste per operare efficacemente come educatori nell'era dell'intelligenza
                  artificiale.
                </p>
              </div>
            </Section>

            <Section id="fiducia" title="Fiducia e atteggiamenti" icon={Icons.Users}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #8b5cf6' }}>
                <p>
                  Lo studio esplora le percezioni, le aspettative e le disposizioni emotive verso l'IA nel contesto educativo. Vengono analizzati
                  i livelli di fiducia verso questi strumenti, le speranze e le resistenze espresse, e l'evoluzione degli atteggiamenti in
                  relazione alla crescente presenza dell'IA nelle istituzioni scolastiche. La comprensione di questi aspetti risulta fondamentale
                  per un'adozione consapevole e sostenibile delle tecnologie.
                </p>
              </div>
            </Section>

            <Section id="preoccupazioni" title="Preoccupazioni e rischi" icon={Icons.Warning}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #ef4444' }}>
                <p>
                  La ricerca identifica le criticità percepite e i potenziali rischi legati all'uso dell'IA in ambito educativo: dalle questioni
                  etiche ai problemi di privacy, dall'equità nell'accesso agli strumenti all'affidabilità delle tecnologie, fino alle
                  preoccupazioni relative alla dipendenza tecnologica e alla possibile sostituzione del ruolo umano nei processi di insegnamento
                  e apprendimento.
                </p>
              </div>
            </Section>

            <Section id="utilizzo" title="Utilizzo e frequenza" icon={Icons.Chart}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #06b6d4' }}>
                <p>
                  Lo studio mappa i pattern d'uso concreti dell'intelligenza artificiale nelle istituzioni educative: quali strumenti vengono
                  effettivamente utilizzati nelle classi, con quale frequenza, in quali contesti educativi specifici e per quali finalità
                  didattiche. Questa dimensione analitica permette di distinguere tra le promesse teoriche e la realtà effettiva dell'adozione
                  dell'IA nel sistema educativo italiano.
                </p>
              </div>
            </Section>

            <Section id="strumenti" title="Strumenti" icon={Icons.Tools}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #ec4899' }}>
                <p>
                  La ricerca analizza gli strumenti di IA specifici utilizzati nel contesto educativo italiano: dalle piattaforme di apprendimento
                  adattivo agli assistenti virtuali, dai sistemi di valutazione automatizzata ai generatori di contenuti didattici. Vengono
                  esaminate le tecnologie più diffuse, quelle percepite come più utili e quelle che stanno realmente determinando un impatto
                  significativo sui processi educativi.
                </p>
              </div>
            </Section>

            <Section id="sfide" title="Sfide" icon={Icons.AlertCircle}>
              <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #64748b' }}>
                <p>
                  Lo studio esplora gli ostacoli pratici e strutturali che limitano l'adozione dell'IA nelle istituzioni educative: dalle barriere
                  tecnologiche (infrastrutture inadeguate, carenza di dispositivi) a quelle organizzative (resistenza al cambiamento, vincoli
                  temporali), fino alle sfide di natura culturale (scetticismo diffuso, assenza di visione strategica). L'identificazione di
                  queste sfide risulta essenziale per la formulazione di strategie di superamento efficaci.
                </p>
              </div>
            </Section>

            <Section id="partecipanti" title="Partecipanti" icon={Icons.Users}>
              <p>Il questionario ha coinvolto:</p>
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
                  <div style={{ fontSize: '0.9rem', color: '#065f46' }}>Insegnanti in servizio</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
                    {overviewStats?.training_teachers || 99}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#92400e' }}>In formazione</div>
                </div>
              </div>
            </Section>

            <Section id="navigazione" title="Navigazione della piattaforma" icon={Icons.Menu}>
              <p>Utilizza i tab in alto per esplorare:</p>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li><strong>Profili</strong> - Statistiche demografiche aggregate dei rispondenti</li>
                <li><strong>Domande</strong> - Analisi dettagliata di ogni domanda con grafici interattivi</li>
                <li><strong>Rispondenti</strong> - Ricerca e visualizzazione delle risposte individuali</li>
                <li><strong>Analisi avanzata</strong> - Analisi statistiche inferenziali, correlazioni e regressioni</li>
              </ol>
            </Section>
          </DocumentLayout>
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
              <h2>Tutte le domande del questionario</h2>
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
                  <option value="teacher">Insegnanti totali</option>
                  <option value="teacher_active">Insegnanti in servizio</option>
                  <option value="teacher_training">Insegnanti in formazione</option>
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
              <h3>Domande per categoria</h3>
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
              <h3>Elenco domande</h3>
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
                      respondentLabel = 'Insegnanti in servizio'
                      respondentColor = RESPONDENT_COLORS.teacher_active
                    } else if (questionFilter.respondent === 'teacher_training') {
                      respondentLabel = 'Insegnanti in formazione'
                      respondentColor = RESPONDENT_COLORS.teacher_training
                    } else if (questionFilter.respondent === 'teacher') {
                      respondentLabel = 'Insegnanti totali'
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
            {/* Header */}
            <section className="chart-section">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.Tools className="w-6 h-6" style={{ color: '#3b82f6' }} />
                Strumenti AI Utilizzati
              </h2>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>
                Analisi dettagliata degli strumenti di intelligenza artificiale utilizzati dalle tre categorie di rispondenti
              </p>
            </section>

            {/* Top strumenti affiancati per categoria */}
            {boxPlotData.length > 0 && (
              <section className="chart-section" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>Distribuzione strumenti (Box Plot)</h3>
                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${boxPlotViewWidth} ${boxPlotViewHeight}`} width="100%" height={boxPlotSvgHeight}>
                      <defs>
                        <linearGradient id="boxplot-bg" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.25" />
                        </linearGradient>
                      </defs>
                      <rect
                        x={chartFrame.backgroundX}
                        y={chartFrame.backgroundY}
                        width={chartFrame.backgroundWidth}
                        height={chartFrame.backgroundHeight}
                        fill="url(#boxplot-bg)"
                        rx="12"
                      />

                      {/* Assi e griglia */}
                      <line x1={chartFrame.axisLeft} y1={chartFrame.axisTop} x2={chartFrame.axisLeft} y2={chartFrame.axisBottom} stroke="#94a3b8" strokeWidth="2.5" />
                      <line x1={chartFrame.axisLeft} y1={chartFrame.axisBottom} x2={chartFrame.axisRight} y2={chartFrame.axisBottom} stroke="#94a3b8" strokeWidth="2.5" />
                      {axisTicks.map(tick => {
                        const position = chartFrame.axisBottom - (tick / axisMax) * chartHeight
                        return (
                          <g key={tick}>
                            <line
                              x1={chartFrame.tickGuideLeft}
                              y1={position}
                              x2={chartFrame.axisRight}
                              y2={position}
                              stroke="#cbd5f5"
                              strokeWidth={tick === 0 ? 2.5 : 1.5}
                              strokeDasharray={tick === 0 ? 'none' : '8 8'}
                            />
                            <text x={chartFrame.tickLabelX} y={position + tickLabelOffset} fontSize="14" fill="#475569" textAnchor="end">{tick}</text>
                          </g>
                        )
                      })}

                      <text
                        x={chartFrame.axisLabelX}
                        y={chartFrame.axisLabelY}
                        fontSize="14"
                        fill="#475569"
                        transform={`rotate(-90 ${chartFrame.axisLabelX} ${chartFrame.axisLabelY})`}
                        textAnchor="middle"
                      >
                        Numero di strumenti distinti
                      </text>

                      {boxPlotData.map((item, idx) => {
                        const segments = Math.max(boxPlotData.length, 1)
                        const xSpacing = chartWidth / segments
                        const xCenter = chartFrame.axisLeft + xSpacing * (idx + 0.5)
                        const maxBoxWidth = scaleCoord(70)
                        const boxWidth = Math.min(maxBoxWidth, chartWidth / (boxPlotData.length * 1.8))
                        const valueToY = value => chartFrame.axisBottom - (value / axisMax) * chartHeight

                        const min = valueToY(item.stats.min)
                        const q1 = valueToY(item.stats.q1)
                        const median = valueToY(item.stats.median)
                        const q3 = valueToY(item.stats.q3)
                        const max = valueToY(item.stats.max)
                        const mean = valueToY(item.stats.mean)

                        return (
                          <g key={item.key}>
                            {/* Griglia verticale leggera */}
                            <line x1={xCenter} y1={chartFrame.axisTop} x2={xCenter} y2={chartFrame.axisBottom} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6 8" />

                            {/* Whisker inferiore */}
                            <line x1={xCenter} y1={min} x2={xCenter} y2={q1} stroke={item.color} strokeWidth="3.5" />

                            {/* Whisker superiore */}
                            <line x1={xCenter} y1={q3} x2={xCenter} y2={max} stroke={item.color} strokeWidth="3.5" />

                            {/* Box IQR */}
                            <rect
                              x={xCenter - boxWidth / 2}
                              y={q3}
                              width={boxWidth}
                              height={q1 - q3}
                              fill={`${item.color}33`}
                              stroke={item.color}
                              strokeWidth="3.5"
                              rx="8"
                            />

                            {/* Mediana */}
                            <line
                              x1={xCenter - boxWidth / 2}
                              y1={median}
                              x2={xCenter + boxWidth / 2}
                              y2={median}
                              stroke={item.color}
                              strokeWidth="5"
                              strokeDasharray="12 8"
                            />

                            {/* Media */}
                            <circle cx={xCenter} cy={mean} r={scaleCoord(3)} fill="#ef4444" stroke="#ffffff" strokeWidth="2" />

                            {/* Cap min/max */}
                            <line x1={xCenter - boxWidth / 3} y1={min} x2={xCenter + boxWidth / 3} y2={min} stroke={item.color} strokeWidth="3.5" />
                            <line x1={xCenter - boxWidth / 3} y1={max} x2={xCenter + boxWidth / 3} y2={max} stroke={item.color} strokeWidth="3.5" />

                            {/* Etichette */}
                            <text x={xCenter} y={chartFrame.categoryLabelY} fontSize="16" fill={item.color} textAnchor="middle" fontWeight="600">
                              {item.label}
                            </text>
                            <text x={xCenter} y={chartFrame.countLabelY} fontSize="13" fill="#475569" textAnchor="middle">
                              n = {item.count}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ display: 'inline-block', width: '18px', height: '2px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                      Media
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ display: 'inline-block', width: '24px', height: '2px', borderBottom: '3px dashed #475569' }} />
                      Mediana
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ display: 'inline-block', width: '18px', height: '12px', backgroundColor: '#cbd5f5', border: '2px solid #475569' }} />
                      Intervallo interquartile
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {boxPlotData.map(item => (
                    <div key={`box-stats-${item.key}`} style={{
                      padding: '16px',
                      backgroundColor: item.color + '15',
                      borderRadius: '12px',
                      border: `1px solid ${item.color}55`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: item.color }}>{item.label}</h4>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>n = {item.count}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                        <div>Media<br /><strong>{item.stats.mean}</strong></div>
                        <div>Mediana<br /><strong>{item.stats.median}</strong></div>
                        <div>Moda<br /><strong>{toolsDistribution.stats?.[item.key]?.mode ?? '-'}</strong></div>
                        <div>Q1<br /><strong>{item.stats.q1}</strong></div>
                        <div>Q3<br /><strong>{item.stats.q3}</strong></div>
                        <div>Range<br /><strong>{item.stats.min} - {item.stats.max}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(wordCloudStudents.length > 0 || wordCloudTeachersActive.length > 0 || wordCloudTeachersTraining.length > 0) && (
              <section className="chart-section" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '12px' }}>Word Cloud Strumenti per Gruppo</h3>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  Ogni nuvola mostra gli strumenti più citati dal gruppo corrispondente; la dimensione della parola cresce con il numero di menzioni.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {wordCloudStudents.length > 0 && (
                    <div style={{
                      border: `3px solid ${RESPONDENT_COLORS.student}`,
                      borderRadius: '16px',
                      padding: '30px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}>
                      <h4 style={{ 
                        color: RESPONDENT_COLORS.student, 
                        marginBottom: '24px', 
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Studenti</h4>
                      <ToolWordCloud data={wordCloudStudents} backgroundColor="rgba(59, 130, 246, 0.06)" />
                    </div>
                  )}
                  {wordCloudTeachersActive.length > 0 && (
                    <div style={{
                      border: `3px solid ${RESPONDENT_COLORS.teacher_active}`,
                      borderRadius: '16px',
                      padding: '30px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}>
                      <h4 style={{ 
                        color: RESPONDENT_COLORS.teacher_active, 
                        marginBottom: '24px', 
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Docenti in Servizio</h4>
                      <ToolWordCloud data={wordCloudTeachersActive} backgroundColor="rgba(34, 197, 94, 0.06)" />
                    </div>
                  )}
                  {wordCloudTeachersTraining.length > 0 && (
                    <div style={{
                      border: `3px solid ${RESPONDENT_COLORS.teacher_training}`,
                      borderRadius: '16px',
                      padding: '30px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}>
                      <h4 style={{ 
                        color: RESPONDENT_COLORS.teacher_training, 
                        marginBottom: '24px', 
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Docenti Non in Servizio</h4>
                      <ToolWordCloud data={wordCloudTeachersTraining} backgroundColor="rgba(249, 115, 22, 0.06)" />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Top strumenti per categoria di rispondenti */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '30px' }}>
              {/* Studenti */}
              <section className="chart-section" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <h3 style={{ color: '#3b82f6' }}>Studenti - Top 10 Strumenti</h3>
                {topStudentTools.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Nessun dato disponibile per gli studenti.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={getChartHeight(topStudentTools)}>
                    <BarChart data={topStudentTools} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={RESPONDENT_COLORS.student} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* Docenti totali */}
              <section className="chart-section" style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #64748b' }}>
                <h3 style={{ color: '#64748b' }}>Docenti (tutti) - Top 10 Strumenti</h3>
                {topTeacherAll.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Nessun dato disponibile per i docenti.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={getChartHeight(topTeacherAll)}>
                    <BarChart data={topTeacherAll} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={RESPONDENT_COLORS.teacher} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* Docenti in servizio */}
              <section className="chart-section" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
                <h3 style={{ color: '#10b981' }}>Docenti in Servizio - Top 10 Strumenti</h3>
                {topTeacherActive.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Nessun dato disponibile per i docenti in servizio.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={getChartHeight(topTeacherActive)}>
                    <BarChart data={topTeacherActive} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={RESPONDENT_COLORS.teacher_active} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>

              {/* Docenti non in servizio */}
              <section className="chart-section" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                <h3 style={{ color: '#f59e0b' }}>Docenti Non in Servizio - Top 10 Strumenti</h3>
                {topTeacherTraining.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Nessun dato disponibile per i docenti non in servizio.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={getChartHeight(topTeacherTraining)}>
                    <BarChart data={topTeacherTraining} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={RESPONDENT_COLORS.teacher_training} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </section>
            </div>

            {/* Distribuzione numero strumenti */}
            {toolsDistribution && (
              <>
                <section className="chart-section">
                  <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>
                    Distribuzione Numero di Strumenti Utilizzati
                  </h2>
                  <p style={{ color: '#64748b', marginBottom: '30px' }}>
                    Quanti strumenti diversi vengono utilizzati contemporaneamente
                  </p>

                  {/* Statistiche riassuntive */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {/* Studenti */}
                    <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '10px', border: '2px solid #bfdbfe' }}>
                      <h4 style={{ color: '#3b82f6', marginBottom: '15px' }}>Studenti</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {toolsDistribution.stats?.students?.mean || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Media strumenti utilizzati</div>
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#64748b' }}>
                        Più frequente: <strong>{toolsDistribution.stats?.students?.mode || 0}</strong> strumenti
                      </div>
                    </div>

                    {/* Docenti in Servizio */}
                    <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '10px', border: '2px solid #bbf7d0' }}>
                      <h4 style={{ color: '#10b981', marginBottom: '15px' }}>Docenti in Servizio</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                        {toolsDistribution.stats?.teachers_active?.mean || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Media strumenti utilizzati</div>
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#64748b' }}>
                        Più frequente: <strong>{toolsDistribution.stats?.teachers_active?.mode || 0}</strong> strumenti
                      </div>
                    </div>

                    {/* Docenti Non in Servizio */}
                    <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '10px', border: '2px solid #fde68a' }}>
                      <h4 style={{ color: '#f59e0b', marginBottom: '15px' }}>Docenti Non in Servizio</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {toolsDistribution.stats?.teachers_training?.mean || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Media strumenti utilizzati</div>
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #fde68a', fontSize: '0.85rem', color: '#64748b' }}>
                        Più frequente: <strong>{toolsDistribution.stats?.teachers_training?.mode || 0}</strong> strumenti
                      </div>
                    </div>
                  </div>

                  {/* Grafico comparativo */}
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={toolsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Studenti" fill="#3b82f6" />
                      <Bar dataKey="Docenti Servizio" fill="#10b981" />
                      <Bar dataKey="Docenti Non Servizio" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>

                  {exclusionNotes.length > 0 && (
                    <div style={{
                      marginTop: '24px',
                      padding: '18px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5f5',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <Icons.Info className="w-5 h-5" style={{ color: '#3b82f6', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Nota sui conteggi</p>
                        {exclusionNotes.map(note => {
                          const excluded = note.stats?.excluded_zero || 0
                          const included = note.stats?.total || 0
                          const overall = note.stats?.overall || included
                          return (
                            <p key={note.key} style={{ margin: '0 0 6px 0', lineHeight: 1.5 }}>
                              <strong style={{ color: note.color }}>{note.label}:</strong> esclusi {excluded} rispondenti senza strumenti. Medie e distribuzioni calcolate su {included} partecipanti con almeno un tool su {overall} totali.
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {toolsDistribution?.details && (
                    <div style={{ marginTop: '35px' }}>
                      <h3 style={{ marginBottom: '15px' }}>Dettaglio per rispondente</h3>
                      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '18px' }}>
                        Tabella con il numero di strumenti distinti dichiarati da ciascun partecipante.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                        {toolDetailGroups.map(group => {
                          const stats = statsByGroup[group.key]
                          const includedCount = toolsDistribution?.details?.[group.key]?.length ?? 0
                          const overall = stats?.overall ?? toolsDistribution?.total_respondents?.[group.key] ?? includedCount
                          const labelSuffix = overall && overall !== includedCount
                            ? `${includedCount}/${overall}`
                            : `${includedCount}`

                          return (
                            <button
                              key={group.key}
                              onClick={() => setSelectedToolGroup(group.key)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '999px',
                                border: selectedToolGroup === group.key ? `2px solid ${group.color}` : '1px solid #cbd5f5',
                                backgroundColor: selectedToolGroup === group.key ? group.color : '#ffffff',
                                color: selectedToolGroup === group.key ? '#ffffff' : '#1f2937',
                                fontWeight: selectedToolGroup === group.key ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {group.label} ({labelSuffix})
                            </button>
                          )
                        })}
                      </div>

                      <div style={{
                        maxHeight: '320px',
                        overflow: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', width: '15%' }}>Codice</th>
                              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', width: '15%' }}># Strumenti</th>
                              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Elenco strumenti</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedToolDetails.length === 0 ? (
                              <tr>
                                <td colSpan={3} style={{ padding: '18px', textAlign: 'center', color: '#94a3b8' }}>
                                  Nessun dato disponibile per il gruppo selezionato.
                                </td>
                              </tr>
                            ) : (
                              selectedToolDetails.map((detail, index) => (
                                <tr key={`${detail.respondent_type}-${detail.id || detail.code || index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                    {detail.code || 'N/D'}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    {detail.tool_count}
                                  </td>
                                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                                    {detail.tools && detail.tools.length > 0 ? detail.tools.join(', ') : '—'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
