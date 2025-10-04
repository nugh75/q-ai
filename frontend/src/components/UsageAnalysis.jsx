import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ErrorBar
} from 'recharts'
import { Icons } from './Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

// Colori per i gruppi
const COLORS = {
  students: '#3b82f6',
  teachers_active: '#10b981',
  teachers_training: '#f59e0b',
  stem: '#8b5cf6',
  humanistic: '#ec4899'
}

const GENDER_COLORS = {
  'Femmina': '#ec4899',
  'Maschio': '#3b82f6',
  'Altro o preferisco non specificare': '#64748b'
}

const FACTOR_METRIC_OPTIONS = [
  { key: 'uso_quotidiano', label: "Uso quotidiano dell'IA" },
  { key: 'studio_didattica', label: 'Ore per studio/didattica' },
  { key: 'ore_settimanali', label: 'Ore settimanali di utilizzo' },
  { key: 'formazione_autoapprendimento', label: 'Formazione e autoapprendimento' },
  { key: 'ore_risparmiate', label: 'Ore risparmiate (studenti)' },
  { key: 'preparazione_lezione', label: 'Preparazione lezioni (docenti)' }
]

/**
 * Componente per analisi dettagliata dell'utilizzo dell'IA
 */
function UsageAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [factorTab, setFactorTab] = useState('age')
  const [factorMetric, setFactorMetric] = useState('uso_quotidiano')
  const [influenceUsage, setInfluenceUsage] = useState('uso_quotidiano')
  const [influenceMetric, setInfluenceMetric] = useState(null)

  useEffect(() => {
    loadUsageData()
  }, [])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_URL}/api/usage-analysis`)
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Errore caricamento dati utilizzo:', err)
      setError('Errore nel caricamento dei dati di utilizzo')
    } finally {
      setLoading(false)
    }
  }

  const metricOptions = data?.factors?.metric_labels
    ? Object.entries(data.factors.metric_labels).map(([key, label]) => ({ key, label }))
    : FACTOR_METRIC_OPTIONS

  const influenceMetricOptions = data?.influence_factors?.metric_labels
    ? Object.entries(data.influence_factors.metric_labels).map(([key, label]) => ({ key, label }))
    : []

  useEffect(() => {
    const availableUsageKeys = metricOptions.map(option => option.key)
    if (availableUsageKeys.length > 0 && !availableUsageKeys.includes(influenceUsage)) {
      setInfluenceUsage(availableUsageKeys[0])
    }
  }, [metricOptions])

  useEffect(() => {
    if (!data?.factors?.metric_labels) return
    const availableKeys = Object.keys(data.factors.metric_labels)
    if (availableKeys.length > 0 && !availableKeys.includes(factorMetric)) {
      setFactorMetric(availableKeys[0])
    }
  }, [data])

  useEffect(() => {
    if (!data?.influence_factors?.metric_labels) return
    const availableKeys = Object.keys(data.influence_factors.metric_labels)
    if (availableKeys.length > 0 && !availableKeys.includes(influenceMetric)) {
      setInfluenceMetric(availableKeys[0])
    }
  }, [data])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b', marginTop: '20px' }}>Caricamento analisi utilizzo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Icons.Warning className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Chart className="w-6 h-6" />
          Analisi dell'Utilizzo dell'Intelligenza Artificiale
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95em' }}>
          Analisi dettagliata del tempo dedicato all'IA, scopi d'uso e fattori che influenzano l'adozione
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        borderBottom: '2px solid #e2e8f0',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'overview', label: 'Panoramica', icon: Icons.Overview },
          { key: 'time', label: 'Tempo di Utilizzo', icon: Icons.Clock },
          { key: 'purposes', label: 'Scopi', icon: Icons.Category },
          { key: 'factors', label: 'Fattori di Influenza', icon: Icons.Stats },
          { key: 'influence', label: 'Fattori di Influenzamento', icon: Icons.TrendingUp }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#64748b',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
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

      {/* Content */}
      {activeTab === 'overview' && renderOverview(data)}
      {activeTab === 'time' && renderTimeAnalysis(data)}
      {activeTab === 'purposes' && renderPurposes(data)}
      {activeTab === 'factors' && renderFactors(data, factorTab, setFactorTab, factorMetric, setFactorMetric, metricOptions)}
      {activeTab === 'influence' && renderInfluenceFactors(
        data,
        influenceUsage,
        setInfluenceUsage,
        influenceMetric,
        setInfluenceMetric,
        metricOptions,
        influenceMetricOptions,
        data.influence_correlations
      )}
    </div>
  )
}

// ========== SEZIONE PANORAMICA ==========
function renderOverview(data) {
  const overviewData = data.usage_overview || {
    students: { 
      total: 0, 
      using_ai_daily: 0, percentage_daily: 0,
      using_ai_study: 0, percentage_study: 0
    },
    teachers_active: { 
      total: 0, 
      using_ai_daily: 0, percentage_daily: 0,
      using_ai_teaching: 0, percentage_teaching: 0
    },
    teachers_training: { 
      total: 0, 
      using_ai_daily: 0, percentage_daily: 0,
      using_ai_teaching: 0, percentage_teaching: 0
    }
  }

  // Dati per uso quotidiano
  const dailyUsageData = [
    { 
      name: 'Studenti', 
      usano: overviewData.students.using_ai_daily, 
      nonUsano: overviewData.students.total - overviewData.students.using_ai_daily,
      colorYes: COLORS.students,
      colorNo: '#bfdbfe'
    },
    { 
      name: 'Docenti Attivi', 
      usano: overviewData.teachers_active.using_ai_daily, 
      nonUsano: overviewData.teachers_active.total - overviewData.teachers_active.using_ai_daily,
      colorYes: COLORS.teachers_active,
      colorNo: '#bbf7d0'
    },
    { 
      name: 'In Formazione', 
      usano: overviewData.teachers_training.using_ai_daily, 
      nonUsano: overviewData.teachers_training.total - overviewData.teachers_training.using_ai_daily,
      colorYes: COLORS.teachers_training,
      colorNo: '#fde68a'
    }
  ]

  // Dati per uso studio/didattica
  const studyTeachingData = [
    { 
      name: 'Studenti', 
      usano: overviewData.students.using_ai_study, 
      nonUsano: overviewData.students.total - overviewData.students.using_ai_study,
      colorYes: COLORS.students,
      colorNo: '#bfdbfe'
    },
    { 
      name: 'Docenti Attivi', 
      usano: overviewData.teachers_active.using_ai_teaching, 
      nonUsano: overviewData.teachers_active.total - overviewData.teachers_active.using_ai_teaching,
      colorYes: COLORS.teachers_active,
      colorNo: '#bbf7d0'
    },
    { 
      name: 'In Formazione', 
      usano: overviewData.teachers_training.using_ai_teaching, 
      nonUsano: overviewData.teachers_training.total - overviewData.teachers_training.using_ai_teaching,
      colorYes: COLORS.teachers_training,
      colorNo: '#fde68a'
    }
  ]

  // Box plot data per ore quotidiane
  const hoursData = data.hours_by_group || {
    students: { daily: {}, learning_tools: {} },
    teachers_active: { daily: {}, training: {} },
    teachers_training: { daily: {}, training: {} }
  }

  const boxPlotDataDaily = [
    {
      name: 'Studenti',
      median: hoursData.students.daily.median || 0,
      mean: hoursData.students.daily.mean || 0,
      q1: hoursData.students.daily.q1 || 0,
      q3: hoursData.students.daily.q3 || 0,
      min: hoursData.students.daily.min || 0,
      max: Math.min(hoursData.students.daily.q3 + 1.5 * (hoursData.students.daily.iqr || 0), hoursData.students.daily.max || 0),
      outliers: hoursData.students.daily.outliers || [],
      color: COLORS.students
    },
    {
      name: 'Docenti Attivi',
      median: hoursData.teachers_active.daily.median || 0,
      mean: hoursData.teachers_active.daily.mean || 0,
      q1: hoursData.teachers_active.daily.q1 || 0,
      q3: hoursData.teachers_active.daily.q3 || 0,
      min: hoursData.teachers_active.daily.min || 0,
      max: Math.min(hoursData.teachers_active.daily.q3 + 1.5 * (hoursData.teachers_active.daily.iqr || 0), hoursData.teachers_active.daily.max || 0),
      outliers: hoursData.teachers_active.daily.outliers || [],
      color: COLORS.teachers_active
    },
    {
      name: 'In Formazione',
      median: hoursData.teachers_training.daily.median || 0,
      mean: hoursData.teachers_training.daily.mean || 0,
      q1: hoursData.teachers_training.daily.q1 || 0,
      q3: hoursData.teachers_training.daily.q3 || 0,
      min: hoursData.teachers_training.daily.min || 0,
      max: Math.min(hoursData.teachers_training.daily.q3 + 1.5 * (hoursData.teachers_training.daily.iqr || 0), hoursData.teachers_training.daily.max || 0),
      outliers: hoursData.teachers_training.daily.outliers || [],
      color: COLORS.teachers_training
    }
  ]

  // Box plot data per formazione/autoapprendimento
  const boxPlotDataTraining = [
    {
      name: 'Studenti',
      median: hoursData.students.learning_tools?.median || 0,
      mean: hoursData.students.learning_tools?.mean || 0,
      q1: hoursData.students.learning_tools?.q1 || 0,
      q3: hoursData.students.learning_tools?.q3 || 0,
      min: hoursData.students.learning_tools?.min || 0,
      max: Math.min(hoursData.students.learning_tools?.q3 + 1.5 * (hoursData.students.learning_tools?.iqr || 0), hoursData.students.learning_tools?.max || 0),
      outliers: hoursData.students.learning_tools?.outliers || [],
      color: COLORS.students
    },
    {
      name: 'Docenti Attivi',
      median: hoursData.teachers_active.training?.median || 0,
      mean: hoursData.teachers_active.training?.mean || 0,
      q1: hoursData.teachers_active.training?.q1 || 0,
      q3: hoursData.teachers_active.training?.q3 || 0,
      min: hoursData.teachers_active.training?.min || 0,
      max: Math.min(hoursData.teachers_active.training?.q3 + 1.5 * (hoursData.teachers_active.training?.iqr || 0), hoursData.teachers_active.training?.max || 0),
      outliers: hoursData.teachers_active.training?.outliers || [],
      color: COLORS.teachers_active
    },
    {
      name: 'In Formazione',
      median: hoursData.teachers_training.training?.median || 0,
      mean: hoursData.teachers_training.training?.mean || 0,
      q1: hoursData.teachers_training.training?.q1 || 0,
      q3: hoursData.teachers_training.training?.q3 || 0,
      min: hoursData.teachers_training.training?.min || 0,
      max: Math.min(hoursData.teachers_training.training?.q3 + 1.5 * (hoursData.teachers_training.training?.iqr || 0), hoursData.teachers_training.training?.max || 0),
      outliers: hoursData.teachers_training.training?.outliers || [],
      color: COLORS.teachers_training
    }
  ]

  return (
    <div>
      {/* Introduzione */}
      <section style={{
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#475569', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
            Questa panoramica distingue tra <strong>uso quotidiano</strong> (utilizzo dell'IA nella vita di tutti i giorni) 
            e <strong>uso per studio/didattica</strong> (utilizzo specifico per attività educative). L'analisi rivela uno 
            scenario polarizzato con utenti moderati e power users che utilizzano l'IA intensivamente.
          </div>
        </div>
      </section>

      {/* USO QUOTIDIANO */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Clock className="w-5 h-5" />
          Uso Quotidiano dell'IA
        </h3>
        
        {/* Cards Uso Quotidiano */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.students}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Studenti</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>
              {overviewData.students.percentage_daily}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.students.using_ai_daily} su {overviewData.students.total}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_active}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Insegnanti Attivi</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active, marginBottom: '5px' }}>
              {overviewData.teachers_active.percentage_daily}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.teachers_active.using_ai_daily} su {overviewData.teachers_active.total}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_training}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>In Formazione</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_training, marginBottom: '5px' }}>
              {overviewData.teachers_training.percentage_daily}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.teachers_training.using_ai_daily} su {overviewData.teachers_training.total}
            </div>
          </div>
        </div>

        {/* Grafico Uso Quotidiano */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={dailyUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Numero di rispondenti', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="usano" name="Sì, uso quotidiano">
              {dailyUsageData.map((entry, index) => (
                <Cell key={`cell-yes-${index}`} fill={entry.colorYes} />
              ))}
            </Bar>
            <Bar dataKey="nonUsano" name="No, non quotidiano">
              {dailyUsageData.map((entry, index) => (
                <Cell key={`cell-no-${index}`} fill={entry.colorNo} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* USO PER STUDIO/DIDATTICA */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Category className="w-5 h-5" />
          Uso per Studio/Didattica
        </h3>
        
        {/* Cards Uso Studio/Didattica */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.students}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Studenti (Studio)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>
              {overviewData.students.percentage_study}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.students.using_ai_study} su {overviewData.students.total}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_active}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Insegnanti Attivi (Didattica)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active, marginBottom: '5px' }}>
              {overviewData.teachers_active.percentage_teaching}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.teachers_active.using_ai_teaching} su {overviewData.teachers_active.total}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_training}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>In Formazione (Didattica)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_training, marginBottom: '5px' }}>
              {overviewData.teachers_training.percentage_teaching}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {overviewData.teachers_training.using_ai_teaching} su {overviewData.teachers_training.total}
            </div>
          </div>
        </div>

        {/* Grafico Uso Studio/Didattica */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={studyTeachingData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Numero di rispondenti', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="usano" name="Sì, per studio/didattica">
              {studyTeachingData.map((entry, index) => (
                <Cell key={`cell-yes-${index}`} fill={entry.colorYes} />
              ))}
            </Bar>
            <Bar dataKey="nonUsano" name="No, non per studio/didattica">
              {studyTeachingData.map((entry, index) => (
                <Cell key={`cell-no-${index}`} fill={entry.colorNo} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* BOX PLOT ORE SETTIMANALI */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Stats className="w-5 h-5" />
          Distribuzione Ore Settimanali di Utilizzo
        </h3>
        
        <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fbbf24' }}>
          <div style={{ fontSize: '0.9rem', color: '#92400e', lineHeight: '1.5' }}>
            Il box plot mostra la distribuzione delle ore settimanali di utilizzo per la maggioranza degli utenti. <strong>La scatola</strong> rappresenta 
            il 50% centrale dei dati (quartili Q1-Q3), <strong>la linea bianca centrale</strong> è la mediana, <strong>i baffi</strong> mostrano il range 
            normale (min-max entro 1.5×IQR). Il grafico è ottimizzato per mostrare chiaramente la distribuzione fino a 14 ore settimanali. 
            I <strong>power users (outliers)</strong> con utilizzo intensivo (fino a 56h settimanali) sono riportati nelle statistiche sottostanti.
          </div>
        </div>

        {/* Layout combinato: box plot + outliers per ogni gruppo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '25px'
        }}>
          {boxPlotDataDaily.map((group, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${group.color}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Titolo gruppo */}
              <h4 style={{
                margin: '0 0 15px 0',
                color: group.color,
                fontSize: '1.1rem',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {group.name}
              </h4>

              {/* Box Plot individuale */}
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={[group]} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="#cbd5e1" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis
                    label={{ value: 'Ore/settimana', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    domain={[0, 14]}
                    ticks={[0, 2, 4, 6, 8, 10, 12, 14]}
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '12px' }}>
                            <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>{data.name}</p>
                            <p style={{ margin: '3px 0' }}>Max: {data.max.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Q3: {data.q3.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0', fontWeight: 'bold' }}>Mediana: {data.median.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#dc2626' }}>Media ◆: {data.mean.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Q1: {data.q1.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Min: {data.min.toFixed(1)}h</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="median"
                    fill="transparent"
                    shape={(props) => {
                      return <BoxPlotShape
                        {...props}
                        q1={group.q1}
                        q3={group.q3}
                        median={group.median}
                        mean={group.mean}
                        min={group.min}
                        max={group.max}
                        fill={group.color}
                        outliers={group.outliers}
                        yAxisDomain={[0, 14]}
                      />
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Statistiche gruppo */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '15px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Mediana:</strong> {group.median.toFixed(1)}h/settimana
                </div>
                <div style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '8px', fontWeight: '500' }}>
                  <strong>Media ◆:</strong> {group.mean.toFixed(1)}h/settimana
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Range (Q1-Q3):</strong> {group.q1.toFixed(1)}h - {group.q3.toFixed(1)}h
                </div>
              </div>

              {/* Outliers */}
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fca5a5'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {group.outliers.length} outliers
                </div>
                {group.outliers.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '8px' }}>
                      <strong>Range:</strong> {Math.min(...group.outliers).toFixed(1)}h - {Math.max(...group.outliers).toFixed(1)}h/settimana
                    </div>
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: '#dc2626',
                        fontWeight: '500'
                      }}>
                        Mostra tutti ({group.outliers.length})
                      </summary>
                      <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {group.outliers.sort((a, b) => b - a).map((hours, i) => (
                          <div key={i} style={{
                            fontSize: '0.75rem',
                            color: '#92400e',
                            padding: '3px 0',
                            borderBottom: i < group.outliers.length - 1 ? '1px solid #fde68a' : 'none'
                          }}>
                            #{i + 1}: <strong>{hours.toFixed(1)}h</strong>/sett
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FORMAZIONE E AUTOAPPRENDIMENTO */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Book className="w-5 h-5" />
          Formazione e Autoapprendimento
        </h3>

        <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '0.9rem', color: '#1e40af', lineHeight: '1.5' }}>
            Ore settimanali dedicate alla formazione sull'uso dell'IA e all'apprendimento di nuovi strumenti.
            Per <strong>studenti</strong>: ore dedicate a imparare strumenti IA.
            Per <strong>insegnanti</strong>: ore dedicate a formazione e autoapprendimento sull'IA.
          </div>
        </div>

        {/* Cards Formazione */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.students}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Studenti (Strumenti IA)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>
              {hoursData.students.learning_tools?.mean?.toFixed(1) || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mediana: {hoursData.students.learning_tools?.median?.toFixed(1) || 0}h/settimana
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_active}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Insegnanti Attivi (Formazione)</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active, marginBottom: '5px' }}>
              {hoursData.teachers_active.training?.mean?.toFixed(1) || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mediana: {hoursData.teachers_active.training?.median?.toFixed(1) || 0}h/settimana
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            borderLeft: `4px solid ${COLORS.teachers_training}`
          }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>In Formazione</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_training, marginBottom: '5px' }}>
              {hoursData.teachers_training.training?.mean?.toFixed(1) || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mediana: {hoursData.teachers_training.training?.median?.toFixed(1) || 0}h/settimana
            </div>
          </div>
        </div>

        {/* Layout combinato: box plot + outliers per ogni gruppo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '25px'
        }}>
          {boxPlotDataTraining.map((group, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${group.color}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Titolo gruppo */}
              <h4 style={{
                margin: '0 0 15px 0',
                color: group.color,
                fontSize: '1.1rem',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {group.name}
              </h4>

              {/* Box Plot individuale */}
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={[group]} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="5 5" stroke="#cbd5e1" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis
                    label={{ value: 'Ore/settimana', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    domain={[0, 12]}
                    ticks={[0, 2, 4, 6, 8, 10, 12]}
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '12px' }}>
                            <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>{data.name}</p>
                            <p style={{ margin: '3px 0' }}>Max: {data.max.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Q3: {data.q3.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0', fontWeight: 'bold' }}>Mediana: {data.median.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#dc2626' }}>Media ◆: {data.mean.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Q1: {data.q1.toFixed(1)}h</p>
                            <p style={{ margin: '3px 0' }}>Min: {data.min.toFixed(1)}h</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="median"
                    fill="transparent"
                    shape={(props) => {
                      return <BoxPlotShape
                        {...props}
                        q1={group.q1}
                        q3={group.q3}
                        median={group.median}
                        mean={group.mean}
                        min={group.min}
                        max={group.max}
                        fill={group.color}
                        outliers={group.outliers}
                        yAxisDomain={[0, 12]}
                      />
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Statistiche gruppo */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '15px'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Mediana:</strong> {group.median.toFixed(1)}h/settimana
                </div>
                <div style={{ fontSize: '0.85rem', color: '#dc2626', marginBottom: '8px', fontWeight: '500' }}>
                  <strong>Media ◆:</strong> {group.mean.toFixed(1)}h/settimana
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  <strong>Range (Q1-Q3):</strong> {group.q1.toFixed(1)}h - {group.q3.toFixed(1)}h
                </div>
              </div>

              {/* Outliers */}
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fca5a5'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
                  {group.outliers.length} outliers
                </div>
                {group.outliers.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '8px' }}>
                      <strong>Range:</strong> {Math.min(...group.outliers).toFixed(1)}h - {Math.max(...group.outliers).toFixed(1)}h/settimana
                    </div>
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        color: '#dc2626',
                        fontWeight: '500'
                      }}>
                        Mostra tutti ({group.outliers.length})
                      </summary>
                      <div style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {group.outliers.sort((a, b) => b - a).map((hours, i) => (
                          <div key={i} style={{
                            fontSize: '0.75rem',
                            color: '#92400e',
                            padding: '3px 0',
                            borderBottom: i < group.outliers.length - 1 ? '1px solid #fde68a' : 'none'
                          }}>
                            #{i + 1}: <strong>{hours.toFixed(1)}h</strong>/sett
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INTERPRETAZIONE DEI DATI */}
      <section style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#334155' }}>
          Interpretazione dei Dati
        </h3>

        {/* Scenario Polarizzato */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '1.05rem' }}>
            Scenario Polarizzato dell'Utilizzo
          </h4>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: '0 0 12px 0' }}>
            I dati rivelano una <strong>netta polarizzazione</strong> nell'uso dell'intelligenza artificiale. 
            Esistono due gruppi distinti: gli <strong>utenti moderati</strong> (la maggioranza, 1-5 ore settimanali) che 
            utilizzano l'IA in modo complementare, e i <strong>power users</strong> (outliers, 10-56 ore settimanali) che 
            hanno integrato profondamente l'IA nel loro workflow quotidiano.
          </p>
          <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
            <strong style={{ color: '#991b1b' }}>Power Users identificati:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#7f1d1d' }}>
              <li><strong>Studenti:</strong> 16 outliers (range: 18-56h/settimana) - utilizzo intensivo per studio e ricerca</li>
              <li><strong>Docenti Attivi:</strong> 16 outliers (range: 10-50h/settimana) - integrazione estensiva nella didattica</li>
              <li><strong>In Formazione:</strong> 3 outliers (range: 8-10h/settimana) - sperimentazione iniziale avanzata</li>
            </ul>
          </div>
        </div>

        {/* Gap Quotidiano vs Educativo */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '1.05rem' }}>
            Gap tra Uso Quotidiano e Uso Educativo
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>Studenti</div>
              <div style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>80.1% uso quotidiano → 74.6% studio</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '5px' }}>Gap: 5.5% - uso prevalentemente educativo</div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: COLORS.teachers_active, marginBottom: '5px' }}>Docenti Attivi</div>
              <div style={{ fontSize: '0.9rem', color: '#14532d' }}>56.7% uso quotidiano → 45.0% didattica</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '5px' }}>Gap: 11.7% - resistenza all'uso didattico?</div>
            </div>
            <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: COLORS.teachers_training, marginBottom: '5px' }}>In Formazione</div>
              <div style={{ fontSize: '0.9rem', color: '#78350f' }}>51.5% uso quotidiano → 28.3% didattica</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '5px' }}>Gap: 23.2% - ancora in fase esplorativa</div>
            </div>
          </div>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: 0 }}>
            Il gap significativo, specialmente per i docenti in formazione, suggerisce <strong>barriere nell'integrazione 
            dell'IA in contesto educativo</strong>: possibile mancanza di competenze specifiche, dubbi etici, 
            o inadeguatezza degli strumenti disponibili per la didattica.
          </p>
        </div>

        {/* Differenze tra Gruppi */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '1.05rem' }}>
            Differenze tra i Gruppi
          </h4>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: '0 0 12px 0' }}>
            <strong>Studenti (mediana: 2h/settimana):</strong> Alta adozione (80%) con distribuzione molto ampia (Q1=1h, Q3=5h). 
            Generazione "AI-native" che integra naturalmente l'IA nello studio, ma con grande variabilità individuale.
          </p>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: '0 0 12px 0' }}>
            <strong>Docenti Attivi (mediana: 2h/settimana):</strong> Adozione moderata (56.7%) con distribuzione più omogenea (Q1=1h, Q3=3h). 
            Il 45% usa l'IA per la didattica, suggerendo che circa metà dei docenti è ancora in fase esplorativa o scettica sull'uso educativo.
          </p>
          <p style={{ color: '#475569', lineHeight: '1.7', margin: 0 }}>
            <strong>In Formazione (mediana: 2h/settimana):</strong> Pattern simile ai colleghi attivi ma con gap didattico più ampio (28.3%). 
            Stanno ancora costruendo le competenze necessarie per integrare efficacemente l'IA nella pratica didattica.
          </p>
        </div>

        {/* Domande di Ricerca */}
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#1e40af', marginTop: 0, marginBottom: '12px', fontSize: '1.05rem' }}>
            Domande di Ricerca Emergenti
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: '1.8' }}>
            <li><strong>Perché il gap tra uso personale e uso educativo?</strong> Mancanza di formazione specifica, dubbi etici, o inadeguatezza degli strumenti?</li>
            <li><strong>Chi sono i power users?</strong> Quali caratteristiche li distinguono? Come stanno integrando l'IA così intensivamente?</li>
            <li><strong>Come colmare il divario docenti/studenti?</strong> Gli studenti sono significativamente più avanti (80% vs 56%) - serve più formazione per i docenti?</li>
            <li><strong>Quale supporto per i docenti in formazione?</strong> Come facilitare il passaggio dall'uso personale all'uso didattico (gap del 23%)?</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

// ========== BOX PLOT COMPONENT ==========
const BoxPlotShape = (props) => {
  const {
    x,
    y,
    width,
    height,
    q1,
    q3,
    median,
    mean,
    min,
    max,
    fill,
    outliers = [],
    payload,
    yAxisDomain // Nuovo prop per passare il domain esplicito
  } = props

  const safeNumber = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback)

  const values = {
    min: safeNumber(min),
    q1: safeNumber(q1, safeNumber(median)),
    median: safeNumber(median, safeNumber((q1 + q3) / 2)),
    q3: safeNumber(q3, safeNumber(median)),
    max: safeNumber(max, safeNumber(q3))
  }

  // Usa il domain passato esplicitamente, altrimenti prova dal payload, altrimenti calcola
  let domain
  if (yAxisDomain && Array.isArray(yAxisDomain) && yAxisDomain.length === 2) {
    domain = yAxisDomain
  } else {
    const domainFromPayload = payload?.domain || payload?.domainRange
    domain = Array.isArray(domainFromPayload) && domainFromPayload.length === 2
      ? domainFromPayload
      : [0, Math.max(values.max, values.q3, 14)] // Default: usa 0 come minimo e almeno 14 come massimo
  }

  let [domainMin, domainMax] = domain
  if (!Number.isFinite(domainMin)) domainMin = 0
  if (!Number.isFinite(domainMax)) domainMax = Math.max(values.max, 14)
  if (domainMax === domainMin) {
    domainMax = domainMin + 1
  }

  const background = props.background || { x, y, width, height }
  const axisHeight = background.height || height || 0
  const baseY = (background.y ?? y) + axisHeight

  const scale = (value) => {
    if (!Number.isFinite(value)) {
      return baseY
    }
    const ratio = (value - domainMin) / (domainMax - domainMin)
    return baseY - ratio * axisHeight
  }

  const centerX = x + width / 2
  const boxWidth = width * 0.6
  const whiskerHalf = boxWidth / 2.5
  const boxTop = Math.min(scale(values.q1), scale(values.q3))
  const boxBottom = Math.max(scale(values.q1), scale(values.q3))

  const normalizedOutliers = (outliers || []).map(v => safeNumber(Number(v))).filter(v => Number.isFinite(v))

  return (
    <g>
      <line
        x1={centerX}
        y1={scale(values.min)}
        x2={centerX}
        y2={scale(values.max)}
        stroke={fill}
        strokeWidth={3}
      />

      <line
        x1={centerX - whiskerHalf}
        y1={scale(values.min)}
        x2={centerX + whiskerHalf}
        y2={scale(values.min)}
        stroke={fill}
        strokeWidth={3}
      />

      <line
        x1={centerX - whiskerHalf}
        y1={scale(values.max)}
        x2={centerX + whiskerHalf}
        y2={scale(values.max)}
        stroke={fill}
        strokeWidth={3}
      />

      <rect
        x={centerX - boxWidth / 2}
        y={boxTop}
        width={boxWidth}
        height={Math.max(boxBottom - boxTop, 0)}
        fill={fill}
        fillOpacity={0.75}
        stroke={fill}
        strokeWidth={3}
      />

      <line
        x1={centerX - boxWidth / 2}
        y1={scale(values.median)}
        x2={centerX + boxWidth / 2}
        y2={scale(values.median)}
        stroke="#ffffff"
        strokeWidth={5}
      />

      {/* Media - visualizzata come un diamante */}
      {mean !== undefined && mean !== null && (
        <g>
          <path
            d={`M ${centerX},${scale(mean) - 6} L ${centerX + 6},${scale(mean)} L ${centerX},${scale(mean) + 6} L ${centerX - 6},${scale(mean)} Z`}
            fill="#ffffff"
            stroke={fill}
            strokeWidth={2}
          />
        </g>
      )}

      {normalizedOutliers.map((value, index) => (
        <circle
          key={`outlier-${index}`}
          cx={centerX}
          cy={scale(value)}
          r={4}
          fill={fill}
          fillOpacity={0.9}
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      ))}
    </g>
  )
}

// ========== SEZIONE TEMPO DI UTILIZZO - APPROFONDIMENTO ==========
function renderTimeAnalysis(data) {
  const hoursData = data.hours_by_group || {
    students: { daily: {}, study: {}, learning_tools: {}, hours_saved: {} },
    teachers_active: { daily: {}, lesson_planning: {}, training: {} },
    teachers_training: { daily: {}, training: {} }
  }

  // Dati per box plot ore giornaliere
  const boxPlotData = [
    {
      name: 'Studenti',
      group: 'students',
      median: hoursData.students.daily.median || 0,
      q1: hoursData.students.daily.q1 || 0,
      q3: hoursData.students.daily.q3 || 0,
      min: hoursData.students.daily.min || 0,
      max: Math.min(hoursData.students.daily.q3 + 1.5 * (hoursData.students.daily.iqr || 0), hoursData.students.daily.max || 0),
      outliers: hoursData.students.daily.outliers || [],
      color: COLORS.students,
      domain: [0, 14]
    },
    {
      name: 'Docenti Attivi',
      group: 'teachers_active',
      median: hoursData.teachers_active.daily.median || 0,
      q1: hoursData.teachers_active.daily.q1 || 0,
      q3: hoursData.teachers_active.daily.q3 || 0,
      min: hoursData.teachers_active.daily.min || 0,
      max: Math.min(hoursData.teachers_active.daily.q3 + 1.5 * (hoursData.teachers_active.daily.iqr || 0), hoursData.teachers_active.daily.max || 0),
      outliers: hoursData.teachers_active.daily.outliers || [],
      color: COLORS.teachers_active,
      domain: [0, 14]
    },
    {
      name: 'In Formazione',
      group: 'teachers_training',
      median: hoursData.teachers_training.daily.median || 0,
      q1: hoursData.teachers_training.daily.q1 || 0,
      q3: hoursData.teachers_training.daily.q3 || 0,
      min: hoursData.teachers_training.daily.min || 0,
      max: Math.min(hoursData.teachers_training.daily.q3 + 1.5 * (hoursData.teachers_training.daily.iqr || 0), hoursData.teachers_training.daily.max || 0),
      outliers: hoursData.teachers_training.daily.outliers || [],
      color: COLORS.teachers_training,
      domain: [0, 14]
    }
  ]

  // Box plot data per Ore Risparmiate (Studenti)
  const hoursSavedBoxData = [{
    name: 'Studenti',
    median: hoursData.students.hours_saved.median || 0,
    q1: hoursData.students.hours_saved.q1 || 0,
    q3: hoursData.students.hours_saved.q3 || 0,
    min: hoursData.students.hours_saved.min || 0,
    max: Math.min(hoursData.students.hours_saved.q3 + 1.5 * (hoursData.students.hours_saved.iqr || 0), hoursData.students.hours_saved.max || 0),
    outliers: hoursData.students.hours_saved.outliers || [],
    color: COLORS.students,
    domain: [0, 14]
  }]

  // Box plot data per Preparazione Lezioni
  const lessonPlanningBoxData = [
    {
      name: 'Docenti Attivi',
      median: hoursData.teachers_active.lesson_planning.median || 0,
      q1: hoursData.teachers_active.lesson_planning.q1 || 0,
      q3: hoursData.teachers_active.lesson_planning.q3 || 0,
      min: hoursData.teachers_active.lesson_planning.min || 0,
      max: Math.min(hoursData.teachers_active.lesson_planning.q3 + 1.5 * (hoursData.teachers_active.lesson_planning.iqr || 0), hoursData.teachers_active.lesson_planning.max || 0),
      outliers: hoursData.teachers_active.lesson_planning.outliers || [],
      color: COLORS.teachers_active,
      domain: [0, 14]
    }
  ]

  // Box plot data per Formazione/Autoapprendimento
  const trainingBoxData = [
    {
      name: 'Docenti Attivi',
      median: hoursData.teachers_active.training.median || 0,
      q1: hoursData.teachers_active.training.q1 || 0,
      q3: hoursData.teachers_active.training.q3 || 0,
      min: hoursData.teachers_active.training.min || 0,
      max: Math.min(hoursData.teachers_active.training.q3 + 1.5 * (hoursData.teachers_active.training.iqr || 0), hoursData.teachers_active.training.max || 0),
      outliers: hoursData.teachers_active.training.outliers || [],
      color: COLORS.teachers_active,
      domain: [0, 14]
    },
    {
      name: 'In Formazione',
      median: hoursData.teachers_training.training.median || 0,
      q1: hoursData.teachers_training.training.q1 || 0,
      q3: hoursData.teachers_training.training.q3 || 0,
      min: hoursData.teachers_training.training.min || 0,
      max: Math.min(hoursData.teachers_training.training.q3 + 1.5 * (hoursData.teachers_training.training.iqr || 0), hoursData.teachers_training.training.max || 0),
      outliers: hoursData.teachers_training.training.outliers || [],
      color: COLORS.teachers_training,
      domain: [0, 14]
    }
  ]

  return (
    <div>
      {/* Introduzione */}
      <section style={{
        backgroundColor: '#f0f9ff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #bae6fd',
        marginBottom: '25px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#334155' }}>
          Approfondimento sul Tempo di Utilizzo
        </h3>
        <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>
          Questa sezione analizza nel dettaglio <strong>come viene utilizzato il tempo</strong> con l'intelligenza artificiale, 
          focalizzandosi su tre aspetti specifici: le <strong>ore risparmiate</strong> dagli studenti grazie all'IA, 
          le <strong>ore dedicate alla preparazione delle lezioni</strong> dai docenti, e il <strong>tempo investito nella formazione</strong> 
          sull'uso dell'IA.
        </p>
      </section>

      {/* 1. ORE RISPARMIATE - STUDENTI */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Student className="w-6 h-6" style={{ color: COLORS.students }} />
          Ore Risparmiate Settimanalmente - Studenti
        </h3>
        
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
          Quante ore gli studenti stimano di <strong>risparmiare ogni settimana</strong> grazie all'uso dell'intelligenza artificiale 
          nelle loro attività di studio.
        </p>

        {/* Cards statistiche */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icons.Student className="w-5 h-5" style={{ color: COLORS.students }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>Studenti</h4>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media totale:</span>
                <strong style={{ color: COLORS.students }}>{hoursData.students.daily.mean || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media (no outlier):</span>
                <strong style={{ color: COLORS.students }}>{hoursData.students.daily.mean_no_outliers || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Mediana:</span>
                <strong style={{ color: COLORS.students }}>{hoursData.students.daily.median || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Outliers:</span>
                <span style={{ color: '#ef4444' }}>{hoursData.students.daily.outliers_count || 0} casi</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icons.Teacher className="w-5 h-5" style={{ color: COLORS.teachers_active }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>Docenti Attivi</h4>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media totale:</span>
                <strong style={{ color: COLORS.teachers_active }}>{hoursData.teachers_active.daily.mean || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media (no outlier):</span>
                <strong style={{ color: COLORS.teachers_active }}>{hoursData.teachers_active.daily.mean_no_outliers || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Mediana:</span>
                <strong style={{ color: COLORS.teachers_active }}>{hoursData.teachers_active.daily.median || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Outliers:</span>
                <span style={{ color: '#ef4444' }}>{hoursData.teachers_active.daily.outliers_count || 0} casi</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #fde68a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icons.Teacher className="w-5 h-5" style={{ color: COLORS.teachers_training }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>In Formazione</h4>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media totale:</span>
                <strong style={{ color: COLORS.teachers_training }}>{hoursData.teachers_training.daily.mean || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Media (no outlier):</span>
                <strong style={{ color: COLORS.teachers_training }}>{hoursData.teachers_training.daily.mean_no_outliers || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Mediana:</span>
                <strong style={{ color: COLORS.teachers_training }}>{hoursData.teachers_training.daily.median || 0}h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Outliers:</span>
                <span style={{ color: '#ef4444' }}>{hoursData.teachers_training.daily.outliers_count || 0} casi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Box Plot - Distribuzione ore con outliers */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ color: '#334155', fontSize: '1rem', marginBottom: '10px' }}>
            Distribuzione delle ore giornaliere (Box Plot)
          </h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '15px' }}>
            Il box plot mostra la distribuzione delle ore: la linea centrale rappresenta la mediana, 
            il box contiene il 50% centrale dei dati (Q1-Q3), i baffi si estendono fino a 1.5×IQR, 
            e i punti isolati sono gli outlier (utenti intensivi).
          </p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={boxPlotData}
            margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#64748b', fontSize: 13 }}
              height={60}
            />
            <YAxis 
              label={{ value: 'Ore settimanali', angle: -90, position: 'insideLeft', fill: '#64748b' }} 
              tick={{ fill: '#64748b' }}
              domain={[0, 'dataMax']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
              labelStyle={{ color: '#334155', fontWeight: '600', marginBottom: '8px' }}
              formatter={(value, name, props) => {
                const { payload } = props
                return [
                  <div key="tooltip-content" style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
                    <div><strong>Mediana:</strong> {payload.median}h</div>
                    <div><strong>Q3 (75%):</strong> {payload.q3}h</div>
                    <div><strong>Q1 (25%):</strong> {payload.q1}h</div>
                    <div><strong>Min:</strong> {payload.min}h</div>
                    <div><strong>Max whisker:</strong> {payload.max}h</div>
                    {payload.outliers.length > 0 && (
                      <div style={{ marginTop: '6px', color: '#ef4444' }}>
                      <strong>Outliers:</strong> {payload.outliers.join(', ')}h
                        {payload.outliers.length > 5 && ` (+${payload.outliers.length - 5} altri)`}
                      </div>
                    )}
                  </div>,
                  ''
                ]
              }}
            />
            <Bar dataKey="median" shape={<BoxPlotShape />}>
              {boxPlotData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Legenda outliers */}
        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#7f1d1d' }}>
            <Icons.Warning className="w-4 h-4" style={{ color: '#ef4444' }} />
            <div>
              <strong>Power users identificati:</strong> Studenti {hoursData.students.daily.outliers_count || 0} casi (max {hoursData.students.daily.outliers?.[0] || 0}h), 
              Docenti attivi {hoursData.teachers_active.daily.outliers_count || 0} casi (max {hoursData.teachers_active.daily.outliers?.[0] || 0}h), 
              In formazione {hoursData.teachers_training.daily.outliers_count || 0} casi (max {hoursData.teachers_training.daily.outliers?.[0] || 0}h)
            </div>
          </div>
        </div>
      </section>

      {/* Attività Studenti */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icons.Student className="w-6 h-6" style={{ color: COLORS.students }} />
          <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem' }}>Tempo di Utilizzo - Studenti</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <Icons.Category className="w-5 h-5" style={{ color: COLORS.students }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Studio</h4>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>
              {hoursData.students.study.mean || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <Icons.Chart className="w-5 h-5" style={{ color: COLORS.students }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Strumenti di Apprendimento</h4>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.students, marginBottom: '5px' }}>
              {hoursData.students.learning_tools.mean || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
          </div>

          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              <Icons.Stats className="w-5 h-5" style={{ color: COLORS.teachers_active }} />
              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Tempo Risparmiato</h4>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active, marginBottom: '5px' }}>
              {hoursData.students.hours_saved.mean || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
          </div>
        </div>
      </section>

      {/* Attività Docenti */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icons.Teacher className="w-6 h-6" style={{ color: COLORS.teachers_active }} />
          <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem' }}>Tempo di Utilizzo - Docenti</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px'
        }}>
          {/* Docenti Attivi */}
          <div>
            <h4 style={{
              color: '#334155',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: COLORS.teachers_active
              }}></div>
              Docenti Attivi
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '18px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icons.Category className="w-5 h-5" style={{ color: COLORS.teachers_active }} />
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '0.95rem' }}>Progettazione Lezioni</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active }}>
                    {hoursData.teachers_active.lesson_planning.mean || 0}h
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '18px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icons.Chart className="w-5 h-5" style={{ color: COLORS.teachers_active }} />
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '0.95rem' }}>Formazione</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_active }}>
                    {hoursData.teachers_active.training.mean || 0}h
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
                </div>
              </div>
            </div>
          </div>

          {/* Docenti in Formazione */}
          <div>
            <h4 style={{
              color: '#334155',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: COLORS.teachers_training
              }}></div>
              Docenti in Formazione
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '18px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icons.Chart className="w-5 h-5" style={{ color: COLORS.teachers_training }} />
                  <span style={{ color: '#334155', fontWeight: '600', fontSize: '0.95rem' }}>Formazione</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.teachers_training }}>
                    {hoursData.teachers_training.training.mean || 0}h
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>media settimanale</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ========== SEZIONE SCOPI ==========
function renderPurposes(data) {
  const purposesData = data.purposes || {
    students: [],
    teachers_active: [],
    teachers_training: []
  }

  return (
    <div>
      {/* Studenti */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icons.Student className="w-6 h-6" style={{ color: COLORS.students }} />
          <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem' }}>Scopi di Utilizzo - Studenti</h3>
        </div>

        {purposesData.students.length > 0 ? (
          <>
            {/* Tabella */}
            <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#eff6ff', borderBottom: '2px solid #bfdbfe' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#1e40af', fontWeight: '600' }}>Scopo</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#1e40af', fontWeight: '600' }}>Utilizzi</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#1e40af', fontWeight: '600' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {purposesData.students.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#334155' }}>{item.purpose}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: '#eff6ff',
                          color: COLORS.students,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grafico */}
            <ResponsiveContainer width="100%" height={Math.max(420, purposesData.students.length * 55)}>
              <BarChart
                data={purposesData.students}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="purpose" 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value, name, props) => {
                    return [`${value} (${props.payload.percentage}%)`, 'Utilizzi']
                  }}
                />
                <Bar dataKey="count" fill={COLORS.students} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Icons.Category className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Nessun dato disponibile per gli studenti</p>
          </div>
        )}
      </section>

      {/* Docenti Attivi */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icons.Teacher className="w-6 h-6" style={{ color: COLORS.teachers_active }} />
          <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem' }}>Attività Didattiche - Docenti Attivi</h3>
        </div>

        {purposesData.teachers_active.length > 0 ? (
          <>
            {/* Tabella */}
            <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #bbf7d0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#15803d', fontWeight: '600' }}>Attività</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#15803d', fontWeight: '600' }}>Utilizzi</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#15803d', fontWeight: '600' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {purposesData.teachers_active.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#334155' }}>{item.purpose}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: '#f0fdf4',
                          color: COLORS.teachers_active,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grafico */}
            <ResponsiveContainer width="100%" height={Math.max(420, purposesData.teachers_active.length * 55)}>
              <BarChart
                data={purposesData.teachers_active}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="purpose" 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  width={190}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value, name, props) => {
                    return [`${value} (${props.payload.percentage}%)`, 'Utilizzi']
                  }}
                />
                <Bar dataKey="count" fill={COLORS.teachers_active} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Icons.Category className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Nessun dato disponibile per i docenti attivi</p>
          </div>
        )}
      </section>

      {/* Docenti in Formazione */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icons.Teacher className="w-6 h-6" style={{ color: COLORS.teachers_training }} />
          <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem' }}>Attività Didattiche - Docenti in Formazione</h3>
        </div>

        {purposesData.teachers_training.length > 0 ? (
          <>
            {/* Tabella */}
            <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#fef3c7', borderBottom: '2px solid #fde68a' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e', fontWeight: '600' }}>Attività</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#92400e', fontWeight: '600' }}>Utilizzi</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#92400e', fontWeight: '600' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {purposesData.teachers_training.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#334155' }}>{item.purpose}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: '#fef3c7',
                          color: COLORS.teachers_training,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.85rem'
                        }}>
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grafico */}
            <ResponsiveContainer width="100%" height={Math.max(420, purposesData.teachers_training.length * 55)}>
              <BarChart
                data={purposesData.teachers_training}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="purpose" 
                  tick={{ fill: '#334155', fontSize: 12 }}
                  width={190}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value, name, props) => {
                    return [`${value} (${props.payload.percentage}%)`, 'Utilizzi']
                  }}
                />
                <Bar dataKey="count" fill={COLORS.teachers_training} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Icons.Category className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Nessun dato disponibile per i docenti in formazione</p>
          </div>
        )}
      </section>

      {/* Nota informativa */}
      <section style={{
        backgroundColor: '#f0f9ff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#0369a1', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem', color: '#0c4a6e', lineHeight: '1.6' }}>
            <strong>Nota metodologica:</strong> I dati rappresentano la frequenza con cui vengono utilizzate diverse
            funzionalità dell'intelligenza artificiale. I rispondenti potevano selezionare più opzioni, quindi i totali
            possono superare il 100%. Le percentuali sono calcolate sul totale degli utilizzi riportati.
          </div>
        </div>
      </section>
    </div>
  )
}


// ========== SEZIONE FATTORI DI INFLUENZA ==========
function renderFactors(data, factorTab, setFactorTab, factorMetric, setFactorMetric, metricOptions) {
  const factorsData = data.factors || {}

  const factorTabs = [
    { key: 'age', label: 'Età', icon: Icons.Users },
    { key: 'gender', label: 'Genere', icon: Icons.Users },
    { key: 'stem', label: 'STEM vs Umanistico', icon: Icons.Category }
  ]

  const selectedMetric = metricOptions.find(option => option.key === factorMetric) || metricOptions[0] || {
    key: factorMetric,
    label: ''
  }
  const metricLabel = selectedMetric?.label || ''
  const metricLabelLower = metricLabel ? metricLabel.toLowerCase() : 'questo indicatore'

  const handleMetricChange = (key) => {
    if (factorMetric !== key) {
      setFactorMetric(key)
    }
  }

  const renderAgeAnalysis = () => {
    const metricAgeData = factorsData.age?.[factorMetric] || {}

    const allAgeData = [
      ...(metricAgeData.students || []).map(d => ({ ...d, group: 'Studenti', color: COLORS.students })),
      ...(metricAgeData.teachers_active || []).map(d => ({ ...d, group: 'Docenti Attivi', color: COLORS.teachers_active })),
      ...(metricAgeData.teachers_training || []).map(d => ({ ...d, group: 'In Formazione', color: COLORS.teachers_training }))
    ]

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#334155', marginBottom: '10px', fontSize: '1.1rem' }}>Correlazione Età - {metricLabel}</h4>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Relazione tra età e {metricLabelLower} per chi utilizza l'IA in questo contesto.
          </p>
        </div>

        {allAgeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="age"
                name="Età"
                type="number"
                label={{ value: 'Età', position: 'insideBottom', offset: -10, fill: '#64748b' }}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                dataKey="hours"
                name="Ore"
                label={{ value: 'Ore settimanali', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value, name) => {
                  if (name === 'Età') return [value, 'Età']
                  if (name === 'Ore') return [value + 'h', 'Ore settimanali']
                  return [value, name]
                }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ paddingBottom: 8 }} />
              <Scatter name="Studenti" data={metricAgeData.students || []} fill={COLORS.students} />
              <Scatter name="Docenti Attivi" data={metricAgeData.teachers_active || []} fill={COLORS.teachers_active} />
              <Scatter name="In Formazione" data={metricAgeData.teachers_training || []} fill={COLORS.teachers_training} />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <Icons.Chart className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Dati insufficienti per l'analisi dell'età</p>
          </div>
        )}
      </div>
    )
  }

  const renderGenderAnalysis = () => {
    const genderMetricData = factorsData.gender?.[factorMetric] || {}
    const genderKeys = Array.from(new Set([
      ...Object.keys(genderMetricData.students || {}),
      ...Object.keys(genderMetricData.teachers_active || {}),
      ...Object.keys(genderMetricData.teachers_training || {})
    ]))

    if (genderKeys.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <Icons.Users className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <p>Dati insufficienti per analizzare le differenze di genere</p>
        </div>
      )
    }

    const genderChartData = genderKeys.map(gender => ({
      gender,
      studenti: genderMetricData.students?.[gender]?.mean || 0,
      studenti_count: genderMetricData.students?.[gender]?.count || 0,
      docenti_attivi: genderMetricData.teachers_active?.[gender]?.mean || 0,
      docenti_attivi_count: genderMetricData.teachers_active?.[gender]?.count || 0,
      in_formazione: genderMetricData.teachers_training?.[gender]?.mean || 0,
      in_formazione_count: genderMetricData.teachers_training?.[gender]?.count || 0,
      color: GENDER_COLORS[gender] || '#94a3b8'
    }))

    const totalsByGroup = {
      students: Object.values(genderMetricData.students || {}).reduce((sum, stats) => sum + (stats.count || 0), 0),
      teachersActive: Object.values(genderMetricData.teachers_active || {}).reduce((sum, stats) => sum + (stats.count || 0), 0),
      teachersTraining: Object.values(genderMetricData.teachers_training || {}).reduce((sum, stats) => sum + (stats.count || 0), 0)
    }

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#334155', marginBottom: '10px', fontSize: '1.1rem' }}>Differenze di Genere - {metricLabel}</h4>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Ore medie settimanali per genere tra chi utilizza l'IA in questo contesto specifico.
          </p>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5f5',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#1d4ed8', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: '#1f2937', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <strong>Campione limitato:</strong> consideriamo solo chi <strong>usa l'IA</strong> per "{metricLabelLower}" e ha indicato quante ore dedica.
            Questo riduce il numero di risposte rispetto al totale degli intervistati (studenti n={totalsByGroup.students}, docenti attivi n={totalsByGroup.teachersActive}, docenti in formazione n={totalsByGroup.teachersTraining}).
          </div>
        </div>

        <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#334155', fontWeight: '600' }}>Gruppo</th>
                {genderKeys.map(gender => (
                  <th key={gender} style={{ padding: '12px', textAlign: 'center', color: '#334155', fontWeight: '600' }}>
                    {gender}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: '#334155', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.students }}></div>
                    Studenti
                  </div>
                </td>
                {genderKeys.map(gender => {
                  const stats = genderMetricData.students?.[gender] || {}
                  return (
                    <td key={gender} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                      <strong>{stats.mean || 0}h</strong>
                      <div style={{ fontSize: '0.8rem' }}>({stats.count || 0} risp.)</div>
                    </td>
                  )
                })}
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: '#334155', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.teachers_active }}></div>
                    Docenti Attivi
                  </div>
                </td>
                {genderKeys.map(gender => {
                  const stats = genderMetricData.teachers_active?.[gender] || {}
                  return (
                    <td key={gender} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                      <strong>{stats.mean || 0}h</strong>
                      <div style={{ fontSize: '0.8rem' }}>({stats.count || 0} risp.)</div>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td style={{ padding: '12px', color: '#334155', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.teachers_training }}></div>
                    In Formazione
                  </div>
                </td>
                {genderKeys.map(gender => {
                  const stats = genderMetricData.teachers_training?.[gender] || {}
                  return (
                    <td key={gender} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                      <strong>{stats.mean || 0}h</strong>
                      <div style={{ fontSize: '0.8rem' }}>({stats.count || 0} risp.)</div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {genderChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={genderChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="gender" tick={{ fill: '#64748b' }} />
              <YAxis
                label={{ value: 'Ore settimanali', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                tick={{ fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value, name, entry) => {
                  const countKey =
                    name === 'Studenti'
                      ? 'studenti_count'
                      : name === 'Docenti Attivi'
                        ? 'docenti_attivi_count'
                        : 'in_formazione_count'
                  const count = entry?.payload?.[countKey] || 0
                  return [`${value}h (n=${count})`, name]
                }}
              />
              <Bar dataKey="studenti" name="Studenti" fill={COLORS.students} radius={[8, 8, 0, 0]} />
              <Bar dataKey="docenti_attivi" name="Docenti Attivi" fill={COLORS.teachers_active} radius={[8, 8, 0, 0]} />
              <Bar dataKey="in_formazione" name="In Formazione" fill={COLORS.teachers_training} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    )
  }

  const renderStemAnalysis = () => {
    const metricStemData = factorsData.stem_vs_humanistic?.[factorMetric] || {}

    const stemData = [
      {
        group: 'Studenti',
        stem: metricStemData.students?.stem?.mean || 0,
        humanistic: metricStemData.students?.humanistic?.mean || 0,
        stem_count: metricStemData.students?.stem?.count || 0,
        humanistic_count: metricStemData.students?.humanistic?.count || 0,
        color: COLORS.students
      },
      {
        group: 'Docenti Attivi',
        stem: metricStemData.teachers_active?.stem?.mean || 0,
        humanistic: metricStemData.teachers_active?.humanistic?.mean || 0,
        stem_count: metricStemData.teachers_active?.stem?.count || 0,
        humanistic_count: metricStemData.teachers_active?.humanistic?.count || 0,
        color: COLORS.teachers_active
      },
      {
        group: 'In Formazione',
        stem: metricStemData.teachers_training?.stem?.mean || 0,
        humanistic: metricStemData.teachers_training?.humanistic?.mean || 0,
        stem_count: metricStemData.teachers_training?.stem?.count || 0,
        humanistic_count: metricStemData.teachers_training?.humanistic?.count || 0,
        color: COLORS.teachers_training
      }
    ]

    const hasStemData = stemData.some(item => (item.stem_count || 0) > 0 || (item.humanistic_count || 0) > 0)

    if (!hasStemData) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <Icons.Category className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <p>Dati insufficienti per confrontare percorsi STEM e umanistici</p>
        </div>
      )
    }

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#334155', marginBottom: '10px', fontSize: '1.1rem' }}>STEM vs Umanistico - {metricLabel}</h4>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Confronto tra percorsi STEM e umanistici per {metricLabelLower}.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {stemData.map(item => (
            <div
              key={item.group}
              style={{
                backgroundColor: item.color === COLORS.students ? '#eff6ff' : item.color === COLORS.teachers_active ? '#f0fdf4' : '#fef3c7',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid rgba(148, 163, 184, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <Icons.Info className="w-5 h-5" style={{ color: item.color }} />
                <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>{item.group}</h4>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.9rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', marginBottom: '5px' }}>STEM</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: item.color }}>
                    {item.stem || 0}h
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ({item.stem_count || 0} risp.)
                  </div>
                </div>
                <div style={{ borderLeft: '2px solid rgba(148, 163, 184, 0.4)', margin: '0 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#64748b', marginBottom: '5px' }}>Umanistico</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: item.color }}>
                    {item.humanistic || 0}h
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ({item.humanistic_count || 0} risp.)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={stemData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="group" tick={{ fill: '#64748b' }} />
            <YAxis
              label={{ value: 'Ore settimanali', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              tick={{ fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              formatter={(value, name, entry) => {
                const countKey = name === 'STEM' ? 'stem_count' : 'humanistic_count'
                const count = entry?.payload?.[countKey] || 0
                return [`${value}h (n=${count})`, name]
              }}
            />
            <Bar dataKey="stem" name="STEM" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="humanistic" name="Umanistico" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderMetricSelector = () => (
    <section style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '1.05rem' }}>
        Cosa vuoi analizzare?
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {metricOptions.map(option => (
          <button
            key={option.key}
            onClick={() => handleMetricChange(option.key)}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: factorMetric === option.key ? '2px solid #2563eb' : '1px solid #cbd5f5',
              backgroundColor: factorMetric === option.key ? '#1d4ed8' : 'white',
              color: factorMetric === option.key ? 'white' : '#1f2937',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
        <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
          <Icons.Stats className="w-6 h-6" style={{ color: '#0369a1' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#334155', fontSize: '1.5rem' }}>Fattori di Influenza</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Analisi dei fattori demografici e disciplinari che influenzano l'adozione dell'IA
          </p>
        </div>
      </div>

      {renderMetricSelector()}

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        {factorTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFactorTab(key)}
            style={{
              padding: '12px 20px',
              backgroundColor: factorTab === key ? '#eff6ff' : 'transparent',
              color: factorTab === key ? '#1e40af' : '#64748b',
              border: 'none',
              borderBottom: factorTab === key ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: factorTab === key ? '600' : '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '8px 8px 0 0'
            }}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        {factorTab === 'age' && renderAgeAnalysis()}
        {factorTab === 'gender' && renderGenderAnalysis()}
        {factorTab === 'stem' && renderStemAnalysis()}
      </section>

      <section style={{
        backgroundColor: '#f0f9ff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#0369a1', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem', color: '#0c4a6e', lineHeight: '1.6' }}>
            <strong>Nota metodologica:</strong> i dati mostrano medie e dispersioni calcolate sui soli rispondenti che hanno
            dichiarato ore dedicate al contesto selezionato. I valori possono variare sensibilmente al variare del campione
            disponibile per ciascun segmento.
          </div>
        </div>
      </section>
    </div>
  )
}

function renderInfluenceFactors(data, influenceUsage, setInfluenceUsage, influenceMetric, setInfluenceMetric, metricOptions, influenceMetricOptions, correlations) {
  const influenceData = data.influence_factors || { metric_labels: {}, metrics: {} }

  if (!influenceMetricOptions || influenceMetricOptions.length === 0 || Object.keys(influenceData.metrics || {}).length === 0) {
    return (
      <section style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <Icons.Info className="w-12 h-12" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>Nessun dato disponibile sui fattori di influenzamento</p>
      </section>
    )
  }

  const fallbackKey = influenceMetricOptions[0]?.key
  const activeKey = influenceMetric && influenceData.metrics?.[influenceMetric] ? influenceMetric : fallbackKey
  const selectedMetric = influenceData.metrics?.[activeKey] || influenceData.metrics?.[fallbackKey]
  const selectedOption = influenceMetricOptions.find(option => option.key === activeKey) || influenceMetricOptions[0]
  const metricLabel = selectedOption?.label || ''
  const metricType = selectedMetric?.type || 'scale_1_7'
  const isScaleMetric = metricType === 'scale_1_7'
  const scaleTicks = [1, 2, 3, 4, 5, 6, 7]

  const groupMeta = [
    { key: 'students', label: 'Studenti', color: COLORS.students },
    { key: 'teachers_active', label: 'Docenti Attivi', color: COLORS.teachers_active },
    { key: 'teachers_training', label: 'Docenti in Formazione', color: COLORS.teachers_training }
  ]

  const chartData = groupMeta.map(group => {
    const stats = selectedMetric?.groups?.[group.key] || {}
    return {
      group: group.label,
      mean: stats.mean || 0,
      median: stats.median || 0,
      count: stats.count || 0,
      color: group.color
    }
  })

  const hasAnyData = chartData.some(item => item.count > 0)

  const boxPlotData = groupMeta.map(group => {
    const stats = selectedMetric?.groups?.[group.key] || {}
    return {
      name: group.label,
      median: stats.median || 0,
      q1: stats.q1 || 0,
      q3: stats.q3 || 0,
      min: stats.min || 0,
      max: Math.min((stats.q3 || 0) + 1.5 * ((stats.iqr || 0)), stats.max || 0),
      outliers: stats.outliers || [],
      color: group.color
    }
  })

  const domainMin = isScaleMetric ? 1 : 0
  const domainMax = isScaleMetric ? 7 : Math.max(...boxPlotData.map(d => d.max || 0)) * 1.1

  const unitSuffix = metricType === 'hours' ? 'h' : metricType === 'scale_1_7' ? '/7' : ''

  const formatValue = (value) => {
    if (unitSuffix === 'h') return `${value.toFixed(1)}h`
    if (unitSuffix === '/7') return `${value.toFixed(1)}/7`
    return value.toFixed(1)
  }

  const handleMetricChange = (key) => {
    if (key !== influenceMetric) {
      setInfluenceMetric(key)
    }
  }

  return (
    <div>
      <section style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '1.05rem' }}>
          Quali fattori vuoi confrontare?
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {influenceMetricOptions.map(option => (
            <button
              key={option.key}
              onClick={() => handleMetricChange(option.key)}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                border: activeKey === option.key ? '2px solid #2563eb' : '1px solid #cbd5f5',
                backgroundColor: activeKey === option.key ? '#1d4ed8' : 'white',
                color: activeKey === option.key ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.TrendingUp className="w-5 h-5" style={{ color: '#1d4ed8' }} />
          <div>
            <h4 style={{ margin: 0, color: '#334155', fontSize: '1.2rem' }}>{metricLabel}</h4>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Confronto tra i gruppi su {metricLabel.toLowerCase()} ({metricType === 'hours' ? 'ore settimanali' : 'scala 1-7'}).
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#0f172a', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ color: '#1f2937', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Analizziamo solo i rispondenti che hanno fornito un punteggio o un numero di ore per questa metrica. Il campione cambia a seconda del gruppo: i valori mostrano la media e la mediana.
          </div>
        </div>

        {hasAnyData ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '15px',
              marginBottom: '25px'
            }}>
              {chartData.map(item => (
                <div key={item.group} style={{
                  backgroundColor: '#f8fafc',
                  border: `1px solid ${item.color}33`,
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                    <strong style={{ color: '#334155' }}>{item.group}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.85rem' }}>
                    <span>Media</span>
                    <strong>{formatValue(item.mean || 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.85rem', marginTop: '6px' }}>
                    <span>Mediana</span>
                    <strong>{formatValue(item.median || 0)}</strong>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '10px' }}>
                    n = {item.count}
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={boxPlotData} margin={{ top: 30, right: 40, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="5 5" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} height={60} />
                <YAxis
                  tick={{ fill: '#64748b' }}
                  label={{ value: isScaleMetric ? 'Punteggio (1-7)' : 'Ore settimanali', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                  domain={[domainMin, domainMax]}
                  ticks={isScaleMetric ? scaleTicks : undefined}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const d = payload[0].payload
                      return (
                        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', minWidth: '180px' }}>
                          <strong style={{ display: 'block', marginBottom: '6px' }}>{d.name}</strong>
                          <div style={{ fontSize: '0.85rem', color: '#1f2937', lineHeight: '1.5' }}>
                            <div>Max: {formatValue(d.max || 0)}</div>
                            <div>Q3: {formatValue(d.q3 || 0)}</div>
                            <div>Mediana: {formatValue(d.median || 0)}</div>
                            <div>Q1: {formatValue(d.q1 || 0)}</div>
                            <div>Min: {formatValue(d.min || 0)}</div>
                            <div style={{ marginTop: '6px', color: '#dc2626' }}>Outliers: {d.outliers?.length || 0}</div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar
                  dataKey="median"
                  fill="transparent"
                  name="Distribuzione"
                  shape={(props) => {
                    const dataPoint = boxPlotData[props.index]
                    if (!dataPoint) return null
                    return (
                      <BoxPlotShape
                        {...props}
                        q1={dataPoint.q1}
                        q3={dataPoint.q3}
                        median={dataPoint.median}
                        min={dataPoint.min}
                        max={dataPoint.max}
                        fill={dataPoint.color}
                        outliers={dataPoint.outliers}
                      />
                    )
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
            <Icons.AlertCircle className="w-12 h-12" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p>Il campione disponibile è troppo ridotto per visualizzare questa metrica.</p>
          </div>
        )}
      </section>

      <section style={{
        backgroundColor: '#eef2ff',
        padding: '18px',
        borderRadius: '8px',
        border: '1px solid #c7d2fe',
        color: '#312e81'
      }}>
        <strong style={{ display: 'block', marginBottom: '6px' }}>Suggerimento di analisi</strong>
        <span>
          Confronta questa metrica con gli scopi di utilizzo e con le ore settimanali nella sezione precedente per individuare possibili leve (formazione, fiducia o preoccupazioni) su cui intervenire.
        </span>
      </section>
    </div>
  )
}


export default UsageAnalysis
