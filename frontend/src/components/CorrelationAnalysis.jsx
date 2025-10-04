import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { Icons } from './Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

const COLORS = {
  students: '#3b82f6',
  teachers_active: '#10b981',
  teachers_training: '#f59e0b'
}

// Etichette leggibili per i fattori Likert
const FACTOR_LABELS = {
  // Studenti
  'practical_competence': 'Competenza pratica',
  'theoretical_competence': 'Competenza teorica',
  'ai_change_study': 'IA cambia studio',
  'training_adequacy': 'Adeguatezza formazione',
  'trust_integration': 'Fiducia integrazione',
  'teacher_preparation': 'Preparazione docenti',
  'concern_ai_school': 'Preoccupazione IA scuola',
  'concern_ai_peers': 'Preoccupazione IA compagni',

  // Insegnanti
  'ai_change_teaching': 'IA cambia didattica',
  'ai_change_my_teaching': 'IA cambia mia didattica',
  'trust_students_responsible': 'Fiducia studenti responsabili',
  'concern_ai_education': 'Preoccupazione IA educazione',
  'concern_ai_students': 'Preoccupazione IA studenti'
}

// Etichette per variabili di utilizzo
const USAGE_LABELS = {
  'uses_ai_daily': 'Uso quotidiano IA',
  'hours_daily': 'Ore settimanali utilizzo',
  'hours_study': 'Ore studio con IA',
  'hours_saved': 'Ore risparmiate',
  'hours_training': 'Ore formazione/autoapprendimento',
  'hours_lesson_planning': 'Ore preparazione lezioni'
}

/**
 * Componente per analisi delle correlazioni tra fattori Likert e variabili di utilizzo
 */
function CorrelationAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeGroup, setActiveGroup] = useState('students')
  const [selectedUsageVar, setSelectedUsageVar] = useState('uses_ai_daily')
  const [activeTab, setActiveTab] = useState('significative') // 'significative' o 'dettagli'

  useEffect(() => {
    loadCorrelationData()
  }, [])

  const loadCorrelationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_URL}/api/correlations`)
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Errore caricamento dati correlazioni:', err)
      setError('Errore nel caricamento dei dati di correlazione')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Caricamento analisi correlazioni...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc2626' }}>
        <p>{error}</p>
        <button onClick={loadCorrelationData}>Riprova</button>
      </div>
    )
  }

  if (!data) {
    return <div style={{ padding: '20px' }}>Nessun dato disponibile</div>
  }

  // Prepara dati per il gruppo selezionato
  const groupData = data[activeGroup]
  if (!groupData || !groupData.correlations) {
    return <div style={{ padding: '20px' }}>Nessuna correlazione disponibile per questo gruppo</div>
  }

  // Estrae variabili di utilizzo disponibili per il gruppo selezionato
  const availableUsageVars = new Set()
  Object.values(groupData.correlations).forEach(factorCorrs => {
    Object.keys(factorCorrs).forEach(usageVar => availableUsageVars.add(usageVar))
  })

  const usageVarOptions = Array.from(availableUsageVars).map(key => ({
    key,
    label: USAGE_LABELS[key] || key
  }))

  // Prepara dati per il grafico a barre (fattori vs variabile di utilizzo selezionata)
  const barChartData = Object.entries(groupData.correlations)
    .filter(([, usageCorrs]) => usageCorrs[selectedUsageVar])
    .map(([factorName, usageCorrs]) => ({
      name: FACTOR_LABELS[factorName] || factorName,
      coefficient: usageCorrs[selectedUsageVar].coefficient,
      strength: usageCorrs[selectedUsageVar].strength,
      n_samples: usageCorrs[selectedUsageVar].n_samples
    }))
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))

  // Colore barra in base alla direzione
  const getBarColor = (coefficient) => {
    if (coefficient > 0) return '#10b981' // verde per correlazione positiva
    return '#ef4444' // rosso per correlazione negativa
  }

  // Tooltip personalizzato
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div style={{
          background: 'white',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{item.name}</p>
          <p style={{ margin: '0', color: getBarColor(item.coefficient) }}>
            Coefficiente: {item.coefficient}
          </p>
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
            {item.strength}
          </p>
          <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
            Campioni: {item.n_samples}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Icons.TrendingUp size={32} />
          Analisi Correlazioni
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b' }}>
          Correlazioni tra fattori di influenzamento (scala Likert 1-7) e variabili di utilizzo dell'IA
        </p>
      </header>

      {/* Tab per selezione gruppo */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveGroup('students')}
          style={{
            padding: '10px 20px',
            border: activeGroup === 'students' ? '2px solid #3b82f6' : '1px solid #ddd',
            background: activeGroup === 'students' ? '#eff6ff' : 'white',
            color: activeGroup === 'students' ? '#1e40af' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeGroup === 'students' ? 'bold' : 'normal'
          }}
        >
          Studenti ({data.students?.total_students || 0})
        </button>
        <button
          onClick={() => setActiveGroup('teachers_active')}
          style={{
            padding: '10px 20px',
            border: activeGroup === 'teachers_active' ? '2px solid #10b981' : '1px solid #ddd',
            background: activeGroup === 'teachers_active' ? '#ecfdf5' : 'white',
            color: activeGroup === 'teachers_active' ? '#065f46' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeGroup === 'teachers_active' ? 'bold' : 'normal'
          }}
        >
          Insegnanti Attivi ({data.teachers_active?.total_teachers || 0})
        </button>
        <button
          onClick={() => setActiveGroup('teachers_in_training')}
          style={{
            padding: '10px 20px',
            border: activeGroup === 'teachers_in_training' ? '2px solid #f59e0b' : '1px solid #ddd',
            background: activeGroup === 'teachers_in_training' ? '#fffbeb' : 'white',
            color: activeGroup === 'teachers_in_training' ? '#92400e' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeGroup === 'teachers_in_training' ? 'bold' : 'normal'
          }}
        >
          Insegnanti in Formazione ({data.teachers_in_training?.total_teachers || 0})
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('significative')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'significative' ? '3px solid #8b5cf6' : '3px solid transparent',
              background: activeTab === 'significative' ? '#f5f3ff' : 'transparent',
              color: activeTab === 'significative' ? '#6d28d9' : '#64748b',
              fontWeight: activeTab === 'significative' ? '600' : 'normal',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Correlazioni Più Significative
          </button>
          <button
            onClick={() => setActiveTab('dettagli')}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderBottom: activeTab === 'dettagli' ? '3px solid #8b5cf6' : '3px solid transparent',
              background: activeTab === 'dettagli' ? '#f5f3ff' : 'transparent',
              color: activeTab === 'dettagli' ? '#6d28d9' : '#64748b',
              fontWeight: activeTab === 'dettagli' ? '600' : 'normal',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Correlazioni con...
          </button>
        </div>
      </div>

      {/* Tab: Correlazioni Più Significative */}
      {activeTab === 'significative' && (
        <section style={{
          marginBottom: '30px',
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #8b5cf6'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.TrendingUp className="w-6 h-6" />
            Correlazioni Più Significative
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            Tutte le correlazioni ordinate per intensità (valore assoluto del coefficiente)
          </p>

          {(() => {
            // Raccoglie tutte le correlazioni e le ordina per valore assoluto
            const allCorrelations = []
            Object.entries(groupData.correlations).forEach(([factorName, usageCorrs]) => {
              Object.entries(usageCorrs).forEach(([usageVar, corrData]) => {
                allCorrelations.push({
                  factor: FACTOR_LABELS[factorName] || factorName,
                  factorKey: factorName,
                  usageVar: USAGE_LABELS[usageVar] || usageVar,
                  usageVarKey: usageVar,
                  coefficient: corrData.coefficient,
                  absCoefficient: Math.abs(corrData.coefficient),
                  strength: corrData.strength,
                  n_samples: corrData.n_samples
                })
              })
            })

            // Ordina per valore assoluto decrescente
            allCorrelations.sort((a, b) => b.absCoefficient - a.absCoefficient)

            const getStrengthBadge = (strength) => {
              if (strength.includes('forte')) return { bg: '#dbeafe', color: '#1e40af', text: 'Forte' }
              if (strength.includes('moderata')) return { bg: '#d1fae5', color: '#065f46', text: 'Moderata' }
              if (strength.includes('debole') && !strength.includes('molto')) return { bg: '#fef3c7', color: '#92400e', text: 'Debole' }
              return { bg: '#f1f5f9', color: '#64748b', text: 'Molto debole' }
            }

            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f5f3ff', borderBottom: '2px solid #8b5cf6' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6d28d9' }}>Posizione</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6d28d9' }}>Fattore Likert</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6d28d9' }}>Variabile Utilizzo</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#6d28d9' }}>Coefficiente</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#6d28d9' }}>Direzione</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#6d28d9' }}>Intensità</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#6d28d9' }}>Campioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCorrelations.map((corr, index) => {
                      const badge = getStrengthBadge(corr.strength)
                      const isPositive = corr.coefficient > 0

                      return (
                        <tr key={`${corr.factorKey}-${corr.usageVarKey}`} style={{
                          borderBottom: '1px solid #e5e7eb',
                          background: index % 2 === 0 ? 'white' : '#fafafa',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafafa'}
                        >
                          <td style={{ padding: '12px', fontWeight: '600', color: '#8b5cf6', fontSize: '16px' }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>
                            {corr.factor}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '500' }}>
                            {corr.usageVar}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: isPositive ? '#dcfce7' : '#fee2e2',
                              color: isPositive ? '#166534' : '#991b1b',
                              fontWeight: 'bold',
                              fontSize: '15px'
                            }}>
                              {corr.coefficient.toFixed(3)}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: isPositive ? '#dcfce7' : '#fee2e2',
                              color: isPositive ? '#166534' : '#991b1b',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              {isPositive ? '↑' : '↓'} {isPositive ? 'Positiva' : 'Negativa'}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: badge.bg,
                              color: badge.color,
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {badge.text}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                            {corr.n_samples}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </section>
      )}

      {/* Tab: Correlazioni con... (dettagli) */}
      {activeTab === 'dettagli' && (
        <>
          {/* Selezione variabile di utilizzo */}
          <div style={{
            marginBottom: '30px',
            padding: '15px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#334155'
            }}>
              Variabile di utilizzo:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                value={selectedUsageVar}
                onChange={(e) => setSelectedUsageVar(e.target.value)}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  width: '100%',
                  maxWidth: '400px',
                  cursor: 'pointer',
                  color: '#1e293b',
                  fontWeight: '500'
                }}
              >
                {usageVarOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div style={{
                padding: '10px 16px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1e40af',
                fontWeight: '600'
              }}>
                {USAGE_LABELS[selectedUsageVar] || selectedUsageVar}
              </div>
            </div>
          </div>

          {/* Grafico a barre delle correlazioni */}
          <section style={{
            marginBottom: '30px',
            padding: '20px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
              Correlazioni con: {USAGE_LABELS[selectedUsageVar] || selectedUsageVar}
            </h2>

            {barChartData.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Nessuna correlazione disponibile per questa variabile</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 150, right: 30, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[-1, 1]}
                      ticks={[-1, -0.5, 0, 0.5, 1]}
                      label={{ value: 'Coefficiente di correlazione', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis type="category" dataKey="name" width={140} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="coefficient" fill="#3b82f6">
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.coefficient)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Legenda interpretazione */}
                <div style={{ marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                  <p style={{ marginBottom: '5px' }}>
                    <strong>Interpretazione:</strong>
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li><span style={{ color: '#10b981' }}>Verde</span>: correlazione positiva (all'aumentare di un fattore, aumenta anche l'altra variabile)</li>
                    <li><span style={{ color: '#ef4444' }}>Rosso</span>: correlazione negativa (all'aumentare di un fattore, diminuisce l'altra variabile)</li>
                    <li>|r| ≥ 0.7: correlazione forte</li>
                    <li>0.4 ≤ |r| &lt; 0.7: correlazione moderata</li>
                    <li>0.2 ≤ |r| &lt; 0.4: correlazione debole</li>
                    <li>|r| &lt; 0.2: correlazione molto debole</li>
                  </ul>
                </div>
              </>
            )}
          </section>

          {/* Tabella dettagliata delle correlazioni */}
          <section style={{
            padding: '20px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
              Dettaglio correlazioni
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Fattore</th>
                    {usageVarOptions.map(option => (
                      <th key={option.key} style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>
                        {option.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupData.correlations).map(([factorName, usageCorrs], index) => (
                    <tr key={factorName} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '10px', fontWeight: '500' }}>
                        {FACTOR_LABELS[factorName] || factorName}
                      </td>
                      {usageVarOptions.map(option => {
                        const corr = usageCorrs[option.key]
                        if (!corr) {
                          return <td key={option.key} style={{ padding: '10px', textAlign: 'center', color: '#9ca3af' }}>-</td>
                        }
                        return (
                          <td key={option.key} style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{
                              color: corr.coefficient > 0 ? '#10b981' : '#ef4444',
                              fontWeight: Math.abs(corr.coefficient) >= 0.4 ? 'bold' : 'normal'
                            }}>
                              {corr.coefficient.toFixed(3)}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {corr.strength}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Info e suggerimenti */}
      <section style={{
        marginTop: '30px',
        padding: '15px',
        background: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #c7d2fe',
        color: '#312e81'
      }}>
        <strong style={{ display: 'block', marginBottom: '6px' }}>Note metodologiche</strong>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
          <li>Le correlazioni sono calcolate usando il coefficiente di Pearson</li>
          <li>Vengono considerati solo i casi con valori validi per entrambe le variabili</li>
          <li>Il numero minimo di campioni per calcolare una correlazione è 3</li>
          <li>Una correlazione significativa non implica necessariamente causalità</li>
        </ul>
      </section>
    </div>
  )
}

export default CorrelationAnalysis
