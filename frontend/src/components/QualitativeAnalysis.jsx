import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function QualitativeAnalysis() {
  // Tab management
  const [activeTab, setActiveTab] = useState('single') // 'single' o 'sequential'
  
  // Analisi SINGOLA (esistente)
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Template di analisi
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  
  // FASE 1: Generazione tassonomia
  const [generatingTaxonomy, setGeneratingTaxonomy] = useState(false)
  const [taxonomy, setTaxonomy] = useState(null)
  const [editingTaxonomy, setEditingTaxonomy] = useState(false)
  
  // FASE 2: Classificazione
  const [classifying, setClassifying] = useState(false)
  const [classificationProgress, setClassificationProgress] = useState(0)
  const [results, setResults] = useState(null)
  
  const [savedTaxonomies, setSavedTaxonomies] = useState([])
  const [error, setError] = useState(null)
  
  // Stato per gestire quali categorie sono espanse (per sezioni collapsibili)
  const [expandedCategories, setExpandedCategories] = useState({})
  
  // Analisi SEQUENZIALE (nuovo)
  const [selectedQuestions, setSelectedQuestions] = useState([]) // Array di {field_key, respondent_type}
  const [sequenceTemplate, setSequenceTemplate] = useState('custom')
  const [sequenceRunning, setSequenceRunning] = useState(false)
  const [sequenceProgress, setSequenceProgress] = useState({
    current: 0,
    total: 0,
    currentQuestion: null,
    phase: '', // 'taxonomy' o 'classification'
    phaseProgress: 0
  })
  const [sequenceResults, setSequenceResults] = useState([]) // Array di {question, status, taxonomyId, error}
  const [searchQuery, setSearchQuery] = useState('') // Ricerca domande
  
  // ARCHIVIO ANALISI (nuovo tab)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')
  const [archiveFilterQuestion, setArchiveFilterQuestion] = useState('all')
  const [archiveFilterGroup, setArchiveFilterGroup] = useState('all')
  const [selectedForComparison, setSelectedForComparison] = useState([]) // Array di max 2 taxonomy IDs
  const [comparisonView, setComparisonView] = useState(null) // {analysis1, analysis2}
  const [archiveViewMode, setArchiveViewMode] = useState('list') // 'list' | 'single' | 'comparison'
  const [archiveSelectedAnalysis, setArchiveSelectedAnalysis] = useState(null) // Analisi visualizzata nel tab archivio

  useEffect(() => {
    loadAvailableQuestions()
    loadSavedTaxonomies()
    loadTemplates()
  }, [])

  const loadAvailableQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/qualitative-analysis/available-questions`)
      const data = await response.json()
      setQuestions(data.questions)
    } catch (err) {
      console.error('Errore caricamento domande:', err)
      setError('Errore caricamento domande aperte')
    } finally {
      setLoading(false)
    }
  }

  const loadSavedTaxonomies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/qualitative-analysis/taxonomies`)
      const data = await response.json()
      setSavedTaxonomies(data.taxonomies || [])
    } catch (err) {
      console.error('Errore caricamento tassonomie:', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/qualitative-analysis/templates`)
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Errore caricamento template:', err)
    }
  }

  // FASE 1: Genera tassonomia
  const generateTaxonomy = async () => {
    if (!selectedQuestion) return

    try {
      setGeneratingTaxonomy(true)
      setError(null)
      setTaxonomy(null)
      setResults(null)

      const response = await fetch(`${API_URL}/api/qualitative-analysis/generate-taxonomy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: selectedQuestion.field_key,
          respondent_type: selectedQuestion.respondent_type,
          max_categories: 8,
          template: selectedTemplate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore generazione tassonomia')
      }

      const data = await response.json()
      setTaxonomy(data)
    } catch (err) {
      console.error('Errore generazione tassonomia:', err)
      setError(err.message)
    } finally {
      setGeneratingTaxonomy(false)
    }
  }

  // FASE 2: Classifica risposte in batch
  const classifyResponses = async () => {
    if (!taxonomy) return

    try {
      setClassifying(true)
      setError(null)
      setClassificationProgress(0)
      setResults(null)

      let startIndex = 0
      const batchSize = 30
      let isComplete = false
      let finalResults = null

      while (!isComplete) {
        const response = await fetch(`${API_URL}/api/qualitative-analysis/classify-responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field_key: selectedQuestion.field_key,
            respondent_type: selectedQuestion.respondent_type,
            taxonomy: taxonomy.taxonomy,
            batch_size: batchSize,
            start_index: startIndex
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Errore classificazione')
        }

        const data = await response.json()
        
        // Aggiorna progresso
        setClassificationProgress(data.progress_percentage)
        
        isComplete = data.is_complete
        startIndex += batchSize

        if (isComplete && data.summary) {
          finalResults = {
            ...taxonomy,
            taxonomy_id: data.taxonomy_id,
            summary: data.summary
          }
          setResults(finalResults)
        }
      }

      loadSavedTaxonomies() // Ricarica lista
    } catch (err) {
      console.error('Errore classificazione:', err)
      setError(err.message)
    } finally {
      setClassifying(false)
    }
  }

  const loadTaxonomy = async (taxonomyId) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${taxonomyId}`)
      const data = await response.json()
      setResults(data)
      
      // Trova domanda corrispondente
      const question = questions.find(
        q => q.field_key === data.field_key && q.respondent_type === data.respondent_type
      )
      if (question) setSelectedQuestion(question)
    } catch (err) {
      console.error('Errore caricamento tassonomia:', err)
      setError('Errore caricamento tassonomia salvata')
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = (index, field, value) => {
    const newTaxonomy = { ...taxonomy }
    newTaxonomy.taxonomy[index][field] = value
    setTaxonomy(newTaxonomy)
  }

  const deleteCategory = (index) => {
    const newTaxonomy = { ...taxonomy }
    newTaxonomy.taxonomy.splice(index, 1)
    setTaxonomy(newTaxonomy)
  }

  const addCategory = () => {
    const newTaxonomy = { ...taxonomy }
    newTaxonomy.taxonomy.push({
      name: `Nuova Categoria ${newTaxonomy.taxonomy.length + 1}`,
      definition: '',
      keywords: [],
      examples: []
    })
    setTaxonomy(newTaxonomy)
  }

  const getRespondentLabel = (type) => {
    const labels = {
      'students': 'Studenti',
      'teachers_active': 'Insegnanti in Servizio',
      'teachers_training': 'Insegnanti Non in Servizio'
    }
    return labels[type] || type
  }

  const getQuestionLabel = (fieldKey) => {
    const labels = {
      'pros_cons': 'PRO e CONTRO dell\'IA',
      'suggestions': 'Suggerimenti per l\'utilizzo dell\'IA',
      'practices': 'Pratiche e strumenti utilizzati',
      'concerns': 'Preoccupazioni sull\'IA',
      'benefits': 'Benefici percepiti',
      'challenges': 'Sfide nell\'implementazione'
    }
    return labels[fieldKey] || fieldKey
  }

  const getQuestionFullText = (fieldKey) => {
    const texts = {
      'pros_cons': 'Quali sono i PRO e i CONTRO dell\'utilizzo dell\'intelligenza artificiale nella didattica?',
      'suggestions': 'Quali suggerimenti daresti per un utilizzo efficace dell\'intelligenza artificiale nell\'educazione?',
      'practices': 'Quali pratiche e strumenti di intelligenza artificiale utilizzi o conosci?',
      'concerns': 'Quali sono le tue principali preoccupazioni riguardo l\'intelligenza artificiale nell\'educazione?',
      'benefits': 'Quali benefici hai riscontrato o prevedi dall\'uso dell\'intelligenza artificiale?',
      'challenges': 'Quali sfide hai incontrato nell\'implementazione dell\'intelligenza artificiale?'
    }
    return texts[fieldKey] || getQuestionLabel(fieldKey)
  }

  // === FUNZIONI ANALISI SEQUENZIALE ===
  
  // Filtra domande in base alla ricerca
  const getFilteredQuestions = () => {
    if (!searchQuery.trim()) return questions
    
    const query = searchQuery.toLowerCase()
    return questions.filter(q => {
      const questionText = q.question_text.toLowerCase()
      const respondentLabel = getRespondentLabel(q.respondent_type).toLowerCase()
      const fieldLabel = getQuestionLabel(q.field_key).toLowerCase()
      
      return questionText.includes(query) || 
             respondentLabel.includes(query) || 
             fieldLabel.includes(query)
    })
  }
  
  // === FUNZIONI ARCHIVIO ANALISI ===
  
  const getFilteredArchive = () => {
    let filtered = [...savedTaxonomies]
    
    // Filtro per tipo domanda
    if (archiveFilterQuestion !== 'all') {
      filtered = filtered.filter(t => t.field_key === archiveFilterQuestion)
    }
    
    // Filtro per gruppo
    if (archiveFilterGroup !== 'all') {
      filtered = filtered.filter(t => t.respondent_type === archiveFilterGroup)
    }
    
    // Ricerca testuale
    if (archiveSearchQuery.trim()) {
      const query = archiveSearchQuery.toLowerCase()
      filtered = filtered.filter(t => {
        const questionLabel = getQuestionLabel(t.field_key).toLowerCase()
        const respondentLabel = getRespondentLabel(t.respondent_type).toLowerCase()
        const questionText = getQuestionFullText(t.field_key).toLowerCase()
        
        return questionLabel.includes(query) || 
               respondentLabel.includes(query) || 
               questionText.includes(query)
      })
    }
    
    return filtered
  }
  
  const toggleComparisonSelection = (taxonomyId) => {
    if (selectedForComparison.includes(taxonomyId)) {
      setSelectedForComparison(selectedForComparison.filter(id => id !== taxonomyId))
    } else {
      if (selectedForComparison.length < 2) {
        setSelectedForComparison([...selectedForComparison, taxonomyId])
      } else {
        // Sostituisci il primo con il nuovo
        setSelectedForComparison([selectedForComparison[1], taxonomyId])
      }
    }
  }
  
  const loadComparisonView = async () => {
    if (selectedForComparison.length !== 2) return
    
    try {
      setLoading(true)
      const [id1, id2] = selectedForComparison
      
      const [response1, response2] = await Promise.all([
        fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${id1}`),
        fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${id2}`)
      ])
      
      const [data1, data2] = await Promise.all([
        response1.json(),
        response2.json()
      ])
      
      setComparisonView({ analysis1: data1, analysis2: data2 })
      setArchiveViewMode('comparison')
    } catch (err) {
      console.error('Errore caricamento confronto:', err)
      setError('Errore caricamento analisi per confronto')
    } finally {
      setLoading(false)
    }
  }
  
  const toggleQuestionSelection = (fieldKey, respondentType) => {
    const key = `${fieldKey}_${respondentType}`
    const isSelected = selectedQuestions.some(q => `${q.field_key}_${q.respondent_type}` === key)
    
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => `${q.field_key}_${q.respondent_type}` !== key))
    } else {
      const question = questions.find(q => q.field_key === fieldKey && q.respondent_type === respondentType)
      if (question) {
        setSelectedQuestions([...selectedQuestions, question])
      }
    }
  }

  const runSequentialAnalysis = async () => {
    if (selectedQuestions.length === 0) {
      setError('Seleziona almeno 2 domande per l\'analisi sequenziale')
      return
    }

    setSequenceRunning(true)
    setSequenceResults([])
    setError(null)

    const results = []

    // Funzione helper per delay tra richieste
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i]
      
      setSequenceProgress({
        current: i + 1,
        total: selectedQuestions.length,
        currentQuestion: question,
        phase: 'taxonomy',
        phaseProgress: 0
      })

      try {
        // FASE 1: Genera tassonomia (automatica, senza revisione)
        setSequenceProgress(prev => ({ ...prev, phase: 'taxonomy', phaseProgress: 30 }))
        
        // Retry con delay per evitare sovraccarico LLM
        let taxonomyData = null
        let retryCount = 0
        const maxRetries = 2
        
        while (!taxonomyData && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              // Delay progressivo: 3s, 5s, 10s
              const delayTime = retryCount === 1 ? 3000 : 5000
              console.log(`Retry ${retryCount}/${maxRetries} dopo ${delayTime}ms delay...`)
              await delay(delayTime)
            }
            
            const taxonomyResponse = await fetch(`${API_URL}/api/qualitative-analysis/generate-taxonomy`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                field_key: question.field_key,
                respondent_type: question.respondent_type,
                max_categories: 8,
                template: sequenceTemplate
              })
            })

            if (!taxonomyResponse.ok) {
              const errorText = await taxonomyResponse.text()
              throw new Error(`HTTP ${taxonomyResponse.status}: ${errorText}`)
            }

            taxonomyData = await taxonomyResponse.json()
            
          } catch (err) {
            console.error(`Tentativo ${retryCount + 1} fallito:`, err)
            retryCount++
            if (retryCount > maxRetries) {
              throw new Error(`Errore generazione tassonomia dopo ${maxRetries + 1} tentativi: ${err.message}`)
            }
          }
        }
        
        setSequenceProgress(prev => ({ ...prev, phase: 'taxonomy', phaseProgress: 100 }))

        // FASE 2: Classifica risposte in batch (automatica)
        setSequenceProgress(prev => ({ ...prev, phase: 'classification', phaseProgress: 0 }))

        let startIndex = 0
        const batchSize = 30
        let isComplete = false
        let taxonomyId = null

        while (!isComplete) {
          const classifyResponse = await fetch(`${API_URL}/api/qualitative-analysis/classify-responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field_key: question.field_key,
              respondent_type: question.respondent_type,
              taxonomy: taxonomyData.taxonomy,
              batch_size: batchSize,
              start_index: startIndex
            })
          })

          if (!classifyResponse.ok) {
            throw new Error('Errore classificazione')
          }

          const classifyData = await classifyResponse.json()
          
          setSequenceProgress(prev => ({ 
            ...prev, 
            phase: 'classification', 
            phaseProgress: classifyData.progress_percentage 
          }))
          
          isComplete = classifyData.is_complete
          startIndex += batchSize

          if (isComplete && classifyData.taxonomy_id) {
            taxonomyId = classifyData.taxonomy_id
          }
        }

        // Successo!
        results.push({
          question,
          status: 'completed',
          taxonomyId,
          error: null
        })

      } catch (err) {
        console.error(`Errore analisi domanda ${question.field_key}:`, err)
        results.push({
          question,
          status: 'error',
          taxonomyId: null,
          error: err.message
        })
      }

      setSequenceResults([...results])
      
      // Delay tra domande diverse per evitare sovraccarico LLM
      // (solo se non è l'ultima domanda)
      if (i < selectedQuestions.length - 1) {
        console.log('Pausa di 2 secondi prima della prossima domanda...')
        await delay(2000)
      }
    }

    // Completato!
    setSequenceRunning(false)
    setSequenceProgress({
      current: selectedQuestions.length,
      total: selectedQuestions.length,
      currentQuestion: null,
      phase: 'completed',
      phaseProgress: 100
    })

    // Ricarica lista tassonomie salvate
    loadSavedTaxonomies()
  }

  if (loading && questions.length === 0) {
    return <div className="loading">Caricamento analisi qualitativa...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.FileText className="w-6 h-6" />
          Analisi Qualitativa - Risposte Aperte
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
          Analisi semantica con clustering e tassonomia automatica tramite LLM
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('single')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'single' ? '#3b82f6' : 'transparent',
            color: activeTab === 'single' ? '#ffffff' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'single' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Analisi Singola
        </button>
        <button
          onClick={() => setActiveTab('sequential')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'sequential' ? '#3b82f6' : 'transparent',
            color: activeTab === 'sequential' ? '#ffffff' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'sequential' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.Zap className="w-5 h-5" />
          Analisi Sequenziale
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'archive' ? '#3b82f6' : 'transparent',
            color: activeTab === 'archive' ? '#ffffff' : '#64748b',
            border: 'none',
            borderBottom: activeTab === 'archive' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Icons.Archive className="w-5 h-5" />
          Archivio Analisi
          {savedTaxonomies.length > 0 && (
            <span style={{
              backgroundColor: activeTab === 'archive' ? '#ffffff' : '#3b82f6',
              color: activeTab === 'archive' ? '#3b82f6' : '#ffffff',
              padding: '0.125rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              {savedTaxonomies.length}
            </span>
          )}
        </button>
      </div>

      {/* ========== TAB: ARCHIVIO ANALISI ========== */}
      {activeTab === 'archive' && (
        <div>
          {archiveViewMode === 'list' ? (
            <>
              {/* Header con ricerca e filtri */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Archive className="w-6 h-6" />
                  Archivio Analisi ({savedTaxonomies.length})
                </h3>
                
                {/* Box di ricerca */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Icons.Search 
                      className="w-5 h-5" 
                      style={{ 
                        position: 'absolute', 
                        left: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#94a3b8',
                        pointerEvents: 'none'
                      }} 
                    />
                    <input
                      type="text"
                      placeholder="Cerca analisi... (es: PRO, studenti)"
                      value={archiveSearchQuery}
                      onChange={(e) => setArchiveSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    {archiveSearchQuery && (
                      <button
                        onClick={() => setArchiveSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '0.25rem'
                        }}
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtri */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                      Tipo Domanda
                    </label>
                    <select
                      value={archiveFilterQuestion}
                      onChange={(e) => setArchiveFilterQuestion(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b'
                      }}
                    >
                      <option value="all">Tutte le domande</option>
                      <option value="pros_cons">PRO e CONTRO</option>
                      <option value="suggestions">Suggerimenti</option>
                      <option value="practices">Pratiche e strumenti</option>
                      <option value="concerns">Preoccupazioni</option>
                      <option value="benefits">Benefici</option>
                      <option value="challenges">Sfide</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                      Gruppo
                    </label>
                    <select
                      value={archiveFilterGroup}
                      onChange={(e) => setArchiveFilterGroup(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b'
                      }}
                    >
                      <option value="all">Tutti i gruppi</option>
                      <option value="students">Studenti</option>
                      <option value="teachers_active">Insegnanti in Servizio</option>
                      <option value="teachers_training">Insegnanti Non in Servizio</option>
                    </select>
                  </div>
                </div>

                {/* Info confronto */}
                {selectedForComparison.length > 0 && (
                  <div style={{
                    backgroundColor: '#dbeafe',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icons.CheckCircle className="w-5 h-5" style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.95rem', color: '#1e40af', fontWeight: '600' }}>
                        {selectedForComparison.length} analisi selezionate per il confronto
                      </span>
                    </div>
                    {selectedForComparison.length === 2 && (
                      <button
                        onClick={loadComparisonView}
                        style={{
                          padding: '0.5rem 1.25rem',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Icons.ArrowLeftRight className="w-4 h-4" />
                        Confronta
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lista analisi */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {getFilteredArchive().length > 0 ? (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {getFilteredArchive().map((tax) => {
                      const isSelected = selectedForComparison.includes(tax.id)
                      return (
                        <div
                          key={tax.id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                        >
                          {/* Checkbox per confronto */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleComparisonSelection(tax.id)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          />

                          {/* Info analisi */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                  {getQuestionLabel(tax.field_key)}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                  {getRespondentLabel(tax.respondent_type)} • {new Date(tax.created_at).toLocaleDateString('it-IT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                                  "{getQuestionFullText(tax.field_key)}"
                                </div>
                              </div>
                            </div>

                            {/* Statistiche */}
                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Icons.Tag className="w-4 h-4" style={{ color: '#3b82f6' }} />
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                  <strong style={{ color: '#1e293b' }}>{tax.n_clusters}</strong> categorie
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Icons.MessageSquare className="w-4 h-4" style={{ color: '#10b981' }} />
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                  <strong style={{ color: '#1e293b' }}>{tax.n_responses}</strong> risposte
                                </span>
                              </div>
                            </div>

                            {/* Azioni */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${tax.id}`)
                                    const data = await response.json()
                                    setArchiveSelectedAnalysis(data)
                                    setArchiveViewMode('single')
                                  } catch (err) {
                                    console.error('Errore caricamento analisi:', err)
                                    alert('Errore nel caricamento dell\'analisi')
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#3b82f6',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <Icons.Eye className="w-4 h-4" />
                                Visualizza
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const password = prompt('Inserisci password amministratore:')
                                  if (password && confirm('Sei sicuro di voler eliminare questa analisi?')) {
                                    fetch(`${API_URL}/api/qualitative-analysis/taxonomy/${tax.id}?password=${encodeURIComponent(password)}`, {
                                      method: 'DELETE'
                                    })
                                    .then(res => {
                                      if (res.ok) {
                                        alert('Analisi eliminata')
                                        loadSavedTaxonomies()
                                        setSelectedForComparison(selectedForComparison.filter(id => id !== tax.id))
                                      } else if (res.status === 401) {
                                        alert('Password errata')
                                      } else {
                                        alert('Errore eliminazione')
                                      }
                                    })
                                    .catch(err => alert('Errore: ' + err.message))
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                                Elimina
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    <Icons.Archive className="w-16 h-16" style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Nessuna analisi trovata
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {archiveSearchQuery || archiveFilterQuestion !== 'all' || archiveFilterGroup !== 'all' 
                        ? 'Prova a modificare i filtri o la ricerca'
                        : 'Non ci sono ancora analisi salvate'
                      }
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : archiveViewMode === 'single' && archiveSelectedAnalysis ? (
            // Vista singola analisi
            <div>
              {/* Header informativo sticky */}
              <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: '#f0f9ff',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Icons.FileText className="w-6 h-6" style={{ color: '#3b82f6' }} />
                      <h3 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0, fontWeight: '700' }}>
                        Analisi Qualitativa
                      </h3>
                    </div>
                    
                    <div style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.75rem', fontWeight: '600' }}>
                      "{getQuestionFullText(archiveSelectedAnalysis.field_key)}"
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icons.Users className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        <strong>Gruppo:</strong> {getRespondentLabel(archiveSelectedAnalysis.respondent_type)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icons.Calendar className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        <strong>Data:</strong> {new Date(archiveSelectedAnalysis.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icons.Tag className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        <strong>Categorie:</strong> {archiveSelectedAnalysis.taxonomy?.length || 0}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icons.MessageSquare className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        <strong>Risposte:</strong> {archiveSelectedAnalysis.summary?.total_responses || 0}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setArchiveSelectedAnalysis(null)
                      setArchiveViewMode('list')
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ffffff',
                      color: '#3b82f6',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexShrink: 0
                    }}
                  >
                    <Icons.ArrowLeft className="w-4 h-4" />
                    Torna all'Archivio
                  </button>
                </div>
              </div>

              {/* Risultati analisi con categorie collassabili */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1.5rem' }}>
                  Categorie Identificate
                </h3>

                {archiveSelectedAnalysis.summary?.category_counts?.map((cat, idx) => {
                  const categoryKey = `archive_${archiveSelectedAnalysis.id}_${cat.category}`
                  const isExpanded = expandedCategories[categoryKey] !== false // Default expanded
                  
                  return (
                    <div key={idx} style={{
                      marginBottom: '1.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      overflow: 'hidden'
                    }}>
                      {/* Header collassabile */}
                      <div
                        onClick={() => {
                          setExpandedCategories(prev => ({
                            ...prev,
                            [categoryKey]: !isExpanded
                          }))
                        }}
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background-color 0.2s',
                          backgroundColor: isExpanded ? '#ffffff' : '#f8fafc'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#ffffff' : '#f8fafc'}
                      >
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isExpanded ? (
                              <Icons.ChevronDown className="w-5 h-5" style={{ color: '#3b82f6' }} />
                            ) : (
                              <Icons.ChevronRight className="w-5 h-5" style={{ color: '#94a3b8' }} />
                            )}
                            {cat.category}
                          </h4>
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                            <span><Icons.MessageSquare className="w-4 h-4 inline" /> <strong>{cat.n_questions}</strong> risposte</span>
                            <span><strong>{cat.percentage}%</strong> del totale</span>
                          </div>
                        </div>

                        {/* Barra percentuale nel header */}
                        <div style={{
                          width: '150px',
                          height: '8px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          marginLeft: '1rem'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            width: `${cat.percentage}%`,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>

                      {/* Contenuto collassabile - TUTTE LE RISPOSTE */}
                      {isExpanded && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          backgroundColor: '#ffffff'
                        }}>
                          {/* Tutte le risposte della categoria */}
                          {cat.examples && cat.examples.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                                Tutte le risposte ({cat.examples.length}):
                              </div>
                              <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {cat.examples.map((example, i) => {
                                  // Gestisci sia oggetti {code, text, confidence} che stringhe semplici
                                  const isObject = typeof example === 'object' && example !== null
                                  const displayText = isObject ? example.text : example
                                  const respondentCode = isObject ? example.code : null
                                  const confidence = isObject ? example.confidence : null
                                  
                                  return (
                                    <div key={i} style={{
                                      padding: '1rem',
                                      backgroundColor: '#f8fafc',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '0.9rem',
                                      color: '#475569',
                                      transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)'
                                      e.currentTarget.style.boxShadow = 'none'
                                    }}
                                    >
                                      <div style={{ fontStyle: 'italic', marginBottom: respondentCode ? '0.5rem' : 0, color: '#1e293b' }}>
                                        "{displayText}"
                                      </div>
                                      {respondentCode && (
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <Icons.Users className="w-3 h-3" />
                                          Rispondente: <strong style={{ color: '#64748b' }}>{respondentCode}</strong>
                                          {confidence && (
                                            <span style={{ 
                                              marginLeft: '0.5rem', 
                                              padding: '0.125rem 0.5rem',
                                              backgroundColor: confidence > 0.8 ? '#dcfce7' : '#fef3c7',
                                              color: confidence > 0.8 ? '#166534' : '#854d0e',
                                              borderRadius: '4px',
                                              fontSize: '0.7rem',
                                              fontWeight: '600'
                                            }}>
                                              {(confidence * 100).toFixed(0)}%
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : archiveViewMode === 'comparison' && comparisonView ? (
            // Vista confronto
            <div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.ArrowLeftRight className="w-6 h-6" />
                    Confronto Analisi
                  </h3>
                  <button
                    onClick={() => {
                      setComparisonView(null)
                      setSelectedForComparison([])
                      setArchiveViewMode('list')
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Icons.X className="w-4 h-4" />
                    Chiudi Confronto
                  </button>
                </div>

                {/* Griglia confronto 2 colonne */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Analisi 1 */}
                  <div>
                    <div style={{
                      backgroundColor: '#f0f9ff',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '2px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        Analisi 1
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {getQuestionLabel(comparisonView.analysis1.field_key)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        {getRespondentLabel(comparisonView.analysis1.respondent_type)}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <span><strong>{comparisonView.analysis1.taxonomy.length}</strong> categorie</span>
                        <span><strong>{comparisonView.analysis1.summary?.total_responses || 0}</strong> risposte</span>
                      </div>
                    </div>

                    {/* Categorie */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {comparisonView.analysis1.summary?.category_counts?.map((cat, idx) => (
                        <div key={idx} style={{
                          padding: '0.75rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {cat.category}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            {cat.n_questions} risposte • {cat.percentage}%
                          </div>
                          <div style={{
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              backgroundColor: '#3b82f6',
                              width: `${cat.percentage}%`
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analisi 2 */}
                  <div>
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '2px solid #10b981'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        Analisi 2
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {getQuestionLabel(comparisonView.analysis2.field_key)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        {getRespondentLabel(comparisonView.analysis2.respondent_type)}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <span><strong>{comparisonView.analysis2.taxonomy.length}</strong> categorie</span>
                        <span><strong>{comparisonView.analysis2.summary?.total_responses || 0}</strong> risposte</span>
                      </div>
                    </div>

                    {/* Categorie */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {comparisonView.analysis2.summary?.category_counts?.map((cat, idx) => (
                        <div key={idx} style={{
                          padding: '0.75rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {cat.category}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            {cat.n_questions} risposte • {cat.percentage}%
                          </div>
                          <div style={{
                            height: '6px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              backgroundColor: '#10b981',
                              width: `${cat.percentage}%`
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========== TAB: ANALISI SEQUENZIALE ========== */}
      {activeTab === 'sequential' && (
        <div>
          {/* Step 1: Selezione multipla domande */}
          {!sequenceRunning && (
            <>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
                  Step 1: Seleziona Domande (minimo 2)
                </h3>
                
                {/* Box di ricerca */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Icons.Search 
                      className="w-5 h-5" 
                      style={{ 
                        position: 'absolute', 
                        left: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: '#94a3b8',
                        pointerEvents: 'none'
                      }} 
                    />
                    <input
                      type="text"
                      placeholder="Cerca domande... (es: PRO, studenti, suggerimenti)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '0.25rem'
                        }}
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.85rem', 
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Icons.Info className="w-4 h-4" />
                      Trovate {getFilteredQuestions().length} domande su {questions.length}
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  {getFilteredQuestions().length > 0 ? (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {getFilteredQuestions().map((q, idx) => {
                        const isSelected = selectedQuestions.some(
                          sq => sq.field_key === q.field_key && sq.respondent_type === q.respondent_type
                        )
                        return (
                          <label
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '1rem',
                              backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleQuestionSelection(q.field_key, q.respondent_type)}
                              style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                {q.question_text}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {getRespondentLabel(q.respondent_type)} • {q.n_responses} risposte
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1'
                    }}>
                      <Icons.Search className="w-12 h-12" style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                      <div style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        Nessuna domanda trovata
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Prova con un termine diverso o <button
                          onClick={() => setSearchQuery('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                          }}
                        >
                          cancella la ricerca
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Riepilogo selezione */}
                {selectedQuestions.length > 0 && (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '2px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}>
                    <Icons.CheckCircle className="w-5 h-5" style={{ color: '#3b82f6', marginTop: '0.1rem', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                        Selezionate {selectedQuestions.length} domande
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                        Totale risposte da analizzare: {selectedQuestions.reduce((sum, q) => sum + q.n_responses, 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Selezione template */}
              {selectedQuestions.length >= 2 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
                    Step 2: Seleziona Template Condiviso
                  </h3>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>
                      Tipo di Analisi (sarà applicato a TUTTE le domande)
                    </label>
                    <select
                      value={sequenceTemplate}
                      onChange={(e) => setSequenceTemplate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {templates.map((template) => (
                        <option key={template.key} value={template.key}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    {templates.find(t => t.key === sequenceTemplate) && (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                        {templates.find(t => t.key === sequenceTemplate).description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Avvia sequenza */}
              {selectedQuestions.length >= 2 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
                    Step 3: Avvia Analisi Automatica
                  </h3>
                  
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                    <Icons.Zap className="w-5 h-5" style={{ color: '#f59e0b', marginTop: '0.2rem', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                      <strong>Modalità automatica:</strong>
                      <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                        <li>Le tassonomie verranno generate automaticamente (senza revisione)</li>
                        <li>Le risposte verranno classificate automaticamente</li>
                        <li>I risultati verranno salvati automaticamente</li>
                        <li>Il processo continuerà anche in caso di errori su singole domande</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={runSequentialAnalysis}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Icons.Play className="w-6 h-6" />
                    Avvia Analisi Sequenziale
                  </button>
                </div>
              )}

              {selectedQuestions.length === 1 && (
                <div style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#92400e'
                }}>
                  Seleziona almeno 2 domande per usare l'analisi sequenziale
                </div>
              )}
            </>
          )}

          {/* Progresso sequenza */}
          {sequenceRunning && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icons.RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} />
                Analisi in corso...
              </h3>

              {/* Progresso generale */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '1rem', color: '#475569', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Domanda {sequenceProgress.current} di {sequenceProgress.total}
                </div>
                <div style={{
                  height: '12px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: '#10b981',
                    width: `${(sequenceProgress.current / sequenceProgress.total) * 100}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* Domanda corrente */}
              {sequenceProgress.currentQuestion && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    Elaborando:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {sequenceProgress.currentQuestion.question_text}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                    {getRespondentLabel(sequenceProgress.currentQuestion.respondent_type)}
                  </div>

                  {/* Progresso fase */}
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {sequenceProgress.phase === 'taxonomy' && (
                      <>
                        <Icons.FileText className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        Generazione tassonomia...
                      </>
                    )}
                    {sequenceProgress.phase === 'classification' && (
                      <>
                        <Icons.Search className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        Classificazione risposte... {sequenceProgress.phaseProgress}%
                      </>
                    )}
                  </div>
                  {sequenceProgress.phase === 'classification' && (
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        width: `${sequenceProgress.phaseProgress}%`,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  )}
                </div>
              )}

              {/* Lista domande con stato */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {selectedQuestions.map((q, idx) => {
                  const result = sequenceResults.find(
                    r => r.question.field_key === q.field_key && r.question.respondent_type === q.respondent_type
                  )
                  const isCurrent = sequenceProgress.currentQuestion && 
                    sequenceProgress.currentQuestion.field_key === q.field_key &&
                    sequenceProgress.currentQuestion.respondent_type === q.respondent_type
                  const isCompleted = result && result.status === 'completed'
                  const isError = result && result.status === 'error'
                  const isPending = !isCurrent && !result

                  return (
                    <div key={idx} style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: isCompleted ? '#d1fae5' : isError ? '#fee2e2' : isCurrent ? '#dbeafe' : '#f8fafc',
                      border: `1px solid ${isCompleted ? '#10b981' : isError ? '#ef4444' : isCurrent ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{ flexShrink: 0 }}>
                        {isCompleted && <Icons.CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />}
                        {isError && <Icons.XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />}
                        {isCurrent && <Icons.RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} />}
                        {isPending && <Icons.Clock className="w-6 h-6" style={{ color: '#94a3b8' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                          {q.question_text}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {getRespondentLabel(q.respondent_type)}
                        </div>
                        {isError && result.error && (
                          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '0.25rem' }}>
                            Errore: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Risultati finali */}
          {!sequenceRunning && sequenceResults.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
                Analisi Sequenziale Completata
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: '#d1fae5',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '600', color: '#10b981' }}>
                    {sequenceResults.filter(r => r.status === 'completed').length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
                    Completate
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#fee2e2',
                  padding: '1rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '600', color: '#ef4444' }}>
                    {sequenceResults.filter(r => r.status === 'error').length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                    Errori
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {sequenceResults.map((result, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    backgroundColor: result.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${result.status === 'completed' ? '#10b981' : '#ef4444'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {result.status === 'completed' ? (
                        <Icons.CheckCircle className="w-5 h-5" style={{ color: '#10b981', flexShrink: 0 }} />
                      ) : (
                        <Icons.XCircle className="w-5 h-5" style={{ color: '#ef4444', flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>
                          {result.question.question_text}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {getRespondentLabel(result.question.respondent_type)}
                        </div>
                        {result.error && (
                          <div style={{ fontSize: '0.8rem', color: '#991b1b', marginTop: '0.25rem' }}>
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                    {result.status === 'completed' && result.taxonomyId && (
                      <button
                        onClick={() => {
                          loadTaxonomy(result.taxonomyId)
                          setActiveTab('single')
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        Vedi Risultati
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setSequenceResults([])
                    setSelectedQuestions([])
                    setSequenceProgress({ current: 0, total: 0, currentQuestion: null, phase: '', phaseProgress: 0 })
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                >
                  Nuova Analisi Sequenziale
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: ANALISI SINGOLA (ESISTENTE) ========== */}
      {activeTab === 'single' && (
        <div>
      {/* Selezione domanda */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
          Passo 1: Seleziona Domanda Aperta
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>
            Domanda
          </label>
          <select
            value={selectedQuestion ? JSON.stringify({ field_key: selectedQuestion.field_key, respondent_type: selectedQuestion.respondent_type }) : ''}
            onChange={(e) => {
              if (!e.target.value) {
                setSelectedQuestion(null)
                setTaxonomy(null)
                setResults(null)
                return
              }
              const { field_key, respondent_type } = JSON.parse(e.target.value)
              const q = questions.find(q => q.field_key === field_key && q.respondent_type === respondent_type)
              setSelectedQuestion(q)
              setTaxonomy(null)
              setResults(null)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.95rem',
              backgroundColor: '#ffffff',
              color: '#1e293b'
            }}
          >
            <option value="">-- Seleziona una domanda --</option>
            {questions.map((q, i) => (
              <option key={i} value={JSON.stringify({ field_key: q.field_key, respondent_type: q.respondent_type })}>
                {q.question_text} ({getRespondentLabel(q.respondent_type)} - {q.n_responses} risposte)
              </option>
            ))}
          </select>
        </div>

        {selectedQuestion && (
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
              <strong>Domanda selezionata:</strong>
            </div>
            <div style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>
              {selectedQuestion.question_text}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong>Gruppo:</strong> {getRespondentLabel(selectedQuestion.respondent_type)} • 
              <strong> Risposte:</strong> {selectedQuestion.n_responses}
            </div>
          </div>
        )}
      </div>

      {/* FASE 1: Generazione Tassonomia */}
      {selectedQuestion && !taxonomy && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
            Passo 2: Seleziona Tipo di Analisi e Genera Tassonomia
          </h3>
          
          {/* Selettore Template */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>
              Tipo di Analisi
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}
            >
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
            {templates.find(t => t.key === selectedTemplate) && (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                {templates.find(t => t.key === selectedTemplate).description}
              </p>
            )}
          </div>
          
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
            L'LLM analizzerà le risposte e creerà automaticamente le categorie tematiche.
            Potrai poi modificarle prima della classificazione.
          </p>
          <button
            onClick={generateTaxonomy}
            disabled={generatingTaxonomy}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: generatingTaxonomy ? '#94a3b8' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: generatingTaxonomy ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {generatingTaxonomy ? (
              <>
                <Icons.RefreshCw className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <Icons.Play className="w-5 h-5" />
                Genera Tassonomia
              </>
            )}
          </button>
        </div>
      )}

      {/* FASE 1.5: Revisione Tassonomia */}
      {taxonomy && !results && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
              Passo 3: Rivedi e Modifica Tassonomia
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setEditingTaxonomy(!editingTaxonomy)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {editingTaxonomy ? 'Visualizza' : 'Modifica'}
              </button>
              <button
                onClick={addCategory}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Aggiungi Categoria
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: '#e0f2fe',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Icons.Info className="w-5 h-5" style={{ color: '#0284c7' }} />
                <strong style={{ color: '#0c4a6e', fontSize: '0.95rem' }}>Ottimizzazione Analisi</strong>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#0c4a6e', margin: 0 }}>
                Per ridurre il carico sul LLM, sono state <strong>filtrate le risposte troppo corte (&lt;10 caratteri)</strong> e 
                campionato <strong>casualmente il 50%</strong> delle risposte rimanenti. 
                La tassonomia è stata generata analizzando circa <strong>{taxonomy.n_responses} risposte</strong>.
              </p>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
              Trovate <strong>{taxonomy.taxonomy.length} categorie</strong>.
              Puoi modificare nomi, definizioni e keywords prima di procedere alla classificazione.
            </p>

            {/* Lista categorie */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {taxonomy.taxonomy.map((cat, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  {editingTaxonomy ? (
                    // Modalità editing
                    <>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Nome Categoria
                        </label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Definizione
                        </label>
                        <textarea
                          value={cat.definition}
                          onChange={(e) => updateCategory(idx, 'definition', e.target.value)}
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Keywords (separate con virgola)
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(cat.keywords) ? cat.keywords.join(', ') : cat.keywords}
                          onChange={(e) => updateCategory(idx, 'keywords', e.target.value.split(',').map(k => k.trim()))}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <button
                        onClick={() => deleteCategory(idx)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Elimina Categoria
                      </button>
                    </>
                  ) : (
                    // Modalità visualizzazione
                    <>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                        {idx + 1}. {cat.name}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
                        {cat.definition}
                      </div>
                      {cat.keywords && cat.keywords.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {(Array.isArray(cat.keywords) ? cat.keywords : [cat.keywords]).map((kw, i) => (
                            <span key={i} style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pulsante Avvia Classificazione */}
          <button
            onClick={classifyResponses}
            disabled={classifying}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: classifying ? '#94a3b8' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: classifying ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {classifying ? (
              <>
                <Icons.RefreshCw className="w-5 h-5 animate-spin" />
                Classificazione in corso ({classificationProgress}%)...
              </>
            ) : (
              <>
                <Icons.CheckCircle className="w-5 h-5" />
                Avvia Classificazione Risposte
              </>
            )}
          </button>

          {classifying && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                height: '8px',
                backgroundColor: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#10b981',
                  width: `${classificationProgress}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                Classificazione in batch di 30 risposte alla volta...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Errori */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <strong>Errore:</strong> {error}
        </div>
      )}

      {/* Tassonomie salvate */}
      {savedTaxonomies.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '2rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', fontWeight: '600' }}>
            Analisi Salvate ({savedTaxonomies.length})
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {savedTaxonomies.slice(0, 5).map((tax) => (
              <div
                key={tax.id}
                onClick={() => loadTaxonomy(tax.id)}
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #e2e8f0',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Header con pulsante elimina */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                      {getQuestionLabel(tax.field_key)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {getRespondentLabel(tax.respondent_type)}
                    </div>
                  </div>
                  
                  {/* Pulsante elimina e data */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Impedisce click sulla card
                        const password = prompt('Inserisci password amministratore per eliminare questa analisi:');
                        if (password) {
                          if (confirm(`Sei sicuro di voler eliminare questa analisi?\n\nDomanda: ${getQuestionLabel(tax.field_key)}\nGruppo: ${getRespondentLabel(tax.respondent_type)}\n\nQuesta azione non può essere annullata.`)) {
                            fetch(`http://localhost:8118/api/qualitative-analysis/taxonomy/${tax.id}?password=${encodeURIComponent(password)}`, {
                              method: 'DELETE'
                            })
                            .then(res => {
                              if (res.ok) {
                                alert('Analisi eliminata con successo');
                                // Ricarica lista
                                loadSavedTaxonomies();
                              } else if (res.status === 401) {
                                alert('Password errata');
                              } else {
                                alert('Errore durante eliminazione');
                              }
                            })
                            .catch(err => alert('Errore: ' + err.message));
                          }
                        }
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecaca';
                        e.currentTarget.style.borderColor = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fecaca';
                      }}
                    >
                      Elimina
                    </button>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      textAlign: 'right'
                    }}>
                      {new Date(tax.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Statistiche */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#3b82f6' }}>
                      {tax.n_clusters}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Categorie
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>
                      {tax.n_responses}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Risposte
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f59e0b' }}>
                      {Math.round((tax.n_responses / tax.n_clusters) * 10) / 10}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Media/cat
                    </div>
                  </div>
                </div>

                {/* Domanda completa */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '500' }}>
                    Domanda:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                    "{getQuestionFullText(tax.field_key)}"
                  </div>
                </div>

                {/* TUTTE le categorie (senza limite) */}
                {tax.top_categories && tax.top_categories.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Categorie ({tax.total_categories}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {/* Mostra top_categories */}
                      {tax.top_categories.map((cat, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.65rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '12px',
                          border: '1px solid #93c5fd',
                          whiteSpace: 'nowrap'
                        }}>
                          {cat}
                        </span>
                      ))}
                      {/* Se ci sono altre categorie, mostriamo che sono disponibili nell'analisi completa */}
                      {tax.total_categories > tax.top_categories.length && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.65rem',
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          borderRadius: '12px',
                          fontStyle: 'italic'
                        }}>
                          + {tax.total_categories - tax.top_categories.length} altre (vedi analisi completa)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Call to action */}
                <div style={{
                  fontSize: '0.85rem',
                  color: '#3b82f6',
                  fontWeight: '500',
                  textAlign: 'center',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  Clicca per visualizzare l'analisi completa →
                </div>
              </div>
            ))}
          </div>
          
          {savedTaxonomies.length > 5 && (
            <div style={{
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#64748b'
            }}>
              Visualizzate 5 di {savedTaxonomies.length} analisi salvate
            </div>
          )}
        </div>
      )}

      {/* Risultati */}
      {results && results.summary && (
        <div>
          {/* HEADER INFORMATIVO STICKY */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#f0f9ff',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Icons.FileText className="w-6 h-6" style={{ color: '#3b82f6' }} />
                  <h3 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0, fontWeight: '700' }}>
                    Analisi Qualitativa
                  </h3>
                </div>
                
                <div style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.75rem', fontWeight: '600' }}>
                  "{getQuestionFullText(results.field_key)}"
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Users className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <strong>Gruppo:</strong> {getRespondentLabel(results.respondent_type)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Calendar className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <strong>Data:</strong> {new Date(results.created_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Tag className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <strong>Categorie:</strong> {results.taxonomy?.length || 0}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.MessageSquare className="w-4 h-4" style={{ color: '#3b82f6' }} />
                    <strong>Risposte:</strong> {results.summary?.total_responses || 0}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => {
                    setResults(null)
                    setTaxonomy(null)
                    setSelectedQuestion(null)
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ffffff',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Icons.ArrowLeft className="w-4 h-4" />
                  Nuova Analisi
                </button>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>
            Risultati Analisi
          </h3>

          {/* Distribuzione categorie */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h4 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', fontWeight: '600' }}>
              Distribuzione Categorie
            </h4>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {results.summary.category_counts.map((cat, idx) => {
                // Usa stato globale per tracciare categorie espanse
                // Di default tutte le categorie sono chiuse
                const isExpanded = expandedCategories[cat.category] !== undefined 
                  ? expandedCategories[cat.category] 
                  : false;
                
                const toggleExpanded = () => {
                  setExpandedCategories(prev => ({
                    ...prev,
                    [cat.category]: !isExpanded
                  }));
                };
                
                return (
                  <div key={idx} style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Header categoria con barra - CLICCABILE */}
                    <div 
                      onClick={toggleExpanded}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: isExpanded ? '0.75rem' : '0',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        margin: '-0.5rem',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Icona espandi/comprimi */}
                      <div style={{ 
                        fontSize: '1.2rem', 
                        color: '#64748b',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        ▶
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                          {cat.category}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {cat.n_questions} risposte ({cat.percentage}%)
                        </div>
                      </div>
                      <div style={{
                        width: '200px',
                        height: '8px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#3b82f6',
                          width: `${cat.percentage}%`
                        }} />
                      </div>
                    </div>

                    {/* Contenuto espandibile */}
                    {isExpanded && (
                      <div style={{ marginTop: '0.75rem' }}>
                        {/* Descrizione categoria */}
                        {cat.description && (
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#475569',
                            marginBottom: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            borderLeft: '3px solid #3b82f6'
                          }}>
                            {cat.description}
                          </div>
                        )}

                        {/* Keywords */}
                        {cat.keywords && cat.keywords.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                              Parole chiave:
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {cat.keywords.map((kw, kwIdx) => (
                                <span key={kwIdx} style={{
                                  fontSize: '0.8rem',
                                  padding: '0.25rem 0.75rem',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '12px'
                                }}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Esempi */}
                        {cat.examples && cat.examples.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                              Esempi di risposte ({cat.examples.length}):
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {cat.examples.map((ex, exIdx) => (
                                <div key={exIdx} style={{
                                  padding: '0.75rem',
                                  backgroundColor: '#fff',
                                  borderRadius: '6px',
                                  fontSize: '0.85rem',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  <div style={{ color: '#475569', marginBottom: '0.25rem' }}>
                                    "{ex.text}"
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Rispondente: <strong>{ex.code}</strong> (confidenza: {(ex.confidence * 100).toFixed(0)}%)
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Co-occorrenze */}
          {results.summary.cooccurrence && results.summary.cooccurrence.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h4 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', fontWeight: '600' }}>
                Co-occorrenze Categorie (Top 15)
              </h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {results.summary.cooccurrence.map((co, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                      {co.categories || `${co.cat_i} + ${co.cat_j}`}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {co.description || `${co.count} volte`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Narrativo Discorsivo */}
          {results.narrative_report && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '2rem',
              border: '2px solid #3b82f6'
            }}>
              <div style={{
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '600', margin: 0 }}>
                  Report Analitico Narrativo
                </h4>
              </div>
              <div 
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: '#334155'
                }}
                dangerouslySetInnerHTML={{
                  __html: results.narrative_report
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*"(.+?)"\*/g, '<em>"$1"</em>')
                    .replace(/\n\n/g, '</p><p style="margin-bottom: 1rem;">')
                    .replace(/^(.+)$/gm, '<p style="margin-bottom: 1rem;">$1</p>')
                    .replace(/## (.+)/g, '<h3 style="font-size: 1.1rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h3>')
                }}
              />
            </div>
          )}

          {/* Pulsante per generare report se non esiste */}
          {!results.narrative_report && (
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              textAlign: 'center',
              border: '1px dashed #3b82f6'
            }}>
              <p style={{ fontSize: '1rem', color: '#1e40af', marginBottom: '1rem' }}>
                Vuoi un report discorsivo con citazioni delle risposte?
              </p>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch(
                      `http://localhost:8118/api/qualitative-analysis/taxonomy/${results.id}/generate-report`,
                      { method: 'POST' }
                    );
                    const data = await response.json();
                    setResults({ ...results, narrative_report: data.report });
                  } catch (err) {
                    setError('Errore generazione report: ' + err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#94a3b8' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Generazione in corso...' : 'Genera Report Narrativo'}
              </button>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  )
}

export default QualitativeAnalysis
