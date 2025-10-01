import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Icons } from './Icons'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

function QuestionStats({ question, teacherFilter }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChart, setSelectedChart] = useState('bar')

  useEffect(() => {
    fetchStats()
  }, [question, teacherFilter])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      // Costruisci URL con filtro per insegnanti
      let url = `http://localhost:8118/api/questions/${question.respondent_type}/${question.column_index}/stats`
      
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
  }

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
    const isNumericQuestion = stats.question_info.response_format === 'numeric'
    const isMultipleChoiceQuestion = stats.question_info.response_format === 'multiple_choice'

    switch (selectedChart) {
      case 'bar':
        // Calcola altezza dinamica in base al tipo di domanda
        const barHeight = isMultipleChoiceQuestion ? 400 : 300
        const hasLongLabels = isMultipleChoiceQuestion || (isYesNoQuestion && chartData.some(d => d.answer?.length > 20))
        
        return (
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, bottom: hasLongLabels ? 120 : 50, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey={isScaleQuestion ? "value" : (isYesNoQuestion ? "answer" : (isMultipleChoiceQuestion ? "option" : "range"))} 
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
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
                  label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
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
                  label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
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

      case 'line':
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

      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 100, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

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
