import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Icons } from './Icons'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

const SEGMENT_LABELS = {
  gender: 'Sesso',
  age_group: 'Fascia di Età',
  education_level: 'Titolo di Studio',
  discipline_area: 'Area Disciplinare',
  school_level: 'Livello Scolastico',
  school_type: 'Scuola Frequentata'
}

const SEGMENT_COLORS = {
  'Maschio': '#3b82f6',
  'Femmina': '#ec4899',
  'Altro o preferisco non specificare': '#a855f7',
  'STEM': '#10b981',
  'Umanistico': '#f59e0b',
  'Altro': '#6b7280',
  // Fasce età studenti (ordinate cronologicamente)
  '14-16': '#8b5cf6',
  '17-18': '#a78bfa',
  '19-20': '#06b6d4',
  '21-25': '#10b981',
  '26-30': '#f59e0b',
  '30+': '#ef4444',
  // Fasce età insegnanti
  '<25': '#8b5cf6',
  '25-34': '#06b6d4',
  '35-44': '#10b981',
  '45-54': '#f59e0b',
  '55+': '#ef4444',
  // Tipi di scuola studenti
  'Scuola Secondaria II grado': '#3b82f6',
  'Università Triennale': '#8b5cf6',
  'Università Magistrale': '#ec4899',
  'Post Laurea': '#f59e0b',
  'Scuola Primaria/Media': '#10b981'
}

const LIKERT_COLORS = {
  1: '#ef4444', // Rosso
  2: '#f97316', // Arancione
  3: '#fbbf24', // Giallo
  4: '#94a3b8', // Grigio (neutrale)
  5: '#a3e635', // Verde lime
  6: '#22c55e', // Verde
  7: '#10b981'  // Verde scuro
}

function SegmentedLikertAnalysis({ 
  questions, // Array di domande Likert
  respondentType 
}) {
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('gender')
  const [segmentData, setSegmentData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Imposta la prima domanda come default
  useEffect(() => {
    if (questions && questions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(questions[0].column_name)
    }
  }, [questions])

  useEffect(() => {
    if (selectedQuestion) {
      loadSegmentData()
    }
  }, [selectedSegment, selectedQuestion, respondentType])

  const loadSegmentData = async () => {
    if (!selectedQuestion) return
    
    try {
      setLoading(true)
      const response = await fetch(
        `${API_URL}/api/likert-segmentation?question_column=${selectedQuestion}&respondent_type=${respondentType}&segment_by=${selectedSegment}`
      )
      const data = await response.json()
      setSegmentData(data)
    } catch (error) {
      console.error('Errore nel caricamento segmentazione:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!questions || questions.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
      Nessuna domanda disponibile per questo tipo di rispondente
    </div>
  }

  const currentQuestion = questions.find(q => q.column_name === selectedQuestion)

  if (loading) {
    return <div className="loading">Caricamento analisi segmentata...</div>
  }

  if (!segmentData || !segmentData.segments || segmentData.segments.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
      Nessun dato disponibile per questa segmentazione
    </div>
  }

  // Prepara dati per i box plot
  const boxPlotData = segmentData.segments.map(seg => ({
    name: seg.segment_name,
    min: seg.min,
    q1: seg.q1,
    q2: seg.median,
    q3: seg.q3,
    max: seg.max,
    mean: seg.mean,
    n: seg.n
  }))

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.Stats className="w-5 h-5" />
          Analisi Segmentata
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          Confronto delle risposte per sottogruppi demografici tramite box plot
        </p>

        {/* Selettore Domanda */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
            Seleziona Domanda:
          </label>
          <select
            value={selectedQuestion || ''}
            onChange={(e) => setSelectedQuestion(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.875rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: '#1e293b'
            }}
          >
            {questions.map(q => (
              <option key={q.column_name} value={q.column_name}>
                {q.question_text}
              </option>
            ))}
          </select>
        </div>

        {/* Selector per tipo di segmentazione */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(SEGMENT_LABELS).map(([key, label]) => {
            // Nascondi school_level per studenti, school_type per insegnanti
            if (respondentType === 'students' && key === 'school_level') return null
            if (respondentType !== 'students' && key === 'school_type') return null
            
            return (
              <button
                key={key}
                onClick={() => setSelectedSegment(key)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: selectedSegment === key ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: selectedSegment === key ? '#eff6ff' : '#ffffff',
                  color: selectedSegment === key ? '#1e40af' : '#64748b',
                  fontWeight: selectedSegment === key ? '600' : '400',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedSegment !== key) {
                    e.target.style.backgroundColor = '#f8fafc'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSegment !== key) {
                    e.target.style.backgroundColor = '#ffffff'
                  }
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Box Plot comparativi */}
      <div style={{ marginBottom: '2rem' }}>
        <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#475569' }}>
          Box Plot per {SEGMENT_LABELS[selectedSegment]}
        </h5>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg width="100%" height="500" viewBox="0 0 800 500" style={{ minWidth: '600px' }}>
            {/* Griglia e assi */}
            <g>
              {/* Asse Y con etichette */}
              <line x1="80" y1="30" x2="80" y2="380" stroke="#cbd5e1" strokeWidth="2" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((val) => {
                const y = 380 - ((val / 7) * 350)
                return (
                  <g key={val}>
                    <line x1="75" y1={y} x2="80" y2={y} stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="80" y1={y} x2="720" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="65" y={y + 5} fontSize="13" fill="#64748b" textAnchor="end">{val}</text>
                  </g>
                )
              })}
              <text x="20" y="205" fontSize="14" fill="#475569" transform="rotate(-90 20 205)" textAnchor="middle">
                Scala Likert (1-7)
              </text>

              {/* Asse X */}
              <line x1="80" y1="380" x2="720" y2="380" stroke="#cbd5e1" strokeWidth="2" />

              {/* Box Plots */}
              {boxPlotData.map((entry, index) => {
                const color = SEGMENT_COLORS[entry.name] || '#64748b'
                const totalBoxes = boxPlotData.length
                const spacing = 640 / (totalBoxes + 1)
                const xCenter = 80 + spacing * (index + 1)
                const boxWidth = Math.min(60, spacing * 0.6)

                // Adatta dimensione font in base al numero di box
                const labelFontSize = totalBoxes > 5 ? 11 : 13
                const nFontSize = totalBoxes > 5 ? 9 : 11

                const yMin = 380 - ((entry.min / 7) * 350)
                const yQ1 = 380 - ((entry.q1 / 7) * 350)
                const yQ2 = 380 - ((entry.q2 / 7) * 350)
                const yQ3 = 380 - ((entry.q3 / 7) * 350)
                const yMax = 380 - ((entry.max / 7) * 350)
                const yMean = 380 - ((entry.mean / 7) * 350)

                // Tronca etichette troppo lunghe
                const labelText = entry.name.length > 20 ? entry.name.substring(0, 18) + '...' : entry.name

                return (
                  <g key={`box-${index}`}>
                    {/* Etichetta X - ruotata se ci sono molti segmenti */}
                    {totalBoxes > 4 ? (
                      <text 
                        x={xCenter} 
                        y="395" 
                        fontSize={labelFontSize} 
                        fill="#475569" 
                        textAnchor="end" 
                        fontWeight="500"
                        transform={`rotate(-45 ${xCenter} 395)`}
                      >
                        {labelText}
                      </text>
                    ) : (
                      <>
                        <text x={xCenter} y="405" fontSize={labelFontSize} fill="#475569" textAnchor="middle" fontWeight="500">
                          {labelText}
                        </text>
                        <text x={xCenter} y="423" fontSize={nFontSize} fill="#94a3b8" textAnchor="middle">
                          (n={entry.n})
                        </text>
                      </>
                    )}
                    {/* Se ruotato, metti (n=) sotto */}
                    {totalBoxes > 4 && (
                      <text x={xCenter} y="480" fontSize={nFontSize} fill="#94a3b8" textAnchor="middle">
                        (n={entry.n})
                      </text>
                    )}

                    {/* Whisker inferiore */}
                    <line x1={xCenter} y1={yMin} x2={xCenter} y2={yQ1} stroke={color} strokeWidth="2.5" />
                    <line x1={xCenter - 10} y1={yMin} x2={xCenter + 10} y2={yMin} stroke={color} strokeWidth="2.5" />

                    {/* Whisker superiore */}
                    <line x1={xCenter} y1={yQ3} x2={xCenter} y2={yMax} stroke={color} strokeWidth="2.5" />
                    <line x1={xCenter - 10} y1={yMax} x2={xCenter + 10} y2={yMax} stroke={color} strokeWidth="2.5" />

                    {/* Box (IQR) */}
                    <rect
                      x={xCenter - boxWidth/2}
                      y={yQ3}
                      width={boxWidth}
                      height={yQ1 - yQ3}
                      fill={color + '35'}
                      stroke={color}
                      strokeWidth="2.5"
                      rx="3"
                    />

                    {/* Mediana (linea centrale spessa) */}
                    <line
                      x1={xCenter - boxWidth/2}
                      y1={yQ2}
                      x2={xCenter + boxWidth/2}
                      y2={yQ2}
                      stroke={color}
                      strokeWidth="4"
                    />

                    {/* Media (punto rosso) */}
                    <circle
                      cx={xCenter}
                      cy={yMean}
                      r="5"
                      fill="#ef4444"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
        
        {/* Legenda */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '30px', height: '15px', border: '2px solid #64748b', borderRadius: '3px', backgroundColor: '#64748b35' }}></div>
            <span>Box (Q1-Q3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '30px', height: '3px', backgroundColor: '#64748b' }}></div>
            <span>Mediana</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid #fff' }}></div>
            <span>Media</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '2px', height: '30px', backgroundColor: '#64748b' }}></div>
            <span>Min/Max</span>
          </div>
        </div>
      </div>

      {/* Significatività statistica */}
      {segmentData.statistical_significance && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1.25rem', 
          backgroundColor: segmentData.statistical_significance.is_significant ? '#dcfce7' : '#f1f5f9',
          borderRadius: '8px',
          borderLeft: `4px solid ${segmentData.statistical_significance.is_significant ? '#10b981' : '#94a3b8'}`
        }}>
          <h5 style={{ 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Icons.TrendingUp className="w-4 h-4" />
            Test di Significatività Statistica
          </h5>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Risultato:</strong> Le differenze tra i gruppi sono <strong>{segmentData.statistical_significance.significance_level}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <strong>Kruskal-Wallis H:</strong> {segmentData.statistical_significance.kruskal_wallis_h} (p = {segmentData.statistical_significance.kruskal_wallis_p})
              </div>
              <div>
                <strong>ANOVA F:</strong> {segmentData.statistical_significance.anova_f} (p = {segmentData.statistical_significance.anova_p})
              </div>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', fontStyle: 'italic', color: '#64748b' }}>
              {segmentData.statistical_significance.is_significant 
                ? 'Le differenze osservate tra i gruppi sono statisticamente significative e non dovute al caso.'
                : 'Le differenze osservate potrebbero essere dovute al caso. Non ci sono evidenze statistiche sufficienti per concludere che i gruppi differiscano significativamente.'}
            </p>
          </div>
        </div>
      )}

      {/* Grafici dettagliati distribuzione per ogni segmento */}
      <div style={{ marginTop: '2rem' }}>
        <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#475569' }}>
          Distribuzione Dettagliata per Segmento
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {segmentData.segments.map((segment, idx) => {
            const distributionData = [1, 2, 3, 4, 5, 6, 7].map(val => ({
              value: val,
              count: segment.distribution[val] || 0,
              percentage: segment.n > 0 ? ((segment.distribution[val] || 0) / segment.n * 100).toFixed(1) : 0
            }))
            
            return (
              <div 
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: `2px solid ${SEGMENT_COLORS[segment.segment_name] || '#e2e8f0'}`
                }}
              >
                <div style={{ 
                  fontWeight: '600', 
                  marginBottom: '0.5rem', 
                  color: SEGMENT_COLORS[segment.segment_name] || '#1e293b',
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{segment.segment_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '400' }}>n={segment.n}</span>
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="value" 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Valore', position: 'insideBottom', offset: -5, fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'n', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div style={{ backgroundColor: '#fff', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: '600' }}>Valore {data.value}</div>
                              <div style={{ color: '#64748b' }}>{data.count} risposte ({data.percentage}%)</div>
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
              </div>
            )
          })}
        </div>
      </div>

      {/* Statistiche dettagliate per ogni segmento */}
      <div style={{ marginTop: '2rem' }}>
        <h5 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#475569' }}>
          Statistiche Dettagliate
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {segmentData.segments.map((segment, idx) => (
            <div 
              key={idx}
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                borderLeft: `4px solid ${SEGMENT_COLORS[segment.segment_name] || '#64748b'}`
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#1e293b', fontSize: '0.95rem' }}>
                {segment.segment_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>n:</strong> {segment.n}</div>
                  <div><strong>Media:</strong> {segment.mean}</div>
                  <div><strong>Mediana:</strong> {segment.median}</div>
                  <div><strong>Moda:</strong> {segment.mode}</div>
                  <div><strong>Dev.Std:</strong> {segment.std_dev}</div>
                  <div><strong>Min:</strong> {segment.min}</div>
                  <div><strong>Max:</strong> {segment.max}</div>
                  <div><strong>Q1:</strong> {segment.q1}</div>
                  <div><strong>Q3:</strong> {segment.q3}</div>
                </div>
              </div>
              
              {/* Mini distribuzione */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', color: '#475569' }}>
                  Distribuzione:
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.7rem' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(val => {
                    const count = segment.distribution[val] || 0
                    const percentage = segment.n > 0 ? (count / segment.n * 100).toFixed(0) : 0
                    return (
                      <div key={val} style={{ 
                        flex: 1, 
                        textAlign: 'center',
                        opacity: count > 0 ? 1 : 0.3
                      }}>
                        <div style={{ fontWeight: '600' }}>{val}</div>
                        <div>{count > 0 ? `${percentage}%` : '-'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretazione automatica */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.25rem', 
        backgroundColor: '#fffbeb', 
        borderRadius: '8px',
        borderLeft: '4px solid #f59e0b'
      }}>
        <h5 style={{ 
          fontSize: '0.9rem', 
          fontWeight: '600', 
          marginBottom: '0.75rem', 
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Icons.Lightbulb className="w-4 h-4" />
          Interpretazione dei Dati Segmentati
        </h5>
        <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569' }}>
          {segmentData.segments.length > 1 ? (
            <>
              <p style={{ marginBottom: '0.5rem' }}>
                L'analisi per <strong>{SEGMENT_LABELS[selectedSegment]}</strong> rivela differenze interessanti:
              </p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
                <li>
                  Il gruppo con la valutazione più alta è <strong>{segmentData.segments[0].segment_name}</strong> (media: {segmentData.segments[0].mean})
                </li>
                <li>
                  Il gruppo con la valutazione più bassa è <strong>{segmentData.segments[segmentData.segments.length - 1].segment_name}</strong> (media: {segmentData.segments[segmentData.segments.length - 1].mean})
                </li>
                <li>
                  Differenza tra il gruppo più alto e quello più basso: <strong>
                    {(segmentData.segments[0].mean - segmentData.segments[segmentData.segments.length - 1].mean).toFixed(2)} punti
                  </strong> sulla scala 1-7
                </li>
              </ul>
              <p style={{ marginBottom: '0' }}>
                {(segmentData.segments[0].mean - segmentData.segments[segmentData.segments.length - 1].mean) > 1 
                  ? 'Questa differenza di oltre 1 punto è significativa e merita un\'analisi più approfondita delle cause.' 
                  : 'Questa differenza è relativamente contenuta, suggerendo una certa omogeneità tra i gruppi.'}
              </p>
            </>
          ) : (
            <p>Tutti i rispondenti appartengono a un unico segmento. Prova con un'altra variabile di segmentazione.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SegmentedLikertAnalysis
