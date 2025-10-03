import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Icons } from './Icons'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function QuestionStats({ question, teacherFilter }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChart, setSelectedChart] = useState('bar')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Costruisci URL con filtro per insegnanti
      let url = `${API_URL}/api/questions/${question.respondent_type}/${question.column_index}/stats`

      // Se è una domanda insegnanti e abbiamo un filtro specifico
      if (question.respondent_type === 'teacher' && teacherFilter) {
        if (teacherFilter === 'teacher_active') {
          url += '?teacher_type=active'
        } else if (teacherFilter === 'teacher_training') {
          url += '?teacher_type=training'
        }
        // 'teacher' o 'all' = tutti gli insegnanti (default)
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.has_data) {
        setStats(data)
        setSelectedChart(data.recommended_chart || 'bar')
      } else {
        setError(data.message || 'Nessun dato disponibile')
      }
    } catch (err) {
      setError('Errore nel caricamento delle statistiche')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [question.respondent_type, question.column_index, teacherFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="question-stats-container">
        <div className="stats-loading">
          <div className="spinner-small"></div>
          <p>Caricamento statistiche...</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="question-stats-container">
        <div className="stats-error">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    if (!stats.has_data) return null

    const chartData = stats.distribution || []
    const isScaleQuestion = stats.question_info.response_format === 'scale_1_7'
    const isYesNoQuestion = stats.question_info.response_format === 'yes_no'
    const isMultipleChoiceQuestion = stats.question_info.response_format === 'multiple_choice'

    switch (selectedChart) {
      case 'bar': {
        // Calcola altezza dinamica in base al tipo di domanda
        const hasLongLabels = isMultipleChoiceQuestion || (isYesNoQuestion && chartData.some(d => d.answer?.length > 20))
        const hasManyCols = chartData.length > 6
        const useVerticalLayout = hasManyCols
        
        // Altezza dinamica: per layout verticale dipende dal numero di elementi
        const barHeight = useVerticalLayout ? Math.max(400, chartData.length * 50) : (isMultipleChoiceQuestion ? 400 : 300)
        
        const dataKey = isScaleQuestion ? "value" : (isYesNoQuestion ? "answer" : (isMultipleChoiceQuestion ? "option" : "range"))
        
        return (
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart 
              data={chartData}
              layout={useVerticalLayout ? "vertical" : "horizontal"}
              margin={{ top: 20, right: 30, bottom: useVerticalLayout ? 50 : (hasLongLabels ? 120 : 50), left: useVerticalLayout ? 200 : 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {useVerticalLayout ? (
                <>
                  <XAxis 
                    type="number"
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey={dataKey}
                    stroke="#64748b" 
                    style={{ fontSize: '0.75rem' }}
                    width={180}
                    interval={0}
                  />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey={dataKey}
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                    angle={hasLongLabels ? -45 : 0}
                    textAnchor={hasLongLabels ? "end" : "middle"}
                    height={hasLongLabels ? 100 : 30}
                    interval={0}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    style={{ fontSize: '0.75rem' }}
                    width={60}
                  />
                </>
              )}
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={useVerticalLayout ? [0, 8, 8, 0] : [8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case 'pie': {
        if (isYesNoQuestion) {
          const pieData = chartData.map(item => ({
            name: item.answer,
            value: item.count
          }))
          return (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    maxWidth: '250px'
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          )
        } else if (isScaleQuestion) {
          const pieData = chartData.filter(d => d.count > 0).map(item => ({
            name: `Valore ${item.value}`,
            value: item.count
          }))
          return (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          )
        } else if (isMultipleChoiceQuestion) {
          const pieData = chartData.map(item => ({
            name: item.option,
            value: item.count
          }))
          return (
            <ResponsiveContainer width="100%" height={450}>
              <PieChart margin={{ top: 20, right: 20, bottom: 100, left: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    maxWidth: '300px',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '0.7rem',
                    paddingTop: '20px'
                  }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconSize={10}
                  formatter={(value) => value.length > 40 ? value.substring(0, 40) + '...' : value}
                />
              </PieChart>
            </ResponsiveContainer>
          )
        }
        return <p className="text-center text-sm text-gray-500">Grafico a torta non disponibile per questo tipo di dati</p>
      }

      case 'line': {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 50, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey={isScaleQuestion ? "value" : "range"} 
                stroke="#64748b"
                style={{ fontSize: '0.75rem' }}
                interval={0}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '0.75rem' }}
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      }

      case 'histogram': {
        const hasManyCols = chartData.length > 6
        const useVerticalLayout = hasManyCols
        const histHeight = useVerticalLayout ? Math.max(400, chartData.length * 50) : 350
        
        return (
          <ResponsiveContainer width="100%" height={histHeight}>
            <BarChart
              data={chartData}
              layout={useVerticalLayout ? "vertical" : "horizontal"}
              margin={{ top: 20, right: 30, bottom: useVerticalLayout ? 50 : 100, left: useVerticalLayout ? 150 : 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {useVerticalLayout ? (
                <>
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="range"
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                    width={130}
                    interval={0}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="range"
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '0.75rem' }}
                    width={60}
                  />
                </>
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar dataKey="count" fill="#10b981" radius={useVerticalLayout ? [0, 8, 8, 0] : [8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case 'boxplot': {
        if (!stats.boxplot_data) return <p className="text-center text-sm text-gray-500">Dati box plot non disponibili</p>

        const boxData = stats.boxplot_data
        const padding = 50
        const boxWidth = 80
        const height = 400
        const width = 500

        // Calcola scala Y
        const dataMin = Math.min(boxData.min, ...(boxData.outliers || []))
        const dataMax = Math.max(boxData.max, ...(boxData.outliers || []))
        const range = dataMax - dataMin
        const yMin = dataMin - range * 0.1
        const yMax = dataMax + range * 0.1
        const yScale = (value) => height - padding - ((value - yMin) / (yMax - yMin)) * (height - 2 * padding)

        const centerX = 150

        return (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <svg width={width} height={height} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              {/* Griglia orizzontale */}
              {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
                const value = yMin + fraction * (yMax - yMin)
                const y = yScale(value)
                return (
                  <g key={i}>
                    <line x1={padding - 10} y1={y} x2={centerX + boxWidth / 2 + 20} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x={padding - 15} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{value.toFixed(1)}</text>
                  </g>
                )
              })}

              {/* Linea min-Q1 (whisker inferiore) */}
              <line x1={centerX} y1={yScale(boxData.min)} x2={centerX} y2={yScale(boxData.q1)} stroke="#3b82f6" strokeWidth={2} />
              <line x1={centerX - 15} y1={yScale(boxData.min)} x2={centerX + 15} y2={yScale(boxData.min)} stroke="#3b82f6" strokeWidth={2} />

              {/* Box (Q1-Q3) */}
              <rect
                x={centerX - boxWidth / 2}
                y={yScale(boxData.q3)}
                width={boxWidth}
                height={yScale(boxData.q1) - yScale(boxData.q3)}
                fill="#dbeafe"
                stroke="#3b82f6"
                strokeWidth={2}
              />

              {/* Mediana */}
              <line
                x1={centerX - boxWidth / 2}
                y1={yScale(boxData.median)}
                x2={centerX + boxWidth / 2}
                y2={yScale(boxData.median)}
                stroke="#ef4444"
                strokeWidth={3}
              />

              {/* Linea Q3-max (whisker superiore) */}
              <line x1={centerX} y1={yScale(boxData.q3)} x2={centerX} y2={yScale(boxData.max)} stroke="#3b82f6" strokeWidth={2} />
              <line x1={centerX - 15} y1={yScale(boxData.max)} x2={centerX + 15} y2={yScale(boxData.max)} stroke="#3b82f6" strokeWidth={2} />

              {/* Outliers */}
              {(boxData.outliers || []).map((outlier, i) => (
                <circle key={i} cx={centerX} cy={yScale(outlier)} r={4} fill="#f59e0b" stroke="#d97706" strokeWidth={1} />
              ))}

              {/* Legenda valori */}
              <g transform={`translate(${centerX + boxWidth / 2 + 40}, ${padding})`}>
                <text y={0} fontSize="11" fontWeight="600" fill="#1e293b">Valori:</text>
                <text y={20} fontSize="10" fill="#64748b">Max: {boxData.max}</text>
                <text y={35} fontSize="10" fill="#64748b">Q3: {boxData.q3}</text>
                <text y={50} fontSize="10" fill="#ef4444">Med: {boxData.median}</text>
                <text y={65} fontSize="10" fill="#64748b">Q1: {boxData.q1}</text>
                <text y={80} fontSize="10" fill="#64748b">Min: {boxData.min}</text>
                {boxData.outliers && boxData.outliers.length > 0 && (
                  <text y={100} fontSize="10" fill="#f59e0b">Outliers: {boxData.outliers.length}</text>
                )}
              </g>
            </svg>
          </div>
        )
      }

      default:
        return null
    }
  }

  const renderStatistics = () => {
    const statsList = stats.statistics || {}
    
    return (
      <div className="stats-grid">
        {statsList.mean !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Media</span>
            <span className="stat-value primary">{statsList.mean}</span>
          </div>
        )}
        {statsList.median !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Mediana</span>
            <span className="stat-value success">{statsList.median}</span>
          </div>
        )}
        {statsList.std_dev !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Dev. Standard</span>
            <span className="stat-value warning">{statsList.std_dev}</span>
          </div>
        )}
        {statsList.min !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Minimo</span>
            <span className="stat-value">{statsList.min}</span>
          </div>
        )}
        {statsList.max !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Massimo</span>
            <span className="stat-value">{statsList.max}</span>
          </div>
        )}
        {statsList.mode !== undefined && statsList.mode !== null && (
          <div className="stat-item">
            <span className="stat-label">Moda</span>
            <span className="stat-value">{statsList.mode}</span>
          </div>
        )}
        {statsList.q1 !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Q1 (25%)</span>
            <span className="stat-value">{statsList.q1}</span>
          </div>
        )}
        {statsList.q3 !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Q3 (75%)</span>
            <span className="stat-value">{statsList.q3}</span>
          </div>
        )}
        {statsList.iqr !== undefined && (
          <div className="stat-item">
            <span className="stat-label">IQR</span>
            <span className="stat-value">{statsList.iqr}</span>
          </div>
        )}
        {statsList.yes_percentage !== undefined && (
          <>
            <div className="stat-item">
              <span className="stat-label">Sì (%)</span>
              <span className="stat-value success">{statsList.yes_percentage}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">No (%)</span>
              <span className="stat-value danger">{statsList.no_percentage}%</span>
            </div>
          </>
        )}
        {statsList.total_responses !== undefined && statsList.unique_options !== undefined && (
          <>
            <div className="stat-item">
              <span className="stat-label">Risposte Totali</span>
              <span className="stat-value primary">{statsList.total_responses}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Opzioni Uniche</span>
              <span className="stat-value success">{statsList.unique_options}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Selezioni Totali</span>
              <span className="stat-value warning">{statsList.total_selections}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Media Selezioni</span>
              <span className="stat-value">{statsList.avg_selections_per_response}</span>
            </div>
            {statsList.most_selected && (
              <div className="stat-item" style={{ gridColumn: 'span 2' }}>
                <span className="stat-label">Più Selezionata</span>
                <span className="stat-value primary">{statsList.most_selected} ({statsList.most_selected_count})</span>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="question-stats-container">
      <div className="stats-header">
        <div className="stats-info">
          <Icons.Chart className="w-5 h-5" />
          <span className="stats-response-count">
            {stats.response_count} risposte
          </span>
        </div>
      </div>

      <div className="stats-body">
        {renderStatistics()}

        <div className="chart-controls">
          <label className="chart-label">Tipo di grafico:</label>
          <div className="chart-buttons">
            {stats.chart_types.map(type => (
              <button
                key={type}
                className={`chart-btn ${selectedChart === type ? 'active' : ''}`}
                onClick={() => setSelectedChart(type)}
              >
                {type === 'bar' && 'Barre'}
                {type === 'pie' && 'Torta'}
                {type === 'line' && 'Linea'}
                {type === 'histogram' && 'Istogramma'}
                {type === 'boxplot' && 'Box Plot'}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container">
          {renderChart()}
        </div>
      </div>
    </div>
  )
}

export default QuestionStats
