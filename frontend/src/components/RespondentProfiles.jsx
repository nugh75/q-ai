import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Icons } from './Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

// Colori per le categorie
const COLORS = {
  students: '#3b82f6',
  teachers_active: '#10b981',
  teachers_training: '#f59e0b'
}

const GENDER_COLORS = {
  'Femmina': '#ec4899',
  'Maschio': '#3b82f6',
  'Altro o preferisco non specificare': '#6b7280'
}

// Funzioni di utilità per il download
const downloadSVG = (svgId, filename) => {
  const svg = document.getElementById(svgId)
  if (!svg) return
  
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const downloadPNG = (svgId, filename) => {
  const svg = document.getElementById(svgId)
  if (!svg) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const svgData = new XMLSerializer().serializeToString(svg)
  const img = new Image()
  
  canvas.width = svg.width.baseVal.value * 2
  canvas.height = svg.height.baseVal.value * 2
  ctx.scale(2, 2)
  
  img.onload = () => {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    })
  }
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

const downloadCSV = (data, headers, filename) => {
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const value = row[h]
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    }).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Componente per visualizzare profili demografici dei rispondenti
 * Confronta studenti, insegnanti attivi e insegnanti in formazione
 */
function RespondentProfiles() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    students: false,
    teachers_active: false,
    teachers_training: false
  })
  const [hoveredBox, setHoveredBox] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadDemographics()
  }, [])

  const loadDemographics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/demographics`)
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Errore caricamento dati demografici:', err)
      setError('Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ color: '#64748b', marginTop: '20px' }}>Caricamento profili demografici...</p>
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

  // Prepara dati per grafici comparativi
  const totalData = [
    { name: 'Studenti', value: data.totals.students, color: COLORS.students },
    { name: 'Insegnanti', value: data.totals.teachers_active, color: COLORS.teachers_active },
    { name: 'In Formazione', value: data.totals.teachers_training, color: COLORS.teachers_training }
  ]

  // Dati età comparativa con quartili e outliers
  const ageData = [
    {
      category: 'Studenti',
      avg: data.students.age?.avg ?? 0,
      min: data.students.age?.min ?? 0,
      max: data.students.age?.max ?? 0,
      q1: data.students.age?.q1 ?? data.students.age?.min ?? 0,
      median: data.students.age?.median ?? data.students.age?.avg ?? 0,
      q3: data.students.age?.q3 ?? data.students.age?.max ?? 0,
      whiskerLow: data.students.age?.whisker_low ?? data.students.age?.min ?? 0,
      whiskerHigh: data.students.age?.whisker_high ?? data.students.age?.max ?? 0,
      outliers: data.students.age?.outliers ?? [],
      total: data.students.age?.total ?? 0
    },
    {
      category: 'Insegnanti',
      avg: data.teachers_active.age?.avg ?? 0,
      min: data.teachers_active.age?.min ?? 0,
      max: data.teachers_active.age?.max ?? 0,
      q1: data.teachers_active.age?.q1 ?? data.teachers_active.age?.min ?? 0,
      median: data.teachers_active.age?.median ?? data.teachers_active.age?.avg ?? 0,
      q3: data.teachers_active.age?.q3 ?? data.teachers_active.age?.max ?? 0,
      whiskerLow: data.teachers_active.age?.whisker_low ?? data.teachers_active.age?.min ?? 0,
      whiskerHigh: data.teachers_active.age?.whisker_high ?? data.teachers_active.age?.max ?? 0,
      outliers: data.teachers_active.age?.outliers ?? [],
      total: data.teachers_active.age?.total ?? 0
    },
    {
      category: 'In Formazione',
      avg: data.teachers_training.age?.avg ?? 0,
      min: data.teachers_training.age?.min ?? 0,
      max: data.teachers_training.age?.max ?? 0,
      q1: data.teachers_training.age?.q1 ?? data.teachers_training.age?.min ?? 0,
      median: data.teachers_training.age?.median ?? data.teachers_training.age?.avg ?? 0,
      q3: data.teachers_training.age?.q3 ?? data.teachers_training.age?.max ?? 0,
      whiskerLow: data.teachers_training.age?.whisker_low ?? data.teachers_training.age?.min ?? 0,
      whiskerHigh: data.teachers_training.age?.whisker_high ?? data.teachers_training.age?.max ?? 0,
      outliers: data.teachers_training.age?.outliers ?? [],
      total: data.teachers_training.age?.total ?? 0
    }
  ]

  // Dati genere per studenti
  const studentsGenderData = Object.entries(data.students.gender.distribution || {}).map(([name, value]) => ({
    name: name.substring(0, 20),
    value,
    percentage: data.students.gender.percentages[name]
  }))

  const teachersActiveGenderData = Object.entries(data.teachers_active.gender.distribution || {}).map(([name, value]) => ({
    name: name.substring(0, 20),
    value,
    percentage: data.teachers_active.gender.percentages[name]
  }))

  const teachersTrainingGenderData = Object.entries(data.teachers_training.gender.distribution || {}).map(([name, value]) => ({
    name: name.substring(0, 20),
    value,
    percentage: data.teachers_training.gender.percentages[name]
  }))

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Student className="w-6 h-6" />
          Profili Demografici Rispondenti
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95em' }}>
          Confronto delle caratteristiche demografiche tra studenti, insegnanti attivi e insegnanti in formazione
        </p>
      </div>

      {/* Overview Totali */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Overview className="w-5 h-5" />
          Distribuzione Totale Rispondenti
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {totalData.map(item => (
            <div key={item.name} style={{
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              borderLeft: `4px solid ${item.color}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>
                {((item.value / data.totals.all) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
          <div style={{
            padding: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            borderLeft: '4px solid #0ea5e9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>
              {data.totals.all}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
              Totale Rispondenti
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={totalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {totalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tabella Totali */}
        <div style={{ marginTop: '25px', overflowX: 'auto' }}>
          <h4 style={{ marginBottom: '15px', color: '#334155' }}>Tabella Dati Totali</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Categoria</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Percentuale</th>
              </tr>
            </thead>
            <tbody>
              {totalData.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '12px', fontWeight: '600', color: item.color }}>{item.name}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{item.value}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{((item.value / data.totals.all) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f0f9ff', fontWeight: '600' }}>
                <td style={{ padding: '12px', color: '#0ea5e9' }}>Totale</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#0ea5e9' }}>{data.totals.all}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#0ea5e9' }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pulsanti Download Totali */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const csvData = totalData.map(item => ({
                Categoria: item.name,
                Numero: item.value,
                Percentuale: ((item.value / data.totals.all) * 100).toFixed(1) + '%'
              }))
              csvData.push({ Categoria: 'Totale', Numero: data.totals.all, Percentuale: '100%' })
              downloadCSV(csvData, ['Categoria', 'Numero', 'Percentuale'], 'totali-rispondenti.csv')
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icons.Save className="w-4 h-4" />
            Scarica Dati CSV
          </button>
        </div>
      </section>

      {/* Confronto Età con Box Plot */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155' }}>
          Confronto Età Media con Outliers (Box Plot)
        </h3>
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', display: 'flex', gap: '10px' }}>
          <Icons.Info className="w-5 h-5" style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.9em', color: '#64748b', margin: 0 }}>
            Il box plot mostra quartili (riquadro), mediana (linea rossa), media (rombo scuro), baffi (limiti calcolati con IQR) e punti per ogni outlier.
            Sotto al grafico trovi un report dettagliato con la spiegazione degli outliers per ogni gruppo.
          </p>
        </div>
        
        {/* Box Plot SVG */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', overflowX: 'auto', position: 'relative' }}>
          <svg 
            id="age-boxplot-svg" 
            width={Math.max(1000, ageData.length * 350)} 
            height={550} 
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}
          >
            {(() => {
              const padding = 80
              const boxWidth = 160
              const height = 550
              const width = Math.max(1000, ageData.length * 350)
              const groupSpacing = width / (ageData.length + 1)

              // Calcola scala Y globale per tutti i dati
              const allValues = ageData.flatMap(d => [d.min, d.max, d.q1, d.q3, d.median, ...(d.outliers || [])])
              const dataMin = Math.min(...allValues)
              const dataMax = Math.max(...allValues)
              const range = dataMax - dataMin
              const yMin = Math.max(0, dataMin - range * 0.1)
              const yMax = dataMax + range * 0.1
              const yScale = (value) => height - padding - ((value - yMin) / (yMax - yMin)) * (height - 2 * padding)

              const colors = [COLORS.students, COLORS.teachers_active, COLORS.teachers_training]

              return (
                <>
                  {/* Griglia orizzontale - ogni 4 anni */}
                  {(() => {
                    const minAge = Math.floor(yMin / 4) * 4 // Arrotonda a multiplo di 4
                    const maxAge = Math.ceil(yMax / 4) * 4
                    const gridLines = []
                    for (let age = minAge; age <= maxAge; age += 4) {
                      const y = yScale(age)
                      gridLines.push(
                        <g key={age}>
                          <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <text x={padding - 10} y={y + 5} textAnchor="end" fontSize="13" fill="#64748b">{age}</text>
                        </g>
                      )
                    }
                    return gridLines
                  })()}

                  {/* Label asse Y */}
                  <text x={20} y={height / 2} textAnchor="middle" fontSize="14" fontWeight="600" fill="#64748b" transform={`rotate(-90, 20, ${height / 2})`}>
                    Età (anni)
                  </text>

                  {/* Box plots per ogni gruppo */}
                  {ageData.map((group, idx) => {
                    const centerX = groupSpacing * (idx + 1)
                    const color = colors[idx]
                    const fillColor = color + '30' // aggiunge trasparenza
                    const isHovered = hoveredBox === idx

                    return (
                      <g key={idx}>
                        {/* Area invisibile per hover più ampia */}
                        <rect
                          x={centerX - boxWidth}
                          y={padding}
                          width={boxWidth * 2}
                          height={height - 2 * padding}
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => {
                            setHoveredBox(idx)
                            setTooltipPos({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseMove={(e) => {
                            setTooltipPos({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseLeave={() => setHoveredBox(null)}
                        />

                        {/* Whisker inferiore */}
                        <line x1={centerX} y1={yScale(group.whiskerLow)} x2={centerX} y2={yScale(group.q1)} stroke={color} strokeWidth={isHovered ? 4 : 3} />
                        <line x1={centerX - 25} y1={yScale(group.whiskerLow)} x2={centerX + 25} y2={yScale(group.whiskerLow)} stroke={color} strokeWidth={isHovered ? 4 : 3} />

                        {/* Box (Q1-Q3) */}
                        <rect
                          x={centerX - boxWidth / 2}
                          y={yScale(group.q3)}
                          width={boxWidth}
                          height={yScale(group.q1) - yScale(group.q3)}
                          fill={isHovered ? (color + '50') : fillColor}
                          stroke={color}
                          strokeWidth={isHovered ? 4 : 3}
                          rx={4}
                          style={{ pointerEvents: 'none' }}
                        />

                        {/* Mediana */}
                        <line
                          x1={centerX - boxWidth / 2}
                          y1={yScale(group.median)}
                          x2={centerX + boxWidth / 2}
                          y2={yScale(group.median)}
                          stroke="#ef4444"
                          strokeWidth={isHovered ? 5 : 4}
                          style={{ pointerEvents: 'none' }}
                        />

                        {/* Media (rombo) */}
                        <g transform={`translate(${centerX}, ${yScale(group.avg)}) rotate(45)`} style={{ pointerEvents: 'none' }}>
                          <rect x={isHovered ? -8 : -7} y={isHovered ? -8 : -7} width={isHovered ? 16 : 14} height={isHovered ? 16 : 14} fill="#0f172a" />
                        </g>

                        {/* Whisker superiore */}
                        <line x1={centerX} y1={yScale(group.q3)} x2={centerX} y2={yScale(group.whiskerHigh)} stroke={color} strokeWidth={isHovered ? 4 : 3} style={{ pointerEvents: 'none' }} />
                        <line x1={centerX - 25} y1={yScale(group.whiskerHigh)} x2={centerX + 25} y2={yScale(group.whiskerHigh)} stroke={color} strokeWidth={isHovered ? 4 : 3} style={{ pointerEvents: 'none' }} />

                        {/* Outliers */}
                        {(group.outliers || []).map((outlier, i) => (
                          <circle key={i} cx={centerX + (i % 3 - 1) * 10} cy={yScale(outlier)} r={5} fill="#dc2626" stroke="white" strokeWidth={2} />
                        ))}

                        {/* Label categoria */}
                        <text x={centerX} y={height - padding + 30} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1e293b">
                          {group.category}
                        </text>
                        <text x={centerX} y={height - padding + 50} textAnchor="middle" fontSize="12" fill="#64748b">
                          (n={group.total})
                        </text>
                      </g>
                    )
                  })}
                </>
              )
            })()}
          </svg>
          
          {/* Tooltip interattivo */}
          {hoveredBox !== null && (
            <div style={{
              position: 'fixed',
              left: `${tooltipPos.x + 15}px`,
              top: `${tooltipPos.y + 15}px`,
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              zIndex: 1000,
              pointerEvents: 'none',
              minWidth: '250px'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '1.1em', color: '#1e293b' }}>
                {ageData[hoveredBox].category}
              </p>
              <div style={{ fontSize: '0.9em', color: '#475569', lineHeight: '1.8' }}>
                <p style={{ margin: '6px 0' }}><strong>Campione:</strong> {ageData[hoveredBox].total} rispondenti</p>
                <p style={{ margin: '6px 0' }}><strong>Media:</strong> {ageData[hoveredBox].avg} anni</p>
                <p style={{ margin: '6px 0' }}><strong>Mediana:</strong> {ageData[hoveredBox].median} anni</p>
                <p style={{ margin: '6px 0' }}><strong>Q1 (25%):</strong> {ageData[hoveredBox].q1} anni</p>
                <p style={{ margin: '6px 0' }}><strong>Q3 (75%):</strong> {ageData[hoveredBox].q3} anni</p>
                <p style={{ margin: '6px 0' }}><strong>IQR:</strong> {ageData[hoveredBox].q3 - ageData[hoveredBox].q1} anni</p>
                <p style={{ margin: '6px 0' }}><strong>Baffi:</strong> {ageData[hoveredBox].whiskerLow} - {ageData[hoveredBox].whiskerHigh} anni</p>
                <p style={{ margin: '6px 0' }}><strong>Range:</strong> {ageData[hoveredBox].min} - {ageData[hoveredBox].max} anni</p>
                {ageData[hoveredBox].outliers && ageData[hoveredBox].outliers.length > 0 && (
                  <p style={{ margin: '8px 0 0 0', padding: '8px', backgroundColor: '#fef2f2', borderRadius: '4px', color: '#dc2626' }}>
                    <strong>Outliers ({ageData[hoveredBox].outliers.length}):</strong> {ageData[hoveredBox].outliers.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pulsanti Download */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => downloadPNG('age-boxplot-svg', 'età-boxplot.png')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icons.Save className="w-4 h-4" />
            Scarica PNG
          </button>
          <button
            onClick={() => downloadSVG('age-boxplot-svg', 'età-boxplot.svg')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icons.Save className="w-4 h-4" />
            Scarica SVG
          </button>
          <button
            onClick={() => {
              const csvData = ageData.map(g => ({
                Categoria: g.category,
                Campione: g.total,
                Media: g.avg,
                Mediana: g.median,
                Q1: g.q1,
                Q3: g.q3,
                Min: g.min,
                Max: g.max,
                'Whisker Basso': g.whiskerLow,
                'Whisker Alto': g.whiskerHigh,
                Outliers: (g.outliers || []).join('; ')
              }))
              downloadCSV(csvData, Object.keys(csvData[0]), 'età-statistiche.csv')
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icons.Save className="w-4 h-4" />
            Scarica CSV
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', fontSize: '0.85em', color: '#475569', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '18px', height: '12px', backgroundColor: 'rgba(59, 130, 246, 0.2)', border: `2px solid #3b82f6`, borderRadius: '2px', display: 'inline-block' }}></span>
            Quartile Q1-Q3
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '18px', height: '3px', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
            Mediana
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '14px', backgroundColor: '#0f172a', transform: 'rotate(45deg)', display: 'inline-block' }}></span>
            Media
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'inline-block' }}></span>
            Outlier (valore anomalo)
          </div>
        </div>

        {/* Tabella Dati Età */}
        <div style={{ marginTop: '25px', overflowX: 'auto' }}>
          <h4 style={{ marginBottom: '15px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.List className="w-5 h-5" />
            Tabella Dati Statistici Età
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Categoria</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Campione</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Media</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Mediana</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Q1</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Q3</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>IQR</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Min</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Max</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>Outliers</th>
              </tr>
            </thead>
            <tbody>
              {ageData.map((group, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{group.category}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.total}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.avg}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.median}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.q1}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.q3}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.q3 - group.q1}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.min}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{group.max}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: group.outliers && group.outliers.length > 0 ? '#dc2626' : '#16a34a', fontWeight: '500' }}>
                    {group.outliers && group.outliers.length > 0 ? `${group.outliers.length} (${group.outliers.join(', ')})` : 'Nessuno'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Report Outliers */}
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.AlertCircle className="w-5 h-5" />
            Analisi Outliers (Valori Anomali)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {ageData.map((group, idx) => {
              const mean = group.avg
              const range = group.max - group.min
              const iqr = (group.q3 - group.q1) || 0
              const lowerBound = group.whiskerLow ?? group.min
              const upperBound = group.whiskerHigh ?? group.max
              const lowerOutliers = (group.outliers || []).filter(value => value < lowerBound)
              const upperOutliers = (group.outliers || []).filter(value => value > upperBound)
              const hasOutliers = lowerOutliers.length > 0 || upperOutliers.length > 0

              return (
                <div key={idx} style={{
                  padding: '15px',
                  backgroundColor: hasOutliers ? '#fef2f2' : '#f0fdf4',
                  borderRadius: '6px',
                  border: `2px solid ${hasOutliers ? '#fca5a5' : '#86efac'}`
                }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {hasOutliers ? (
                      <Icons.Warning className="w-4 h-4" style={{ color: '#dc2626' }} />
                    ) : (
                      <Icons.Check className="w-4 h-4" style={{ color: '#16a34a' }} />
                    )}
                    {group.category}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#475569', lineHeight: '1.6' }}>
                    <p style={{ margin: '5px 0' }}>Media: <strong>{mean}</strong> anni</p>
                    <p style={{ margin: '5px 0' }}>Mediana: <strong>{group.median}</strong> anni</p>
                    <p style={{ margin: '5px 0' }}>Baffi IQR: {lowerBound} - {upperBound} anni</p>
                    <p style={{ margin: '5px 0' }}>Range complessivo: {group.min} - {group.max} anni</p>
                    <p style={{ margin: '5px 0' }}>Ampiezza: <strong>{range}</strong> anni (IQR: {iqr})</p>
                    {hasOutliers ? (
                      <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.8em' }}>
                        <Icons.AlertCircle className="w-4 h-4" style={{ display: 'inline', marginRight: '4px', color: '#dc2626' }} />
                        <strong>Outliers rilevati:</strong>
                        {lowerOutliers.length > 0 && (
                          <p style={{ margin: '4px 0 0 20px' }}>Bassi: {lowerOutliers.join(', ')}</p>
                        )}
                        {upperOutliers.length > 0 && (
                          <p style={{ margin: '4px 0 0 20px' }}>Alti: {upperOutliers.join(', ')}</p>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#dcfce7', borderRadius: '4px', fontSize: '0.8em', color: '#166534' }}>
                        <Icons.Check className="w-4 h-4" style={{ display: 'inline', marginRight: '4px' }} />
                        Nessun outlier significativo
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', fontSize: '0.85em', color: '#78350f' }}>
            <Icons.Info className="w-4 h-4" style={{ display: 'inline', marginRight: '6px' }} />
            <strong>Nota metodologica:</strong> Gli outliers sono identificati usando il metodo IQR (Interquartile Range). 
            Valori che si discostano significativamente dalla media possono indicare rispondenti con età inusuali per la categoria.
          </div>
        </div>
      </section>

      {/* Confronto Genere */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155' }}>
          Distribuzione Genere per Categoria
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Studenti */}
          <div>
            <h4 style={{ textAlign: 'center', color: COLORS.students, marginBottom: '10px' }}>Studenti</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={studentsGenderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studentsGenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insegnanti Attivi */}
          <div>
            <h4 style={{ textAlign: 'center', color: COLORS.teachers_active, marginBottom: '10px' }}>Insegnanti</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={teachersActiveGenderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {teachersActiveGenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insegnanti in Formazione */}
          <div>
            <h4 style={{ textAlign: 'center', color: COLORS.teachers_training, marginBottom: '10px' }}>In Formazione</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={teachersTrainingGenderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {teachersTrainingGenderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Sezioni Espandibili */}
      {renderExpandableSection('students', 'Studenti', COLORS.students, data.students, Icons.Student)}
      {renderExpandableSection('teachers_active', 'Insegnanti Attivi', COLORS.teachers_active, data.teachers_active, Icons.Teacher)}
      {renderExpandableSection('teachers_training', 'Insegnanti in Formazione', COLORS.teachers_training, data.teachers_training, Icons.Teacher)}
      {renderExpandableSection('teachers_total', 'Insegnanti Totali', '#8b5cf6', mergeTeachersData(data.teachers_active, data.teachers_training), Icons.Teacher)}
    </div>
  )

  function mergeTeachersData(activeData, trainingData) {
    // Funzione helper per sommare distribuzioni
    const mergeDistribution = (dist1, dist2) => {
      const merged = { ...dist1 }
      Object.entries(dist2).forEach(([key, value]) => {
        merged[key] = (merged[key] || 0) + value
      })
      return merged
    }

    // Calcola totale
    const total = activeData.total + trainingData.total

    // Merge età
    const allAges = [
      ...(activeData.age?.outliers || []),
      ...(trainingData.age?.outliers || [])
    ]
    const mergedAge = {
      avg: ((activeData.age?.avg || 0) * activeData.total + (trainingData.age?.avg || 0) * trainingData.total) / total,
      min: Math.min(activeData.age?.min || 0, trainingData.age?.min || 0),
      max: Math.max(activeData.age?.max || 0, trainingData.age?.max || 0),
      q1: ((activeData.age?.q1 || 0) * activeData.total + (trainingData.age?.q1 || 0) * trainingData.total) / total,
      median: ((activeData.age?.median || 0) * activeData.total + (trainingData.age?.median || 0) * trainingData.total) / total,
      q3: ((activeData.age?.q3 || 0) * activeData.total + (trainingData.age?.q3 || 0) * trainingData.total) / total,
      whisker_low: Math.min(activeData.age?.whisker_low || 0, trainingData.age?.whisker_low || 0),
      whisker_high: Math.max(activeData.age?.whisker_high || 0, trainingData.age?.whisker_high || 0),
      outliers: allAges,
      total: total,
      ranges: mergeDistribution(activeData.age?.ranges || {}, trainingData.age?.ranges || {})
    }

    // Merge genere
    const mergedGender = {
      distribution: mergeDistribution(activeData.gender?.distribution || {}, trainingData.gender?.distribution || {}),
      total: total
    }

    // Merge educazione
    const mergedEducation = {
      distribution: mergeDistribution(activeData.education?.distribution || {}, trainingData.education?.distribution || {}),
      total: total
    }

    // Merge scuola/istituto
    const mergedSchool = {
      distribution: mergeDistribution(activeData.school?.distribution || {}, trainingData.school?.distribution || {}),
      total: total
    }

    // Merge STEM
    const mergedStem = {
      distribution: mergeDistribution(activeData.stem?.distribution || {}, trainingData.stem?.distribution || {}),
      total: total
    }

    return {
      total: total,
      age: mergedAge,
      gender: mergedGender,
      education: mergedEducation,
      school: mergedSchool,
      stem: mergedStem
    }
  }

  function renderExpandableSection(key, title, color, profileData, Icon) {
    const isExpanded = expandedSections[key]

    return (
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px',
        border: `2px solid ${color}`
      }}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => toggleSection(key)}
        >
          <h3 style={{ color, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon className="w-6 h-6" />
            {title} ({profileData.total} rispondenti)
          </h3>
          <button style={{
            padding: '8px 16px',
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {isExpanded ? (
              <>
                <Icons.ChevronUp className="w-4 h-4" />
                Nascondi dettagli
              </>
            ) : (
              <>
                <Icons.ChevronDown className="w-4 h-4" />
                Mostra dettagli
              </>
            )}
          </button>
        </div>

        {isExpanded && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            {renderDetailedProfile(profileData, key)}
          </div>
        )}
      </section>
    )
  }

  function renderDetailedProfile(profileData, category) {
    // Prepara dati fasce età
    const ageRangesData = Object.entries(profileData.age.ranges || {}).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / profileData.age.total) * 100).toFixed(1)
    }))

    // Prepara dati titoli di studio
    const educationData = Object.entries(profileData.education.distribution || {})
      .map(([name, value]) => {
        // Spezza etichette lunghe su più righe (max 35 caratteri per riga)
        const maxLength = 35
        let displayName = name
        if (name.length > maxLength) {
          const words = name.split(' ')
          let lines = []
          let currentLine = ''
          
          words.forEach(word => {
            if ((currentLine + ' ' + word).length > maxLength && currentLine.length > 0) {
              lines.push(currentLine.trim())
              currentLine = word
            } else {
              currentLine += (currentLine.length > 0 ? ' ' : '') + word
            }
          })
          if (currentLine) lines.push(currentLine.trim())
          displayName = lines.slice(0, 2).join('\n') // Max 2 righe
          if (lines.length > 2) displayName += '...'
        }
        
        return {
          name: displayName,
          value,
          fullName: name,
          label: `${displayName} (${value})`
        }
      })
      .sort((a, b) => b.value - a.value)

    return (
      <div>
        {/* Statistiche Età Dettagliate */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#475569', marginBottom: '15px' }}>Distribuzione Età</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Media</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{profileData.age.avg}</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Min</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{profileData.age.min}</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Max</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{profileData.age.max}</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageRangesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <p style={{ margin: 0 }}><strong>{data.range} anni</strong></p>
                      <p style={{ margin: '5px 0 0 0' }}>Rispondenti: {data.count} ({data.percentage}%)</p>
                    </div>
                  )
                }
                return null
              }} />
              <Bar dataKey="count" fill={COLORS[category]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabella Fasce Età */}
          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <h5 style={{ marginBottom: '10px', color: '#475569', fontSize: '0.95em' }}>Tabella Dati Fasce Età</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Fascia Età</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Percentuale</th>
                </tr>
              </thead>
              <tbody>
                {ageRangesData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '10px', fontWeight: '500', color: '#1e293b' }}>{item.range} anni</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>{item.count}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pulsante Download CSV Fasce Età */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                const csvData = ageRangesData.map(item => ({
                  'Fascia Età': item.range + ' anni',
                  'Numero': item.count,
                  'Percentuale': item.percentage + '%'
                }))
                downloadCSV(csvData, ['Fascia Età', 'Numero', 'Percentuale'], `fasce-età-${category}.csv`)
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: COLORS[category],
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icons.Save className="w-4 h-4" />
              Scarica CSV
            </button>
          </div>
        </div>

        {/* Titoli di Studio */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#475569', marginBottom: '15px' }}>Titoli di Studio</h4>
          <ResponsiveContainer width="100%" height={Math.max(400, educationData.length * 70)}>
            <BarChart data={educationData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={320}
                tick={(props) => {
                  const { x, y, payload } = props
                  const lines = payload.value.split('\n')
                  return (
                    <g transform={`translate(${x},${y})`}>
                      {lines.map((line, index) => (
                        <text
                          key={index}
                          x={0}
                          y={index * 14}
                          dy={0}
                          textAnchor="end"
                          fill="#475569"
                          fontSize={11}
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )
                }}
                interval={0}
              />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxWidth: '300px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>{data.fullName}</strong></p>
                      <p style={{ margin: '5px 0 0 0' }}>Rispondenti: {data.value}</p>
                    </div>
                  )
                }
                return null
              }} />
              <Bar 
                dataKey="value" 
                fill={COLORS[category]}
                label={{ position: 'right', fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabella Titoli di Studio */}
          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <h5 style={{ marginBottom: '10px', color: '#475569', fontSize: '0.95em' }}>Tabella Dati Titoli di Studio</h5>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Titolo di Studio</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                </tr>
              </thead>
              <tbody>
                {educationData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '10px', color: '#1e293b' }}>{item.fullName}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pulsante Download CSV Titoli di Studio */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                const csvData = educationData.map(item => ({
                  'Titolo di Studio': item.fullName,
                  'Numero': item.value
                }))
                downloadCSV(csvData, ['Titolo di Studio', 'Numero'], `titoli-studio-${category}.csv`)
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: COLORS[category],
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icons.Save className="w-4 h-4" />
              Scarica CSV
            </button>
          </div>
        </div>

        {/* Campi specifici per categoria */}
        {category === 'students' && profileData.school_type && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#475569', marginBottom: '15px' }}>Scuola o Istituto che Frequento</h4>
            {(() => {
              const schoolTypeData = Object.entries(profileData.school_type.distribution || {})
                .map(([name, value]) => {
                  // Spezza etichette lunghe su più righe
                  const maxLength = 35
                  let displayName = name
                  if (name.length > maxLength) {
                    const words = name.split(' ')
                    let lines = []
                    let currentLine = ''
                    
                    words.forEach(word => {
                      if ((currentLine + ' ' + word).length > maxLength && currentLine.length > 0) {
                        lines.push(currentLine.trim())
                        currentLine = word
                      } else {
                        currentLine += (currentLine.length > 0 ? ' ' : '') + word
                      }
                    })
                    if (currentLine) lines.push(currentLine.trim())
                    displayName = lines.slice(0, 2).join('\n')
                    if (lines.length > 2) displayName += '...'
                  }
                  
                  return {
                    name: displayName,
                    value,
                    fullName: name
                  }
                })
                .sort((a, b) => b.value - a.value)
              
              return (
                <ResponsiveContainer width="100%" height={Math.max(350, schoolTypeData.length * 60)}>
                  <BarChart data={schoolTypeData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={280}
                      tick={(props) => {
                        const { x, y, payload } = props
                        const lines = payload.value.split('\n')
                        return (
                          <g transform={`translate(${x},${y})`}>
                            {lines.map((line, index) => (
                              <text
                                key={index}
                                x={0}
                                y={index * 14}
                                dy={0}
                                textAnchor="end"
                                fill="#475569"
                                fontSize={11}
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        )
                      }}
                      interval={0}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxWidth: '300px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>{data.fullName}</strong></p>
                            <p style={{ margin: '5px 0 0 0' }}>Studenti: {data.value}</p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS.students}
                      label={{ position: 'right', fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}

            {/* Tabella Scuola o Istituto */}
            {(() => {
              const schoolTypeData = Object.entries(profileData.school_type.distribution || {})
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
              
              return (
                <>
                  <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <h5 style={{ marginBottom: '10px', color: '#475569', fontSize: '0.95em' }}>Tabella Dati Scuola/Istituto</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Scuola/Istituto</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolTypeData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <td style={{ padding: '10px', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pulsante Download CSV Scuola */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        const csvData = schoolTypeData.map(item => ({
                          'Scuola/Istituto': item.name,
                          'Numero': item.value
                        }))
                        downloadCSV(csvData, ['Scuola/Istituto', 'Numero'], 'scuole-istituti-studenti.csv')
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: COLORS.students,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icons.Save className="w-4 h-4" />
                      Scarica CSV
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {(category === 'teachers_active' || category === 'teachers_training') && profileData.school_level && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#475569', marginBottom: '15px' }}>
              {category === 'teachers_active' 
                ? 'Scuola o Istituto in cui Insegno' 
                : 'Scuola o Istituto in cui Vorrei Insegnare'}
            </h4>
            {(() => {
              const schoolLevelData = Object.entries(profileData.school_level.distribution || {})
                .map(([name, value]) => {
                  // Spezza etichette lunghe su più righe
                  const maxLength = 35
                  let displayName = name
                  if (name.length > maxLength) {
                    const words = name.split(' ')
                    let lines = []
                    let currentLine = ''
                    
                    words.forEach(word => {
                      if ((currentLine + ' ' + word).length > maxLength && currentLine.length > 0) {
                        lines.push(currentLine.trim())
                        currentLine = word
                      } else {
                        currentLine += (currentLine.length > 0 ? ' ' : '') + word
                      }
                    })
                    if (currentLine) lines.push(currentLine.trim())
                    displayName = lines.slice(0, 2).join('\n')
                    if (lines.length > 2) displayName += '...'
                  }
                  
                  return {
                    name: displayName,
                    value,
                    fullName: name
                  }
                })
                .sort((a, b) => b.value - a.value)
              
              return (
                <ResponsiveContainer width="100%" height={Math.max(350, schoolLevelData.length * 60)}>
                  <BarChart data={schoolLevelData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={280}
                      tick={(props) => {
                        const { x, y, payload } = props
                        const lines = payload.value.split('\n')
                        return (
                          <g transform={`translate(${x},${y})`}>
                            {lines.map((line, index) => (
                              <text
                                key={index}
                                x={0}
                                y={index * 14}
                                dy={0}
                                textAnchor="end"
                                fill="#475569"
                                fontSize={11}
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        )
                      }}
                      interval={0}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', maxWidth: '300px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>{data.fullName}</strong></p>
                            <p style={{ margin: '5px 0 0 0' }}>Insegnanti: {data.value}</p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS[category]}
                      label={{ position: 'right', fill: '#475569', fontSize: 12, fontWeight: 'bold' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}

            {/* Tabella Scuola/Istituto Insegnanti */}
            {(() => {
              const schoolLevelData = Object.entries(profileData.school_level.distribution || {})
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
              
              return (
                <>
                  <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <h5 style={{ marginBottom: '10px', color: '#475569', fontSize: '0.95em' }}>Tabella Dati Scuola/Istituto</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Scuola/Istituto</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolLevelData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <td style={{ padding: '10px', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pulsante Download CSV Scuola Insegnanti */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        const csvData = schoolLevelData.map(item => ({
                          'Scuola/Istituto': item.name,
                          'Numero': item.value
                        }))
                        downloadCSV(csvData, ['Scuola/Istituto', 'Numero'], `scuole-istituti-${category}.csv`)
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: COLORS[category],
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icons.Save className="w-4 h-4" />
                      Scarica CSV
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Tipo di Materia: STEM vs Umanistica (solo per insegnanti) */}
        {(category === 'teachers_active' || category === 'teachers_training') && profileData.subject_type && (
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#475569', marginBottom: '15px' }}>Tipo di Materia: STEM vs Umanistica</h4>
            {(() => {
              const subjectTypeData = Object.entries(profileData.subject_type.distribution || {})
                .map(([name, value]) => ({
                  name: name.includes('STEM') ? 'STEM' : 'Umanistica',
                  fullName: name,
                  value,
                  percentage: ((value / profileData.subject_type.total) * 100).toFixed(1)
                }))
              
              const SUBJECT_COLORS = {
                'STEM': '#3b82f6',
                'Umanistica': '#f59e0b'
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Grafico a torta */}
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={subjectTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {subjectTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{data.fullName}</p>
                                <p style={{ margin: '5px 0 0 0' }}>Insegnanti: {data.value} ({data.percentage}%)</p>
                              </div>
                            )
                          }
                          return null
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Statistiche dettagliate */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                    {subjectTypeData.map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '20px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${SUBJECT_COLORS[item.name]}`
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: SUBJECT_COLORS[item.name], marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.name === 'STEM' ? (
                            <><Icons.Science className="w-5 h-5" /> STEM</>
                          ) : (
                            <><Icons.Book className="w-5 h-5" /> Umanistica</>
                          )}
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
                          {item.percentage}% del totale
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
                          {item.fullName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Tabella STEM vs Umanistica */}
            {(() => {
              const subjectTypeData = Object.entries(profileData.subject_type.distribution || {})
                .map(([name, value]) => ({
                  name: name,
                  value,
                  percentage: ((value / profileData.subject_type.total) * 100).toFixed(1)
                }))
              
              return (
                <>
                  <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <h5 style={{ marginBottom: '10px', color: '#475569', fontSize: '0.95em' }}>Tabella Dati STEM vs Umanistica</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Tipo Materia</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Numero</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontWeight: '600' }}>Percentuale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectTypeData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <td style={{ padding: '10px', fontWeight: '500', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{item.value}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pulsante Download CSV STEM */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        const csvData = subjectTypeData.map(item => ({
                          'Tipo Materia': item.name,
                          'Numero': item.value,
                          'Percentuale': item.percentage + '%'
                        }))
                        downloadCSV(csvData, ['Tipo Materia', 'Numero', 'Percentuale'], `stem-umanistica-${category}.csv`)
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: COLORS[category],
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icons.Save className="w-4 h-4" />
                      Scarica CSV
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    )
  }
}

export default RespondentProfiles
