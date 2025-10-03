import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

  // Dati età comparativa
  const ageData = [
    { category: 'Studenti', avg: data.students.age.avg, min: data.students.age.min, max: data.students.age.max },
    { category: 'Insegnanti', avg: data.teachers_active.age.avg, min: data.teachers_active.age.min, max: data.teachers_active.age.max },
    { category: 'In Formazione', avg: data.teachers_training.age.avg, min: data.teachers_training.age.min, max: data.teachers_training.age.max }
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
      </section>

      {/* Confronto Età */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#334155' }}>
          Confronto Età Media
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg" fill="#3b82f6" name="Età Media" />
          </BarChart>
        </ResponsiveContainer>
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
    </div>
  )

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
          </div>
        )}
      </div>
    )
  }
}

export default RespondentProfiles
