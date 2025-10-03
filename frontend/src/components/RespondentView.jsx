import { useState, useEffect } from 'react'
import { Icons } from './Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

/**
 * Componente per visualizzare tutte le risposte di un singolo rispondente
 */
function RespondentView() {
  const [respondentCode, setRespondentCode] = useState('')
  const [respondentData, setRespondentData] = useState(null)
  const [respondentsList, setRespondentsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    respondentType: 'all',
    category: 'all'
  })

  // Carica lista codici rispondenti all'avvio
  useEffect(() => {
    loadRespondentsList()
  }, [filters.respondentType])

  const loadRespondentsList = async () => {
    try {
      const typeParam = filters.respondentType !== 'all' ? `?respondent_type=${filters.respondentType}` : ''
      const response = await fetch(`${API_URL}/api/respondents/list${typeParam}`)
      const data = await response.json()
      setRespondentsList(data.respondents || [])
    } catch (err) {
      console.error('Errore caricamento lista rispondenti:', err)
    }
  }

  const searchRespondent = async (code = null) => {
    const searchCode = code || respondentCode.trim()
    
    if (!searchCode) {
      setError('Inserisci un codice rispondente')
      return
    }

    setLoading(true)
    setError(null)
    setRespondentData(null)

    try {
      const response = await fetch(`${API_URL}/api/respondent/${searchCode}`)
      const data = await response.json()

      if (data.found) {
        setRespondentData(data)
        setRespondentCode(searchCode)
      } else {
        setError(data.message || 'Rispondente non trovato')
      }
    } catch (err) {
      console.error('Errore ricerca rispondente:', err)
      setError('Errore nella ricerca. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  // Navigazione tra rispondenti
  const navigateRespondent = (direction) => {
    if (respondentsList.length === 0) return
    
    const currentIndex = respondentsList.findIndex(r => r.code === respondentCode)
    if (currentIndex === -1) return
    
    let nextIndex
    if (direction === 'prev') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : respondentsList.length - 1
    } else {
      nextIndex = currentIndex < respondentsList.length - 1 ? currentIndex + 1 : 0
    }
    
    const nextCode = respondentsList[nextIndex].code
    searchRespondent(nextCode)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchRespondent()
    }
  }

  // Filtra le risposte in base alla categoria selezionata
  const allResponses = respondentData?.responses || []
  const responses = filters.category === 'all' 
    ? allResponses 
    : allResponses.filter(r => r.category === filters.category)
  
  // Estrai categorie uniche dalle risposte
  const categories = ['all', ...new Set(allResponses.map(r => r.category).filter(Boolean))]

  // Badge per tipo rispondente
  const getRespondentTypeBadge = (type) => {
    switch(type) {
      case 'student':
        return { label: 'Studente', color: '#3b82f6', icon: Icons.Student }
      case 'teacher_active':
        return { label: 'Insegnante', color: '#10b981', icon: Icons.Teacher }
      case 'teacher_training':
        return { label: 'Insegnante in Formazione', color: '#f59e0b', icon: Icons.Teacher }
      default:
        return { label: type, color: '#64748b', icon: Icons.Question }
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#1e40af', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Student className="w-6 h-6" />
          Visualizzazione Risposte Singolo Rispondente
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95em' }}>
          Cerca un rispondente tramite codice identificativo per visualizzare tutte le sue risposte
        </p>
      </div>

      {/* Sezione Ricerca */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#334155' }}>Ricerca Rispondente</h3>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* Filtro tipo rispondente */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
              Tipo rispondente:
            </label>
            <select
              value={filters.respondentType}
              onChange={(e) => setFilters({...filters, respondentType: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="all">Tutti</option>
              <option value="student">Studenti</option>
              <option value="teacher">Insegnanti Totali</option>
              <option value="teacher_active">Insegnanti</option>
              <option value="teacher_training">Insegnanti in Formazione</option>
            </select>
          </div>

          {/* Filtro categoria domande */}
          {respondentData && (
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
                Categoria domande:
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">Tutte le categorie ({allResponses.length})</option>
                {categories.filter(c => c !== 'all').map(cat => {
                  const count = allResponses.filter(r => r.category === cat).length
                  return <option key={cat} value={cat}>{cat} ({count})</option>
                })}
              </select>
            </div>
          )}

          {/* Campo ricerca */}
          <div style={{ flex: '2', minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
              Codice rispondente:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={respondentCode}
                onChange={(e) => setRespondentCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Es: ROSS15"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={searchRespondent}
                disabled={loading}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Ricerca...
                  </>
                ) : (
                  <>
                    <Icons.Chart className="w-4 h-4" />
                    Cerca
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lista codici disponibili */}
        {respondentsList.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <details>
              <summary style={{ 
                cursor: 'pointer', 
                fontSize: '0.875rem', 
                color: '#64748b',
                userSelect: 'none',
                padding: '5px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icons.List className="w-4 h-4" />
                Mostra lista codici disponibili ({respondentsList.length})
              </summary>
              <div style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px'
                }}>
                  {respondentsList.map((resp, idx) => {
                    const badge = getRespondentTypeBadge(resp.type)
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setRespondentCode(resp.code)
                          searchRespondent()
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          border: `1px solid ${badge.color}`,
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          color: badge.color,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = badge.color
                          e.target.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'white'
                          e.target.style.color = badge.color
                        }}
                      >
                        {resp.code}
                      </button>
                    )
                  })}
                </div>
              </div>
            </details>
          </div>
        )}
      </section>

      {/* Messaggio errore */}
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '6px',
          color: '#dc2626',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Icons.Warning className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Risultati */}
      {respondentData && (
        <div>
          {/* Header info rispondente con navigazione */}
          <section style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {/* Freccia indietro */}
                <button
                  onClick={() => navigateRespondent('prev')}
                  disabled={respondentsList.length === 0}
                  style={{
                    padding: '8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: respondentsList.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: respondentsList.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (respondentsList.length > 0) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                  title="Rispondente precedente"
                >
                  <Icons.ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {(() => {
                      const badge = getRespondentTypeBadge(respondentData.respondent_type)
                      const Icon = badge.icon
                      return (
                        <>
                          <Icon className="w-5 h-5" />
                          Rispondente: {respondentData.code}
                        </>
                      )
                    })()}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getRespondentTypeBadge(respondentData.respondent_type).color,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {getRespondentTypeBadge(respondentData.respondent_type).label}
                  </span>
                </div>

                {/* Freccia avanti */}
                <button
                  onClick={() => navigateRespondent('next')}
                  disabled={respondentsList.length === 0}
                  style={{
                    padding: '8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: respondentsList.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: respondentsList.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (respondentsList.length > 0) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                  title="Rispondente successivo"
                >
                  <Icons.ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Dati demografici */}
              <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {respondentData.timestamp && (
                  <>
                    <Icons.Clock className="w-4 h-4" />
                    <span>Data compilazione: {new Date(respondentData.timestamp).toLocaleString('it-IT')}</span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Risposte */}
          <section style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h4 style={{ 
              color: '#1e40af', 
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '2px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Chart className="w-5 h-5" />
                <span>Risposte</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#64748b' }}>
                {filters.category === 'all' ? `Totale: ${responses.length}` : `${responses.length} di ${allResponses.length}`}
              </span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {responses.map((response, idx) => {
                const isOpen = response.type === 'open'
                const isLongText = response.value && response.value.length > 100
                
                return (
                  <div key={idx} style={{
                    padding: '15px',
                    backgroundColor: isOpen ? '#fefce8' : '#f8fafc',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${isOpen ? '#eab308' : '#3b82f6'}`
                  }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#475569', 
                      marginBottom: '8px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#94a3b8' }}>
                        #{idx + 1}
                      </span>
                      {isOpen && <Icons.OpenQuestion className="w-4 h-4" style={{ color: '#eab308' }} />}
                      {!isOpen && <Icons.ClosedQuestion className="w-4 h-4" style={{ color: '#3b82f6' }} />}
                      <span>{response.question}</span>
                    </div>
                    <div style={{
                      fontSize: isLongText ? '0.95rem' : '1rem',
                      color: '#1e293b',
                      fontWeight: isOpen ? '400' : '600',
                      whiteSpace: isOpen ? 'pre-wrap' : 'normal',
                      lineHeight: isOpen ? '1.6' : 'normal'
                    }}>
                      {response.value}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Riepilogo */}
          <section style={{
            backgroundColor: '#f0f9ff',
            padding: '15px 20px',
            borderRadius: '8px',
            border: '1px solid #bae6fd',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#0c4a6e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Icons.Stats className="w-5 h-5" />
            <span>Totale risposte visualizzate: <strong>{responses.length}</strong></span>
          </section>
        </div>
      )}
    </div>
  )
}

export default RespondentView
