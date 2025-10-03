import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Icons } from './Icons'
import QuestionStats from './QuestionStats'
import RespondentView from './RespondentView'
import RespondentProfiles from './RespondentProfiles'
import AdvancedStats from './AdvancedStats'
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
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <Icons.Overview className="w-5 h-5" />
          Panoramica
        </button>
        <button className={activeTab === 'comparison' ? 'active' : ''} onClick={() => setActiveTab('comparison')}>
          <Icons.Comparison className="w-5 h-5" />
          Confronto
        </button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
          <Icons.Student className="w-5 h-5" />
          Studenti
        </button>
        <button className={activeTab === 'teachers' ? 'active' : ''} onClick={() => setActiveTab('teachers')}>
          <Icons.Teacher className="w-5 h-5" />
          Insegnanti Totali
        </button>
        <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => setActiveTab('tools')}>
          <Icons.Tools className="w-5 h-5" />
          Strumenti
        </button>
        <button className={activeTab === 'advanced' ? 'active' : ''} onClick={() => setActiveTab('advanced')}>
          <Icons.Chart className="w-5 h-5" />
          Analisi Avanzata
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
            <ul style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#475569', paddingLeft: '1.5rem' }}>
              <li><strong>Competenze e conoscenze</strong>: Quanto studenti e insegnanti si sentono preparati nell'uso dell'IA</li>
              <li><strong>Utilizzo pratico</strong>: Come e con quale frequenza vengono utilizzati gli strumenti di IA</li>
              <li><strong>Atteggiamenti e percezioni</strong>: Fiducia, preoccupazioni e aspettative verso l'IA nell'educazione</li>
              <li><strong>Impatto previsto</strong>: Come l'IA potrebbe cambiare i metodi di insegnamento e apprendimento</li>
            </ul>

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
        
        {activeTab === 'advanced' && <AdvancedStats />}
        
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
                  <option value="multiple_choice">Scelta multipla</option>
                  <option value="numeric">Numerica</option>
                  <option value="text">Testo aperto</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Categoria:</label>
                <select value={questionFilter.category} onChange={(e) => setQuestionFilter({...questionFilter, category: e.target.value})}>
                  <option value="all">Tutte</option>
                  {Object.keys(questionsData.statistics.categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="questions-categories">
              <h3>Domande per Categoria</h3>
              <div className="category-grid">
                {Object.entries(questionsData.statistics.categories).map(([category, stats]) => (
                  <div key={category} className="category-card">
                    <h4>{category}</h4>
                    <div className="category-stats">
                      <span className="total">Totale: {stats.total}</span>
                      <span className="open">Aperte: {stats.open}</span>
                      <span className="closed">Chiuse: {stats.closed}</span>
                    </div>
                  </div>
                ))}
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
                          {' '}{q.category}
                        </span>
                        <span className="question-format">{q.response_format}</span>
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

        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section className="chart-section">
              <h2>Competenze AI - Confronto</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={competenceData}
                  margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="competenza"
                    style={{ fontSize: '0.875rem' }}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, 7]}
                    style={{ fontSize: '0.875rem' }}
                    width={60}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Studenti" fill="#8884d8" />
                  <Bar dataKey="Insegnanti" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Fiducia e Formazione</h2>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart 
                  data={trustData}
                  margin={{ top: 20, right: 30, bottom: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="aspect"
                    style={{ fontSize: '0.75rem' }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    domain={[0, 7]}
                    style={{ fontSize: '0.875rem' }}
                    width={60}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Studenti" fill="#8884d8" />
                  <Bar dataKey="Insegnanti" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Utilizzo AI</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={usageData}
                  margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="categoria"
                    style={{ fontSize: '0.875rem' }}
                    interval={0}
                  />
                  <YAxis 
                    style={{ fontSize: '0.875rem' }}
                    width={60}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Usa quotidianamente" fill="#82ca9d" />
                  <Bar dataKey="Non usa" fill="#ff7c7c" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Ore settimanali di utilizzo</h2>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart 
                  data={hoursData}
                  margin={{ top: 20, right: 30, bottom: 80, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tipo"
                    style={{ fontSize: '0.75rem' }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    style={{ fontSize: '0.875rem' }}
                    width={60}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Studenti" fill="#8884d8" />
                  <Bar dataKey="Insegnanti" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="comparison-tab">
            <h2>Domande Speculari - Analisi Comparativa</h2>
            {comparison.comparisons && comparison.comparisons.map((comp, idx) => (
              <div key={idx} className="comparison-card">
                <h3>{comp.question}</h3>
                <div className="comparison-stats">
                  <div className="comparison-col">
                    <h4>Studenti</h4>
                    <p className="big-number">{comp.students.mean}</p>
                    <p className="small-text">Media (su scala 1-7)</p>
                    <p>Mediana: {comp.students.median}</p>
                  </div>
                  <div className="comparison-col">
                    <h4>Insegnanti</h4>
                    <p className="big-number">{comp.teachers.mean}</p>
                    <p className="small-text">Media (su scala 1-7)</p>
                    <p>Mediana: {comp.teachers.median}</p>
                  </div>
                  <div className="comparison-col">
                    <h4>Differenza</h4>
                    <p className={`big-number ${comp.difference > 0 ? 'positive' : comp.difference < 0 ? 'negative' : ''}`}>
                      {comp.difference > 0 ? '+' : ''}{comp.difference}
                    </p>
                    <p className="small-text">Insegnanti vs Studenti</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart 
                    data={[
                      { value: comp.students.mean, group: 'Studenti' },
                      { value: comp.teachers.mean, group: 'Insegnanti' }
                    ]}
                    margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="group"
                      style={{ fontSize: '0.875rem' }}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 7]}
                      style={{ fontSize: '0.875rem' }}
                      width={60}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <section className="demographics">
              <h2>Dati Demografici Studenti</h2>
              <div className="demo-stats">
                <div className="demo-card">
                  <h4>Età Media</h4>
                  <p className="big-number">{students.demographics?.age_avg || 0}</p>
                  <p className="small-text">Range: {students.demographics?.age_min || 0} - {students.demographics?.age_max || 0} anni</p>
                </div>
                <div className="demo-card">
                  <h4>Genere</h4>
                  {students.demographics?.gender_distribution && Object.entries(students.demographics.gender_distribution).map(([gender, count]) => (
                    <p key={gender}>{gender}: {count}</p>
                  ))}
                </div>
              </div>
            </section>

            <section className="chart-section">
              <h2>Competenze Studenti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { tipo: 'Pratica', valore: students.competenze?.practical?.mean || 0 },
                  { tipo: 'Teorica', valore: students.competenze?.theoretical?.mean || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Bar dataKey="valore" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Preoccupazioni Studenti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { tipo: 'AI a scuola', valore: students.preoccupazioni?.concern_ai_school?.mean || 0 },
                  { tipo: 'AI compagni', valore: students.preoccupazioni?.concern_ai_peers?.mean || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Bar dataKey="valore" fill="#ff7c7c" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="teachers-tab">
            <section className="demographics">
              <h2>Dati Demografici Insegnanti</h2>
              <div className="demo-stats">
                <div className="demo-card">
                  <h4>Età Media</h4>
                  <p className="big-number">{teachers.demographics?.age_avg || 0}</p>
                  <p className="small-text">Range: {teachers.demographics?.age_min || 0} - {teachers.demographics?.age_max || 0} anni</p>
                </div>
                <div className="demo-card">
                  <h4>Status Insegnamento</h4>
                  {teachers.demographics?.teaching_status_distribution && Object.entries(teachers.demographics.teaching_status_distribution).map(([status, count]) => (
                    <p key={status} className="small-text">{status}: {count}</p>
                  ))}
                </div>
              </div>
            </section>

            <section className="chart-section">
              <h2>Competenze Insegnanti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { tipo: 'Pratica', valore: teachers.competenze?.practical?.mean || 0 },
                  { tipo: 'Teorica', valore: teachers.competenze?.theoretical?.mean || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Bar dataKey="valore" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-section">
              <h2>Preoccupazioni Insegnanti</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { tipo: 'AI in educazione', valore: teachers.preoccupazioni?.concern_ai_education?.mean || 0 },
                  { tipo: 'AI studenti', valore: teachers.preoccupazioni?.concern_ai_students?.mean || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Bar dataKey="valore" fill="#ff7c7c" />
                </BarChart>
              </ResponsiveContainer>
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
