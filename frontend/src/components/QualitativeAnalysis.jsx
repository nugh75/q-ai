import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function QualitativeAnalysis() {
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
  )
}

export default QualitativeAnalysis
