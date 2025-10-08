import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Line, Scatter } from 'recharts'
import { Icons } from './Icons'
import LikertInterpretation from './LikertInterpretation'
import SegmentedLikertAnalysis from './SegmentedLikertAnalysis'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

const LIKERT_COLORS = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#eab308',
  5: '#84cc16',
  6: '#22c55e',
  7: '#10b981'
}

const RESPONDENT_COLORS = {
  students: '#3b82f6',
  teachers_active: '#10b981',
  teachers_training: '#eab308'
}

const RESPONDENT_LABELS = {
  students: 'Studenti',
  teachers_active: 'Insegnanti in servizio',
  teachers_training: 'Insegnanti non in servizio'
}

function LikertAnalysis() {
  const [likertData, setLikertData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [expandedQuestions, setExpandedQuestions] = useState(new Set())
  const [activeTab, setActiveTab] = useState('grafici')

  useEffect(() => {
    loadLikertData()
  }, [])

  const loadLikertData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/likert-questions`)
      const data = await response.json()
      setLikertData(data)
      console.log('Likert data:', data)
    } catch (error) {
      console.error('Errore nel caricamento delle domande Likert:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (qId) => {
    const newExpanded = new Set(expandedQuestions)
    if (expandedQuestions.has(qId)) {
      newExpanded.delete(qId)
    } else {
      newExpanded.add(qId)
    }
    setExpandedQuestions(newExpanded)
  }

  if (loading) {
    return <div className="loading">Caricamento domande Likert...</div>
  }

  if (!likertData) {
    return <div className="error">Errore nel caricamento dei dati</div>
  }

  const filteredQuestions = likertData.questions.filter(q => {
    if (selectedGroup === 'all') return true
    return q.respondent_type === selectedGroup
  })

  // Raggruppa domande corrispondenti
  const groupedQuestions = {}
  const sharedQuestions = []
  const teacherSpecificQuestions = {} // Domande specifiche insegnanti (attivi vs formazione)

  filteredQuestions.forEach(q => {
    if (q.is_shared) {
      // Domande condivise tra studenti e insegnanti
      const key = q.shared_key
      if (!groupedQuestions[key]) {
        groupedQuestions[key] = {
          question_text: q.question_text,
          column_name: q.column_name,
          questions: []
        }
      }
      groupedQuestions[key].questions.push(q)
    } else if (q.respondent_type === 'teachers_active' || q.respondent_type === 'teachers_training') {
      // Domande specifiche insegnanti - raggruppa per confronto
      const key = q.column_name
      if (!teacherSpecificQuestions[key]) {
        teacherSpecificQuestions[key] = {
          question_text: q.question_text,
          column_name: q.column_name,
          questions: []
        }
      }
      teacherSpecificQuestions[key].questions.push(q)
    } else {
      // Domande solo studenti
      sharedQuestions.push(q)
    }
  })

  return (
    <div className="likert-analysis">
      <header className="section-header">
        <div>
          <h2>
            <Icons.Stats className="w-6 h-6" />
            Analisi domande Likert (scala 1-7)
          </h2>
          <p className="section-subtitle">
            Tutte le domande con scala Likert 1-7 suddivise per gruppo di rispondenti
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        gap: '0.5rem',
        padding: '0 2rem',
        background: '#ffffff'
      }}>
        {[
          { key: 'grafici', label: 'Grafici', icon: Icons.Chart },
          { key: 'interpretazione', label: 'Interpretazione', icon: Icons.FileText },
          { key: 'segmentazione', label: 'Analisi Segmentata', icon: Icons.Stats }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.key ? '#8b5cf6' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#64748b',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.key ? '600' : '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px 8px 0 0'
              }}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'interpretazione' ? (
        <LikertInterpretation />
      ) : activeTab === 'segmentazione' ? (
        <div style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#7c3aed' }}>
            Analisi Segmentata per Variabili Demografiche
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '2rem' }}>
            Confronto delle risposte a tutte le domande Likert suddiviso per variabili demografiche 
            (sesso, età, titolo di studio, area disciplinare, livello scolastico).
            Seleziona una domanda dal menu a tendina per esplorare le differenze tra sottogruppi.
          </p>
          
          {/* Segmentazione per Studenti */}
          <div style={{ marginBottom: '3rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Student className="w-5 h-5" />
              Studenti
            </h4>
            <SegmentedLikertAnalysis 
              questions={likertData.questions.filter(q => q.respondent_type === 'students')}
              respondentType="students"
            />
          </div>
          
          {/* Segmentazione per Insegnanti in Servizio */}
          <div style={{ marginBottom: '3rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Teacher className="w-5 h-5" />
              Insegnanti in Servizio
            </h4>
            <SegmentedLikertAnalysis 
              questions={likertData.questions.filter(q => q.respondent_type === 'teachers_active')}
              respondentType="teachers_active"
            />
          </div>
          
          {/* Segmentazione per Insegnanti Non in Servizio */}
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.Teacher className="w-5 h-5" />
              Insegnanti Non in Servizio
            </h4>
            <SegmentedLikertAnalysis 
              questions={likertData.questions.filter(q => q.respondent_type === 'teachers_training')}
              respondentType="teachers_training"
            />
          </div>
        </div>
      ) : (
        <div>

      <div className="filters-section" style={{ marginBottom: '2rem' }}>
        <div className="filter-group">
          <label>Visualizza:</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">Tutti i gruppi</option>
            <option value="students">Solo studenti</option>
            <option value="teachers_active">Solo insegnanti in servizio</option>
            <option value="teachers_training">Solo insegnanti non in servizio</option>
          </select>
        </div>
      </div>

      <div className="stats-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div className="stat-card" style={{ backgroundColor: '#dbeafe', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.25rem' }}>Studenti</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            {likertData.statistics.students_questions}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>domande Likert</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#d1fae5', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '0.25rem' }}>Insegnanti in servizio</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>
            {likertData.statistics.teachers_active_questions}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#34d399' }}>domande Likert</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.25rem' }}>In formazione</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
            {likertData.statistics.teachers_training_questions}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>domande Likert</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#e0e7ff', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#4338ca', marginBottom: '0.25rem' }}>Corrispondenti</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4338ca' }}>
            {likertData.statistics.shared_questions}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#818cf8' }}>domande condivise</div>
        </div>
      </div>

      {/* Domande Condivise - Layout in riga */}
      {selectedGroup === 'all' && Object.keys(groupedQuestions).length > 0 && (
        <section className="likert-section">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Users className="w-5 h-5" />
            Domande corrispondenti tra gruppi
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Domande poste sia a studenti che a insegnanti (attivi e in formazione)
          </p>

          {Object.entries(groupedQuestions).map(([key, group]) => {
            const qId = `shared-${key}`
            const isExpanded = expandedQuestions.has(qId)

            // Organizza le domande per tipo
            const studentQ = group.questions.find(q => q.respondent_type === 'students')
            const teacherActiveQ = group.questions.find(q => q.respondent_type === 'teachers_active')
            const teacherTrainingQ = group.questions.find(q => q.respondent_type === 'teachers_training')

            return (
              <div key={qId} className="likert-question-card shared" style={{ marginBottom: '2rem', border: '2px solid #8b5cf6', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f5f3ff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleQuestion(qId)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ede9fe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: '#6d28d9', marginBottom: '0.5rem', fontWeight: '600' }}>
                        DOMANDA CORRISPONDENTE {isExpanded ? '(Clicca per nascondere dettagli)' : '(Clicca per mostrare grafici dettagliati)'}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>
                        {group.question_text}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Campo: {group.column_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <Icons.ChevronDown
                        className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: '#8b5cf6' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: '600' }}>
                        {isExpanded ? 'Nascondi' : 'Mostra'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box Plot Comparativo in riga */}
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                  <ComparisonBoxPlot
                    studentData={studentQ}
                    teacherActiveData={teacherActiveQ}
                    teacherTrainingData={teacherTrainingQ}
                  />

                  {/* Test di Significatività Statistica */}
                  {likertData.shared_question_significance && likertData.shared_question_significance[key] && (
                    <div style={{ 
                      marginTop: '1.5rem',
                      padding: '1rem', 
                      backgroundColor: likertData.shared_question_significance[key].is_significant ? '#dcfce7' : '#f1f5f9',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${likertData.shared_question_significance[key].is_significant ? '#10b981' : '#94a3b8'}`
                    }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        marginBottom: '0.5rem', 
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Icons.TrendingUp className="w-4 h-4" />
                        Test di Significatività Statistica
                      </div>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.5', color: '#475569' }}>
                        <p style={{ marginBottom: '0.25rem' }}>
                          <strong>Risultato:</strong> Le differenze tra i gruppi sono <strong>{likertData.shared_question_significance[key].significance_level}</strong>
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                          <div>
                            <strong>Kruskal-Wallis H:</strong> {likertData.shared_question_significance[key].kruskal_wallis_h} (p = {likertData.shared_question_significance[key].kruskal_wallis_p})
                          </div>
                          <div>
                            <strong>ANOVA F:</strong> {likertData.shared_question_significance[key].anova_f} (p = {likertData.shared_question_significance[key].anova_p})
                          </div>
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>
                          {likertData.shared_question_significance[key].is_significant 
                            ? 'Le differenze osservate tra i gruppi sono statisticamente significative e non dovute al caso.'
                            : 'Le differenze osservate potrebbero essere dovute al caso. Non ci sono evidenze statistiche sufficienti.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dettagli espandibili */}
                  {isExpanded && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#475569' }}>Grafici dettagliati</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {studentQ && (
                          <div>
                            <DetailedQuestionView question={studentQ} label="Studenti" />
                            <QuestionInterpretation question={studentQ} label="Studenti" />
                          </div>
                        )}
                        {teacherActiveQ && (
                          <div>
                            <DetailedQuestionView question={teacherActiveQ} label="Insegnanti in Servizio" />
                            <QuestionInterpretation question={teacherActiveQ} label="Insegnanti in Servizio" />
                          </div>
                        )}
                        {teacherTrainingQ && (
                          <div>
                            <DetailedQuestionView question={teacherTrainingQ} label="Insegnanti Non in Servizio" />
                            <QuestionInterpretation question={teacherTrainingQ} label="Insegnanti Non in Servizio" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Domande Specifiche Insegnanti - Confronto Attivi vs Formazione */}
      {selectedGroup === 'all' && Object.keys(teacherSpecificQuestions).length > 0 && (
        <section className="likert-section">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Teacher className="w-5 h-5" />
            Domande specifiche insegnanti: confronto attivi vs in formazione
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Domande poste solo agli insegnanti, confrontate tra chi insegna attualmente e chi è in formazione
          </p>

          {Object.entries(teacherSpecificQuestions).map(([key, group]) => {
            const activeQ = group.questions.find(q => q.respondent_type === 'teachers_active')
            const trainingQ = group.questions.find(q => q.respondent_type === 'teachers_training')
            const qId = `teacher-specific-${key}`
            const isExpanded = expandedQuestions.has(qId)

            return (
              <div key={`teacher-${key}`} className="likert-question-card" style={{ marginBottom: '2rem', border: '2px solid #7c3aed', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f5f3ff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleQuestion(qId)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ede9fe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: '#6d28d9', marginBottom: '0.5rem', fontWeight: '600' }}>
                        DOMANDA SPECIFICA INSEGNANTI {isExpanded ? '(Clicca per nascondere dettagli)' : '(Clicca per mostrare grafici dettagliati)'}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>
                        {group.question_text}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Campo: {group.column_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <Icons.ChevronDown
                        className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: '#7c3aed' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: '600' }}>
                        {isExpanded ? 'Nascondi' : 'Mostra'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                  <TeacherComparisonBoxPlot
                    activeData={activeQ}
                    trainingData={trainingQ}
                  />

                  {/* Box Test di Significatività Statistica - SOTTO IL GRAFICO */}
                  {likertData.teacher_specific_significance && likertData.teacher_specific_significance[key] && (
                    <div style={{
                      padding: '1rem',
                      marginTop: '2rem',
                      backgroundColor: likertData.teacher_specific_significance[key].is_significant ? '#dcfce7' : '#f1f5f9',
                      border: `2px solid ${likertData.teacher_specific_significance[key].is_significant ? '#16a34a' : '#94a3b8'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                        📊 Test di Significatività Statistica
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
                        <strong>Risultato:</strong> Le differenze tra i gruppi sono{' '}
                        <strong style={{ color: likertData.teacher_specific_significance[key].is_significant ? '#16a34a' : '#64748b' }}>
                          {likertData.teacher_specific_significance[key].significance_level}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <strong>Kruskal-Wallis H:</strong> {likertData.teacher_specific_significance[key].kruskal_wallis_h} 
                          {' '}(p = {likertData.teacher_specific_significance[key].kruskal_wallis_p})
                        </div>
                        <div>
                          <strong>ANOVA F:</strong> {likertData.teacher_specific_significance[key].anova_f}
                          {' '}(p = {likertData.teacher_specific_significance[key].anova_p})
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        {likertData.teacher_specific_significance[key].is_significant
                          ? 'Le differenze osservate tra i gruppi sono statisticamente significative e non dovute al caso.'
                          : 'Le differenze osservate tra i gruppi potrebbero essere dovute al caso (non significative).'}
                      </div>
                    </div>
                  )}

                  {/* Grafici dettagliati espandibili */}
                  {isExpanded && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#475569' }}>Grafici dettagliati</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                        {activeQ && (
                          <div>
                            <DetailedQuestionView question={activeQ} label="Insegnanti in Servizio" />
                            <QuestionInterpretation question={activeQ} label="Insegnanti in Servizio" />
                          </div>
                        )}
                        {trainingQ && (
                          <div>
                            <DetailedQuestionView question={trainingQ} label="Insegnanti Non in Servizio" />
                            <QuestionInterpretation question={trainingQ} label="Insegnanti Non in Servizio" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Domande Specifiche Solo Studenti */}
      {(() => {
        const studentQuestions = sharedQuestions.filter(q => q.respondent_type === 'students')

        if (studentQuestions.length === 0 || (selectedGroup !== 'all' && selectedGroup !== 'students')) {
          return null
        }

        const qId = 'students-specific-all'
        const isExpanded = expandedQuestions.has(qId)

        return (
          <section key="students-specific" className="likert-section">
            <h3 style={{
              fontSize: '1.3rem',
              marginBottom: '1rem',
              color: RESPONDENT_COLORS.students,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Icons.Student className="w-5 h-5" />
              Domande specifiche: studenti
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Domande poste solo agli studenti
            </p>

            {/* Card con box plots e grafici espandibili */}
            <div style={{ marginBottom: '2rem', border: `2px solid ${RESPONDENT_COLORS.students}`, borderRadius: '8px', overflow: 'hidden' }}>
              {/* Header cliccabile */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: RESPONDENT_COLORS.students + '15',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => toggleQuestion(qId)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = RESPONDENT_COLORS.students + '25'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = RESPONDENT_COLORS.students + '15'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: RESPONDENT_COLORS.students, marginBottom: '0.5rem', fontWeight: '600' }}>
                      DOMANDE SPECIFICHE STUDENTI {isExpanded ? '(Clicca per nascondere dettagli)' : '(Clicca per mostrare grafici dettagliati)'}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>
                      Confronto box plot - tutte le domande specifiche studenti
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <Icons.ChevronDown
                      className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      style={{ color: RESPONDENT_COLORS.students }}
                    />
                    <span style={{ fontSize: '0.7rem', color: RESPONDENT_COLORS.students, fontWeight: '600' }}>
                      {isExpanded ? 'Nascondi' : 'Mostra'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box plots sempre visibili */}
              <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                <MultipleStudentBoxPlots questions={studentQuestions} />

                {/* Box informativo - Nota sui test statistici */}
                <div style={{
                  padding: '1rem',
                  marginTop: '2rem',
                  backgroundColor: '#f0f9ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.75rem', color: '#1e293b' }}>
                    ℹ️ Nota sui Test di Significatività Statistica
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      <strong>Le domande specifiche studenti non includono test di significatività statistica</strong> perché rappresentano 
                      un singolo gruppo di rispondenti (n={studentQuestions[0]?.stats.total_responses || 0}).
                    </p>
                    <p style={{ margin: '0' }}>
                      I test statistici (Kruskal-Wallis, ANOVA) richiedono almeno <strong>due gruppi indipendenti</strong> da confrontare. 
                      Per queste domande sono disponibili le statistiche descrittive complete (media, mediana, moda, deviazione standard, quartili).
                    </p>
                  </div>
                </div>

                {/* Grafici dettagliati espandibili */}
                {isExpanded && (
                  <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#475569' }}>Grafici Dettagliati</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                      {studentQuestions.map((q, idx) => (
                        <div key={`detail-students-${idx}`} style={{
                          padding: '1.5rem',
                          backgroundColor: '#ffffff',
                          border: `1px solid ${RESPONDENT_COLORS.students}40`,
                          borderRadius: '8px'
                        }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                            {q.question_text}
                          </h4>
                          <DetailedQuestionView question={q} label="Studenti" />
                          <QuestionInterpretation question={q} label="Studenti" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Visualizzazione filtrata per singolo gruppo */}
      {selectedGroup !== 'all' && (() => {
        const questionsForGroup = selectedGroup === 'students'
          ? sharedQuestions.filter(q => q.respondent_type === selectedGroup)
          : Object.values(teacherSpecificQuestions).flatMap(g =>
              g.questions.filter(q => q.respondent_type === selectedGroup)
            )

        if (questionsForGroup.length === 0) return null

        const GroupIcon = selectedGroup === 'students' ? Icons.Student : Icons.Teacher

        return (
          <section key={selectedGroup} className="likert-section">
            <h3 style={{
              fontSize: '1.3rem',
              marginBottom: '1rem',
              color: RESPONDENT_COLORS[selectedGroup],
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <GroupIcon className="w-5 h-5" />
              Domande specifiche: {RESPONDENT_LABELS[selectedGroup]}
            </h3>

            <div style={{ marginBottom: '2rem' }}>
              {questionsForGroup.map((q, idx) => (
                <SingleQuestionBoxPlot
                  key={`${selectedGroup}-${idx}`}
                  question={q}
                  color={RESPONDENT_COLORS[selectedGroup]}
                  groupLabel={RESPONDENT_LABELS[selectedGroup]}
                />
              ))}
            </div>
          </section>
        )
      })()}
        </div>
      )}
    </div>
  )
}

// Componente Box Plot multipli per domande studenti (tutti affiancati)
function MultipleStudentBoxPlots({ questions }) {
  const baseColor = RESPONDENT_COLORS.students

  if (!questions || questions.length === 0) return null

  // Genera tonalità diverse di blu per ogni box plot
  const generateBlueShades = (count) => {
    // Colore base studenti: #3b82f6 (blu)
    // Genero variazioni dal blu scuro (#1e40af) al blu chiaro (#93c5fd)
    const blueShades = [
      '#1e40af', // Blu molto scuro
      '#2563eb', // Blu scuro
      '#3b82f6', // Blu base (colore studenti)
      '#60a5fa', // Blu medio-chiaro
      '#93c5fd', // Blu chiaro
      '#bfdbfe', // Blu molto chiaro
      '#dbeafe', // Blu chiarissimo
      '#eff6ff'  // Blu quasi bianco
    ]

    // Seleziona le tonalità in base al numero di domande
    const result = []
    for (let i = 0; i < count; i++) {
      const index = Math.floor((i / count) * blueShades.length)
      result.push(blueShades[Math.min(index, blueShades.length - 1)])
    }
    return result
  }

  const colors = generateBlueShades(questions.length)

  // Calcola dimensioni dinamiche - più larghe
  const numQuestions = questions.length
  const boxWidth = 70
  const spacing = 140
  const paddingLeft = 100
  const paddingRight = 60
  const totalWidth = Math.max(1200, numQuestions * spacing + paddingLeft + paddingRight)
  const height = 450

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Leggenda compatta sopra il grafico */}
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        {questions.map((q, idx) => (
          <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: colors[idx],
              border: `2px solid ${colors[idx]}`,
              borderRadius: '4px',
              flexShrink: 0
            }} />
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500', wordWrap: 'break-word', flex: 1 }}>
              Q{idx + 1}: {q.question_text}
            </span>
          </div>
        ))}
      </div>

      {/* Grafico centrato */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto' }}>
        <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`} style={{ display: 'block', margin: '0 auto' }}>
        {/* Griglia e assi */}
        <g>
          {/* Asse Y con etichette */}
          <line x1="80" y1="30" x2="80" y2="400" stroke="#cbd5e1" strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
            const y = 400 - ((val / 7) * 370)
            return (
              <g key={val}>
                <line x1="75" y1={y} x2="80" y2={y} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="80" y1={y} x2={totalWidth - paddingRight} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="65" y={y + 5} fontSize="13" fill="#64748b" textAnchor="end">{val}</text>
              </g>
            )
          })}
          <text x="20" y="215" fontSize="14" fill="#475569" transform="rotate(-90 20 215)" textAnchor="middle">
            Scala Likert (1-7)
          </text>

          {/* Asse X */}
          <line x1="80" y1="400" x2={totalWidth - paddingRight} y2="400" stroke="#cbd5e1" strokeWidth="2" />

          {/* Box Plots con colori diversi - centrati nella griglia */}
          {questions.map((question, index) => {
            const stats = question.stats
            // Centra i box plots nella griglia disponibile
            const totalGridWidth = totalWidth - paddingLeft - paddingRight
            const startX = paddingLeft + (totalGridWidth - (numQuestions * spacing)) / 2
            const xCenter = startX + (index * spacing) + spacing / 2
            const color = colors[index]

            const yMin = 400 - ((stats.quartiles.min / 7) * 370)
            const yQ1 = 400 - ((stats.quartiles.q1 / 7) * 370)
            const yQ2 = 400 - ((stats.quartiles.q2 / 7) * 370)
            const yQ3 = 400 - ((stats.quartiles.q3 / 7) * 370)
            const yMax = 400 - ((stats.quartiles.max / 7) * 370)
            const yMean = 400 - ((stats.mean / 7) * 370)

            return (
              <g key={`box-${index}`}>
                {/* Etichetta numerica semplice sotto */}
                <text
                  x={xCenter}
                  y="420"
                  fontSize="14"
                  fill={color}
                  textAnchor="middle"
                  fontWeight="700"
                >
                  Q{index + 1}
                </text>

                {/* Whisker inferiore */}
                <line x1={xCenter} y1={yMin} x2={xCenter} y2={yQ1} stroke={color} strokeWidth="2.5" />

                {/* Whisker superiore */}
                <line x1={xCenter} y1={yQ3} x2={xCenter} y2={yMax} stroke={color} strokeWidth="2.5" />

                {/* Box (IQR) */}
                <rect
                  x={xCenter - boxWidth/2}
                  y={yQ3}
                  width={boxWidth}
                  height={yQ1 - yQ3}
                  fill={color + '40'}
                  stroke={color}
                  strokeWidth="2.5"
                />

                {/* Mediana (linea tratteggiata spessa) */}
                <line
                  x1={xCenter - boxWidth/2}
                  y1={yQ2}
                  x2={xCenter + boxWidth/2}
                  y2={yQ2}
                  stroke={color}
                  strokeWidth="5"
                  strokeDasharray="8 4"
                />

                {/* Media (punto) */}
                <circle cx={xCenter} cy={yMean} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />

                {/* Cap min */}
                <line
                  x1={xCenter - boxWidth/3}
                  y1={yMin}
                  x2={xCenter + boxWidth/3}
                  y2={yMin}
                  stroke={color}
                  strokeWidth="2.5"
                />

                {/* Cap max */}
                <line
                  x1={xCenter - boxWidth/3}
                  y1={yMax}
                  x2={xCenter + boxWidth/3}
                  y2={yMax}
                  stroke={color}
                  strokeWidth="2.5"
                />
              </g>
            )
          })}
        </g>
        </svg>
      </div>

      {/* Dettagli statistici sotto il grafico */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {questions.map((q, idx) => (
          <div key={`stats-${idx}`} style={{
            padding: '0.75rem',
            backgroundColor: colors[idx] + '15',
            borderRadius: '6px',
            border: `2px solid ${colors[idx]}`
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
              Q{idx + 1}: {q.question_text}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem' }}>
              <div>Media: <strong style={{ color: colors[idx] }}>{q.stats.mean}</strong></div>
              <div>Mediana: <strong style={{ color: colors[idx] }}>{q.stats.median}</strong></div>
              <div>Moda: <strong style={{ color: colors[idx] }}>{q.stats.mode}</strong></div>
              <div>n: <strong style={{ color: colors[idx] }}>{q.stats.total_responses}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente Box Plot Comparativo per Insegnanti (Attivi vs Formazione)
function TeacherComparisonBoxPlot({ activeData, trainingData }) {
  const boxPlotData = []

  if (activeData) {
    boxPlotData.push({
      name: 'Insegnanti in Servizio',
      type: 'teachers_active',
      ...activeData.stats.quartiles,
      mean: activeData.stats.mean,
      mode: activeData.stats.mode,
      std_dev: activeData.stats.std_dev,
      n: activeData.stats.total_responses
    })
  }

  if (trainingData) {
    boxPlotData.push({
      name: 'Non in Servizio',
      type: 'teachers_training',
      ...trainingData.stats.quartiles,
      mean: trainingData.stats.mean,
      mode: trainingData.stats.mode,
      std_dev: trainingData.stats.std_dev,
      n: trainingData.stats.total_responses
    })
  }

  return (
    <div>
      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569', textAlign: 'center' }}>
        Confronto box plot: Insegnanti in Servizio vs Non in Servizio
      </h4>
      <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
        <svg width="100%" height="450" viewBox="0 0 700 450">
          {/* Griglia e assi */}
          <g>
            {/* Asse Y con etichette */}
            <line x1="80" y1="30" x2="80" y2="380" stroke="#cbd5e1" strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
              const y = 380 - ((val / 7) * 350)
              return (
                <g key={val}>
                  <line x1="75" y1={y} x2="80" y2={y} stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="80" y1={y} x2="620" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="65" y={y + 5} fontSize="13" fill="#64748b" textAnchor="end">{val}</text>
                </g>
              )
            })}
            <text x="20" y="205" fontSize="14" fill="#475569" transform="rotate(-90 20 205)" textAnchor="middle">
              Scala Likert (1-7)
            </text>

            {/* Asse X */}
            <line x1="80" y1="380" x2="620" y2="380" stroke="#cbd5e1" strokeWidth="2" />

            {/* Box Plots */}
            {boxPlotData.map((entry, index) => {
              const color = RESPONDENT_COLORS[entry.type]
              const totalBoxes = boxPlotData.length
              const spacing = 540 / (totalBoxes + 1)
              const xCenter = 80 + spacing * (index + 1)
              const boxWidth = 60

              const yMin = 380 - ((entry.min / 7) * 350)
              const yQ1 = 380 - ((entry.q1 / 7) * 350)
              const yQ2 = 380 - ((entry.q2 / 7) * 350)
              const yQ3 = 380 - ((entry.q3 / 7) * 350)
              const yMax = 380 - ((entry.max / 7) * 350)
              const yMean = 380 - ((entry.mean / 7) * 350)

              return (
                <g key={`box-${index}`}>
                  {/* Etichetta X */}
                  <text x={xCenter} y="405" fontSize="14" fill="#475569" textAnchor="middle" fontWeight="500">
                    {entry.name}
                  </text>
                  <text x={xCenter} y="423" fontSize="12" fill="#94a3b8" textAnchor="middle">
                    (n={entry.n})
                  </text>

                  {/* Whisker inferiore */}
                  <line x1={xCenter} y1={yMin} x2={xCenter} y2={yQ1} stroke={color} strokeWidth="2.5" />

                  {/* Whisker superiore */}
                  <line x1={xCenter} y1={yQ3} x2={xCenter} y2={yMax} stroke={color} strokeWidth="2.5" />

                  {/* Box (IQR) */}
                  <rect
                    x={xCenter - boxWidth/2}
                    y={yQ3}
                    width={boxWidth}
                    height={yQ1 - yQ3}
                    fill={color + '35'}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Mediana (linea tratteggiata spessa) */}
                  <line
                    x1={xCenter - boxWidth/2}
                    y1={yQ2}
                    x2={xCenter + boxWidth/2}
                    y2={yQ2}
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray="8 4"
                  />

                  {/* Etichette Q1 e Q3 sul box */}
                  <text x={xCenter + boxWidth/2 + 8} y={yQ1 + 4} fontSize="11" fill={color} fontWeight="600">Q1</text>
                  <text x={xCenter + boxWidth/2 + 8} y={yQ3 + 4} fontSize="11" fill={color} fontWeight="600">Q3</text>

                  {/* Media (punto rosso) */}
                  <circle cx={xCenter} cy={yMean} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />

                  {/* Cap min */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMin}
                    x2={xCenter + boxWidth/3}
                    y2={yMin}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Cap max */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMax}
                    x2={xCenter + boxWidth/3}
                    y2={yMax}
                    stroke={color}
                    strokeWidth="2.5"
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Legenda statistiche */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem', maxWidth: '700px', margin: '1.5rem auto 0' }}>
        {boxPlotData.map((entry) => (
          <div key={entry.type} style={{
            padding: '0.75rem',
            backgroundColor: RESPONDENT_COLORS[entry.type] + '15',
            borderRadius: '6px',
            border: `1px solid ${RESPONDENT_COLORS[entry.type]}40`
          }}>
            <div style={{ fontWeight: '600', color: RESPONDENT_COLORS[entry.type], marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              {entry.name} (n={entry.n})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              <div>Min: {entry.min}</div>
              <div>Max: {entry.max}</div>
              <div>Q1: {entry.q1}</div>
              <div>Q3: {entry.q3}</div>
              <div>Mediana: {entry.q2}</div>
              <div>Media: {entry.mean}</div>
              <div>Moda: {entry.mode}</div>
              <div>Dev. Std: {entry.std_dev}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente Box Plot per singola domanda (affiancato al testo)
function SingleQuestionBoxPlot({ question, color, groupLabel }) {
  const stats = question.stats

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 350px',
      gap: '2rem',
      marginBottom: '1.5rem',
      padding: '1.5rem',
      backgroundColor: '#ffffff',
      border: `1px solid ${color}40`,
      borderRadius: '8px',
      alignItems: 'center'
    }}>
      {/* Testo della domanda */}
      <div>
        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b', marginBottom: '0.5rem' }}>
          {question.question_text}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Campo: {question.column_name}
        </div>

        {/* Statistiche in card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Media</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{stats.mean}</div>
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Mediana</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{stats.median}</div>
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Moda</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{stats.mode}</div>
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Dev.Std</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{stats.std_dev}</div>
          </div>
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>n</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{stats.total_responses}</div>
          </div>
        </div>
      </div>

      {/* Box Plot */}
      <div>
        <svg width="350" height="280" viewBox="0 0 350 280">
          {/* Griglia e assi */}
          <g>
            {/* Asse Y con etichette */}
            <line x1="60" y1="20" x2="60" y2="240" stroke="#cbd5e1" strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
              const y = 240 - ((val / 7) * 220)
              return (
                <g key={val}>
                  <line x1="55" y1={y} x2="60" y2={y} stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="60" y1={y} x2="320" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="45" y={y + 4} fontSize="11" fill="#64748b" textAnchor="end">{val}</text>
                </g>
              )
            })}
            <text x="15" y="130" fontSize="12" fill="#475569" transform="rotate(-90 15 130)" textAnchor="middle">
              Scala Likert
            </text>

            {/* Asse X */}
            <line x1="60" y1="240" x2="320" y2="240" stroke="#cbd5e1" strokeWidth="2" />

            {/* Box Plot centrato */}
            {(() => {
              const xCenter = 190
              const boxWidth = 70

              const yMin = 240 - ((stats.quartiles.min / 7) * 220)
              const yQ1 = 240 - ((stats.quartiles.q1 / 7) * 220)
              const yQ2 = 240 - ((stats.quartiles.q2 / 7) * 220)
              const yQ3 = 240 - ((stats.quartiles.q3 / 7) * 220)
              const yMax = 240 - ((stats.quartiles.max / 7) * 220)
              const yMean = 240 - ((stats.mean / 7) * 220)

              return (
                <g>
                  {/* Etichetta */}
                  <text x={xCenter} y="260" fontSize="13" fill="#475569" textAnchor="middle" fontWeight="500">
                    {groupLabel}
                  </text>

                  {/* Whisker inferiore */}
                  <line x1={xCenter} y1={yMin} x2={xCenter} y2={yQ1} stroke={color} strokeWidth="2.5" />

                  {/* Whisker superiore */}
                  <line x1={xCenter} y1={yQ3} x2={xCenter} y2={yMax} stroke={color} strokeWidth="2.5" />

                  {/* Box (IQR) */}
                  <rect
                    x={xCenter - boxWidth/2}
                    y={yQ3}
                    width={boxWidth}
                    height={yQ1 - yQ3}
                    fill={color + '35'}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Mediana (linea tratteggiata spessa) */}
                  <line
                    x1={xCenter - boxWidth/2}
                    y1={yQ2}
                    x2={xCenter + boxWidth/2}
                    y2={yQ2}
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray="8 4"
                  />

                  {/* Etichette Q1 e Q3 sul box */}
                  <text x={xCenter + boxWidth/2 + 8} y={yQ1 + 4} fontSize="10" fill={color} fontWeight="600">Q1</text>
                  <text x={xCenter + boxWidth/2 + 8} y={yQ3 + 4} fontSize="10" fill={color} fontWeight="600">Q3</text>

                  {/* Media (punto rosso) */}
                  <circle cx={xCenter} cy={yMean} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />

                  {/* Cap min */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMin}
                    x2={xCenter + boxWidth/3}
                    y2={yMin}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Cap max */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMax}
                    x2={xCenter + boxWidth/3}
                    y2={yMax}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Etichette valori */}
                  <text x={xCenter + boxWidth/2 + 10} y={yMin + 4} fontSize="10" fill={color} fontWeight="600">
                    {stats.quartiles.min}
                  </text>
                  <text x={xCenter + boxWidth/2 + 10} y={yMax + 4} fontSize="10" fill={color} fontWeight="600">
                    {stats.quartiles.max}
                  </text>
                  <text x={xCenter + boxWidth/2 + 10} y={yMean + 4} fontSize="10" fill="#ef4444" fontWeight="600">
                    μ:{stats.mean}
                  </text>
                </g>
              )
            })()}
          </g>
        </svg>
      </div>
    </div>
  )
}

// Componente Box Plot Comparativo (tre categorie in riga)
function ComparisonBoxPlot({ studentData, teacherActiveData, teacherTrainingData }) {
  const boxPlotData = []

  if (studentData) {
    boxPlotData.push({
      name: 'Studenti',
      type: 'students',
      ...studentData.stats.quartiles,
      mean: studentData.stats.mean,
      mode: studentData.stats.mode,
      std_dev: studentData.stats.std_dev,
      n: studentData.stats.total_responses
    })
  }

  if (teacherActiveData) {
    boxPlotData.push({
      name: 'Insegnanti in Servizio',
      type: 'teachers_active',
      ...teacherActiveData.stats.quartiles,
      mean: teacherActiveData.stats.mean,
      mode: teacherActiveData.stats.mode,
      std_dev: teacherActiveData.stats.std_dev,
      n: teacherActiveData.stats.total_responses
    })
  }

  if (teacherTrainingData) {
    boxPlotData.push({
      name: 'Non in Servizio',
      type: 'teachers_training',
      ...teacherTrainingData.stats.quartiles,
      mean: teacherTrainingData.stats.mean,
      mode: teacherTrainingData.stats.mode,
      std_dev: teacherTrainingData.stats.std_dev,
      n: teacherTrainingData.stats.total_responses
    })
  }

  return (
    <div>
      <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569', textAlign: 'center' }}>
        Confronto box plot
      </h4>
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
        <svg width="100%" height="500" viewBox="0 0 900 500">
          {/* Griglia e assi */}
          <g>
            {/* Asse Y con etichette */}
            <line x1="80" y1="30" x2="80" y2="430" stroke="#cbd5e1" strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
              const y = 430 - ((val / 7) * 400)
              return (
                <g key={val}>
                  <line x1="75" y1={y} x2="80" y2={y} stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="80" y1={y} x2="820" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="65" y={y + 5} fontSize="13" fill="#64748b" textAnchor="end">{val}</text>
                </g>
              )
            })}
            <text x="20" y="230" fontSize="14" fill="#475569" transform="rotate(-90 20 230)" textAnchor="middle">
              Scala Likert (1-7)
            </text>

            {/* Asse X */}
            <line x1="80" y1="430" x2="820" y2="430" stroke="#cbd5e1" strokeWidth="2" />

            {/* Etichette X e Box Plots */}
            {boxPlotData.map((entry, index) => {
              const color = RESPONDENT_COLORS[entry.type]
              const totalBoxes = boxPlotData.length
              const spacing = 740 / (totalBoxes + 1)
              const xCenter = 80 + spacing * (index + 1)
              const boxWidth = 60

              // Calcola posizioni Y
              const yMin = 430 - ((entry.min / 7) * 400)
              const yQ1 = 430 - ((entry.q1 / 7) * 400)
              const yQ2 = 430 - ((entry.q2 / 7) * 400)
              const yQ3 = 430 - ((entry.q3 / 7) * 400)
              const yMax = 430 - ((entry.max / 7) * 400)
              const yMean = 430 - ((entry.mean / 7) * 400)

              return (
                <g key={`box-${index}`}>
                  {/* Etichetta X */}
                  <text x={xCenter} y="455" fontSize="14" fill="#475569" textAnchor="middle" fontWeight="500">
                    {entry.name}
                  </text>
                  <text x={xCenter} y="473" fontSize="12" fill="#94a3b8" textAnchor="middle">
                    (n={entry.n})
                  </text>

                  {/* Whisker inferiore */}
                  <line x1={xCenter} y1={yMin} x2={xCenter} y2={yQ1} stroke={color} strokeWidth="2.5" />

                  {/* Whisker superiore */}
                  <line x1={xCenter} y1={yQ3} x2={xCenter} y2={yMax} stroke={color} strokeWidth="2.5" />

                  {/* Box (IQR) */}
                  <rect
                    x={xCenter - boxWidth/2}
                    y={yQ3}
                    width={boxWidth}
                    height={yQ1 - yQ3}
                    fill={color + '35'}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Mediana (linea tratteggiata spessa) */}
                  <line
                    x1={xCenter - boxWidth/2}
                    y1={yQ2}
                    x2={xCenter + boxWidth/2}
                    y2={yQ2}
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray="8 4"
                  />

                  {/* Etichette Q1 e Q3 sul box */}
                  <text x={xCenter + boxWidth/2 + 8} y={yQ1 + 4} fontSize="11" fill={color} fontWeight="600">Q1</text>
                  <text x={xCenter + boxWidth/2 + 8} y={yQ3 + 4} fontSize="11" fill={color} fontWeight="600">Q3</text>

                  {/* Media (punto rosso) */}
                  <circle cx={xCenter} cy={yMean} r="6" fill="#ef4444" stroke="#fff" strokeWidth="2" />

                  {/* Cap min */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMin}
                    x2={xCenter + boxWidth/3}
                    y2={yMin}
                    stroke={color}
                    strokeWidth="2.5"
                  />

                  {/* Cap max */}
                  <line
                    x1={xCenter - boxWidth/3}
                    y1={yMax}
                    x2={xCenter + boxWidth/3}
                    y2={yMax}
                    stroke={color}
                    strokeWidth="2.5"
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Legenda statistiche */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        {boxPlotData.map((entry) => (
          <div key={entry.type} style={{
            padding: '0.75rem',
            backgroundColor: RESPONDENT_COLORS[entry.type] + '15',
            borderRadius: '6px',
            border: `1px solid ${RESPONDENT_COLORS[entry.type]}40`
          }}>
            <div style={{ fontWeight: '600', color: RESPONDENT_COLORS[entry.type], marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              {entry.name} (n={entry.n})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              <div>Min: {entry.min}</div>
              <div>Max: {entry.max}</div>
              <div>Q1: {entry.q1}</div>
              <div>Q3: {entry.q3}</div>
              <div>Mediana: {entry.q2}</div>
              <div>Media: {entry.mean}</div>
              <div>Moda: {entry.mode}</div>
              <div>Dev. Std: {entry.std_dev}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente per l'interpretazione di una singola domanda
function QuestionInterpretation({ question, label }) {
  const stats = question.stats
  
  // Calcola il valore modale (più frequente)
  const modeEntry = Object.entries(stats.distribution).reduce((max, curr) => 
    curr[1] > max[1] ? curr : max
  )
  const modeValue = parseInt(modeEntry[0])
  const modeCount = modeEntry[1]
  const modePercentage = ((modeCount / stats.total_responses) * 100).toFixed(1)

  // Classifica la tendenza generale
  const mean = parseFloat(stats.mean)
  let tendenza = ''
  let colore = ''
  if (mean < 3) {
    tendenza = 'negativa'
    colore = '#ef4444'
  } else if (mean < 5) {
    tendenza = 'neutra'
    colore = '#f59e0b'
  } else {
    tendenza = 'positiva'
    colore = '#22c55e'
  }

  // Calcola la dispersione
  const stdDev = parseFloat(stats.std_dev)
  const iqr = stats.quartiles?.q3 && stats.quartiles?.q1 
    ? (parseFloat(stats.quartiles.q3) - parseFloat(stats.quartiles.q1)).toFixed(2)
    : 'N/A'
  
  let dispersioneText = ''
  if (stdDev < 1.5) {
    dispersioneText = 'Le risposte sono molto concentrate, indicando un forte consenso.'
  } else if (stdDev < 2.5) {
    dispersioneText = 'Le risposte mostrano una moderata dispersione, con opinioni relativamente variegate.'
  } else {
    dispersioneText = 'Le risposte sono molto disperse, evidenziando opinioni fortemente divergenti.'
  }

  // Analisi della distribuzione
  const lowValues = Object.entries(stats.distribution)
    .filter(([val, _]) => parseInt(val) <= 3)
    .reduce((sum, [_, count]) => sum + count, 0)
  const highValues = Object.entries(stats.distribution)
    .filter(([val, _]) => parseInt(val) >= 5)
    .reduce((sum, [_, count]) => sum + count, 0)
  
  const lowPercentage = ((lowValues / stats.total_responses) * 100).toFixed(1)
  const highPercentage = ((highValues / stats.total_responses) * 100).toFixed(1)

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.25rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      borderLeft: `4px solid ${colore}`
    }}>
      <h5 style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Icons.FileText className="w-4 h-4" />
        Interpretazione dei dati
      </h5>
      
      <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
        <p style={{ marginBottom: '0.75rem' }}>
          <strong>Tendenza generale:</strong> Le risposte del gruppo <strong>{label}</strong> mostrano 
          una tendenza <strong style={{ color: colore }}>{tendenza}</strong> con una media 
          di <strong>{stats.mean}</strong> e mediana di <strong>{stats.median}</strong> sulla scala 1-7.
        </p>
        
        <p style={{ marginBottom: '0.75rem' }}>
          <strong>Valore più frequente:</strong> Il valore <strong>{modeValue}</strong> è stato 
          scelto da <strong>{modeCount} rispondenti ({modePercentage}%)</strong>, rappresentando 
          l'opinione più comune.
        </p>
        
        <p style={{ marginBottom: '0.75rem' }}>
          <strong>Distribuzione delle opinioni:</strong> Il <strong>{lowPercentage}%</strong> ha espresso 
          valutazioni basse (1-3), mentre il <strong>{highPercentage}%</strong> ha dato valutazioni 
          alte (5-7). {dispersioneText}
        </p>
        
        <p style={{ marginBottom: '0' }}>
          <strong>Variabilità:</strong> La deviazione standard di <strong>{stats.std_dev}</strong> e 
          l'intervallo interquartile (IQR) di <strong>{iqr}</strong> indicano 
          {stdDev < 1.5 ? ' una forte omogeneità nelle risposte.' : 
           stdDev < 2.5 ? ' una moderata variabilità nelle opinioni.' :
           ' una significativa eterogeneità di vedute.'}
        </p>
      </div>

      {/* Sezione Discussione */}
      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1.5rem', 
        borderTop: '2px solid #e2e8f0' 
      }}>
        <h5 style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Icons.Lightbulb className="w-4 h-4" />
          Discussione
        </h5>
        
        <div style={{ fontSize: '0.875rem', lineHeight: '1.7', color: '#475569' }}>
          {/* Discussione contestualizzata in base alla tendenza */}
          {mean < 3 && (
            <>
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1e293b' }}>
                Un segnale d'allarme da non sottovalutare
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                L'analisi delle risposte del gruppo <strong>{label}</strong> su questa domanda rivela un <strong>pattern 
                critico che merita attenzione immediata</strong>. Con una media di <strong>{stats.mean}</strong> su una 
                scala 1-7 e una mediana ferma a <strong>{stats.median}</strong>, ci troviamo chiaramente nella fascia 
                bassa della valutazione. Questo non è un dato isolato: il <strong>{lowPercentage}%</strong> dei 
                rispondenti ha espresso giudizi decisamente negativi (valori 1-3), mentre solo il <strong>{highPercentage}%</strong> 
                ha dato valutazioni positive (5-7).
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                La distribuzione mostra che il valore più frequente è <strong>{modeValue}</strong>, scelto da{' '}
                <strong>{modeCount} persone su {stats.total_responses}</strong> ({modePercentage}%). Questo significa 
                che l'opinione modale del gruppo si colloca nella parte bassa della scala, confermando una percezione 
                negativa diffusa e non limitata a una minoranza.
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Implicazioni e cause possibili
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                Questo risultato solleva questioni importanti. <strong>Perché il gruppo {label} esprime valutazioni 
                così basse?</strong> Le cause potrebbero essere molteplici: esperienze negative concrete, aspettative 
                disattese, mancanza di risorse adeguate, o una reale inadeguatezza dell'oggetto valutato. La deviazione 
                standard di <strong>{stats.std_dev}</strong> {stdDev < 1.5 ? 
                  'indica un forte consenso su questa valutazione negativa, rendendo il dato ancora più significativo.' :
                  'suggerisce però che non tutti concordano: esistono sottogruppi con esperienze molto diverse, il che potrebbe indicare diseguaglianze o contesti variabili.'}
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                Se confrontiamo questo dato con altre domande o con altri gruppi di rispondenti, potremmo individuare 
                <strong> pattern sistematici</strong> che aiutano a comprendere meglio le radici del problema. È possibile 
                che questa criticità sia legata a fattori specifici (formazione, strumenti, supporto) che potrebbero 
                essere affrontati con interventi mirati.
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Raccomandazioni per l'azione
              </h6>
              <p style={{ marginBottom: '0' }}>
                Un risultato così marcatamente negativo <strong>richiede azioni concrete e tempestive</strong>. Non basta 
                prendere atto del problema: serve un'analisi più approfondita (magari qualitativa, con interviste o focus group) 
                per capire <em>cosa esattamente</em> non funziona. Solo così si possono progettare interventi efficaci che 
                affrontino le cause reali e non solo i sintomi. Ignorare questo dato significherebbe perdere un'opportunità 
                preziosa di miglioramento e rischiare di consolidare percezioni negative che potrebbero diventare sempre 
                più difficili da invertire.
              </p>
            </>
          )}

          {mean >= 3 && mean < 5 && (
            <>
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1e293b' }}>
                La zona grigia: né favorevoli né contrari
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                Le risposte del gruppo <strong>{label}</strong> si collocano in quella che potremmo definire la <strong>"zona 
                di mezzo"</strong> della scala Likert, con una media di <strong>{stats.mean}</strong> e mediana a{' '}
                <strong>{stats.median}</strong>. Questa posizione centrale è sempre la più difficile da interpretare: 
                rappresenta vera neutralità, incertezza, ambivalenza, o forse il risultato di opinioni opposte che si 
                bilanciano reciprocamente?
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                Guardando la distribuzione, vediamo che il <strong>{lowPercentage}%</strong> esprime giudizi negativi (1-3), 
                mentre il <strong>{highPercentage}%</strong> si orienta verso valutazioni positive (5-7). Il valore più 
                frequente è <strong>{modeValue}</strong> ({modePercentage}% dei rispondenti), che {modeValue === 4 ? 
                'corrisponde esattamente al punto centrale della scala, suggerendo vera neutralità per molti.' :
                'indica una leggera tendenza verso ' + (modeValue < 4 ? 'il versante negativo' : 'il versante positivo') + ' della scala.'
                }
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Interpretazione critica: cosa nasconde la media?
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                La deviazione standard di <strong>{stats.std_dev}</strong> ci dice qualcosa di importante sulla natura 
                di questa posizione centrale. {stdDev < 1.5 ? (
                  <>Con una dispersione relativamente bassa, sembra che <strong>molti rispondenti condividano effettivamente 
                  una posizione neutra o incerta</strong>. Non si tratta quindi di un compromesso numerico tra estremi opposti, 
                  ma di una genuina ambivalenza o mancanza di opinione forte. Questo potrebbe indicare che il gruppo {label} 
                  non ha ancora maturato un giudizio chiaro su questa dimensione, forse per mancanza di esperienza diretta 
                  o di informazioni sufficienti.</>
                ) : (
                  <>Con una dispersione elevata, questa media centrale <strong>maschera in realtà opinioni molto diverse</strong>. 
                  Il gruppo {label} è probabilmente <em>diviso</em>: alcuni hanno esperienze o convinzioni molto positive, 
                  altri molto negative. La "neutralità" è quindi illusoria: è il risultato matematico di posizioni polarizzate 
                  che si annullano reciprocamente nella media. Questo è un dato critico perché suggerisce l'esistenza di 
                  sottogruppi con percezioni completamente opposte.</>
                )}
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Direzioni per l'approfondimento
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                Questo tipo di risultato <strong>richiede di andare oltre i numeri</strong>. Sarebbe utile segmentare 
                i dati per identificare sottogruppi: età, esperienza, contesto, formazione ricevuta potrebbero essere 
                variabili discriminanti che spiegherebbero la dispersione. Chi sono coloro che danno valutazioni alte? 
                E chi invece le dà basse? Cosa li differenzia?
              </p>
              <p style={{ marginBottom: '0' }}>
                Dal punto di vista pratico, una posizione neutrale <strong>non è necessariamente un problema</strong>, 
                ma rappresenta un'opportunità: questi rispondenti potrebbero essere "convincibili" in una direzione o 
                nell'altra in base a nuove esperienze, informazioni, o interventi. Capire cosa potrebbe spostare l'ago 
                della bilancia verso valutazioni più positive potrebbe essere una strategia più efficace che cercare 
                di intervenire su chi ha già opinioni fortemente radicate.
              </p>
            </>
          )}

          {mean >= 5 && (
            <>
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1e293b' }}>
                Un risultato positivo: elemento di forza
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                I numeri parlano chiaro: il gruppo <strong>{label}</strong> esprime una <strong>valutazione decisamente 
                favorevole</strong> su questa dimensione. Con una media di <strong>{stats.mean}</strong> e mediana a{' '}
                <strong>{stats.median}</strong>, ci troviamo nella fascia alta della scala Likert. Il{' '}
                <strong>{highPercentage}%</strong> dei rispondenti ha dato valutazioni positive o molto positive (5-7), 
                mentre solo il <strong>{lowPercentage}%</strong> si è collocato sui valori bassi (1-3).
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                Il valore più scelto è <strong>{modeValue}</strong>, indicato da <strong>{modeCount} persone su {stats.total_responses}</strong> 
                ({modePercentage}%). Questo conferma che non si tratta di una media "gonfiata" da pochi valori estremi, 
                ma di una percezione positiva effettivamente diffusa e condivisa dal gruppo. {modeValue >= 6 ? 
                'La concentrazione su valori così alti indica addirittura un certo entusiasmo.' :
                'La massa critica si colloca su un\'opinione favorevole, anche se non necessariamente entusiastica.'}
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Quanto è solido questo consenso?
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                {stdDev < 1.5 ? (
                  <>La deviazione standard contenuta (<strong>{stats.std_dev}</strong>) è un <strong>indicatore di robustezza</strong>: 
                  non solo la valutazione è positiva, ma è anche condivisa in modo relativamente omogeneo. Questo significa 
                  che il gruppo {label} presenta un <em>consenso forte</em> su questa dimensione. Non ci sono grandi 
                  sacche di dissenso o esperienze radicalmente diverse: la maggioranza vede le cose nello stesso modo, 
                  e quel modo è positivo.</>
                ) : (
                  <>Tuttavia, la deviazione standard più elevata (<strong>{stats.std_dev}</strong>) ci invita a <strong>non 
                  essere troppo trionfalistici</strong>. Nonostante la media alta, esiste una dispersione significativa 
                  nelle risposte. Questo significa che, all'interno del gruppo {label}, ci sono sottogruppi con esperienze 
                  molto diverse. Il <strong>{lowPercentage}%</strong> che ha dato valutazioni basse non va ignorato: 
                  rappresenta una minoranza, certo, ma una minoranza che evidentemente non condivide l'entusiasmo della 
                  maggioranza. Cosa li differenzia? Hanno avuto esperienze negative? Hanno aspettative diverse? Mancano 
                  di risorse o supporto?</>
                )}
              </p>
              
              <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem', color: '#1e293b' }}>
                Capitalizzare il successo senza darlo per scontato
              </h6>
              <p style={{ marginBottom: '0.75rem' }}>
                Un risultato positivo è sempre una buona notizia, ma <strong>va gestito con intelligenza</strong>. 
                Prima di tutto, bisogna chiedersi: <em>su cosa si fonda questa percezione favorevole?</em> È il risultato 
                di esperienze concrete e positive? Di aspettative ottimistiche non ancora messe alla prova? Di un confronto 
                favorevole con situazioni precedenti peggiori? La risposta a queste domande determina quanto sia "stabile" 
                questo risultato e quanto rischi di erodersi nel tempo.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                Secondo, un buon risultato attuale <strong>non garantisce un buon risultato futuro</strong>. Le aspettative 
                tendono ad alzarsi: ciò che oggi è percepito come positivo potrebbe diventare "normale" domani, e le stesse 
                condizioni potrebbero generare valutazioni più tiepide. Mantenere una percezione positiva richiede miglioramento 
                continuo e attenzione alle esigenze emergenti del gruppo.
              </p>
              <p style={{ marginBottom: '0' }}>
                Infine, questo dato rappresenta un <strong>capitale su cui costruire</strong>. Se il gruppo {label} ha 
                una percezione favorevole su questa dimensione, può diventare un punto di leva per affrontare altre aree 
                più critiche. Ad esempio, se si fidano di uno strumento o di un processo, potrebbero essere più aperti 
                a sperimentazioni o innovazioni in altri ambiti. La chiave è non sprecare questo capitale e utilizzarlo 
                strategicamente per promuovere crescita e miglioramento continuo.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Vista dettagliata singola domanda
function DetailedQuestionView({ question, label }) {
  const color = RESPONDENT_COLORS[question.respondent_type]

  const distributionData = Object.entries(question.stats.distribution).map(([value, count]) => ({
    value: parseInt(value),
    count,
    percentage: question.stats.total_responses > 0 ? ((count / question.stats.total_responses) * 100).toFixed(1) : 0
  }))

  return (
    <div>
      <div style={{
        padding: '0.5rem',
        backgroundColor: color + '15',
        borderRadius: '4px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ fontWeight: '600', color, fontSize: '0.95rem' }}>
          {label}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Media</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{question.stats.mean}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Mediana</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{question.stats.median}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Moda</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{question.stats.mode}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Dev. Std</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{question.stats.std_dev}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="value"
            label={{ value: 'Valore', position: 'insideBottom', offset: -5 }}
          />
          <YAxis label={{ value: 'Risposte', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div style={{ backgroundColor: '#fff', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Valore {data.value}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{data.count} risposte ({data.percentage}%)</div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={LIKERT_COLORS[entry.value]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(LIKERT_COLORS).map(([val, col]) => (
          <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: col, borderRadius: '2px' }}></div>
            <span>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LikertAnalysis
