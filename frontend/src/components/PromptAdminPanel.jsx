import { useState, useEffect } from 'react'
import { Icons } from './Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'
const ADMIN_PASSWORD = 'Lagom192.'

function PromptAdminPanel() {
  const [defaultPrompts, setDefaultPrompts] = useState([])
  const [customPrompts, setCustomPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    template_key: '',
    template_name: '',
    description: '',
    system_prompt: '',
    user_prompt_template: '',
    is_active: true
  })

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_URL}/api/admin/qualitative-prompts?password=${ADMIN_PASSWORD}`)
      
      if (!response.ok) {
        throw new Error('Errore caricamento prompt')
      }

      const data = await response.json()
      setDefaultPrompts(data.default_prompts || [])
      setCustomPrompts(data.custom_prompts || [])
    } catch (err) {
      console.error('Errore:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (prompt = null) => {
    if (prompt) {
      // Modifica esistente
      setFormData({
        id: prompt.id,
        template_key: prompt.template_key,
        template_name: prompt.template_name,
        description: prompt.description || '',
        system_prompt: prompt.system_prompt,
        user_prompt_template: prompt.user_prompt_template,
        is_active: prompt.is_active !== false
      })
      setEditing(prompt.id || 'new')
    } else {
      // Nuovo prompt
      setFormData({
        template_key: '',
        template_name: '',
        description: '',
        system_prompt: '',
        user_prompt_template: '',
        is_active: true
      })
      setEditing('new')
    }
    setError(null)
    setSuccess(null)
  }

  const copyFromDefault = (defaultPrompt) => {
    setFormData({
      template_key: defaultPrompt.template_key + '_custom',
      template_name: defaultPrompt.template_name + ' (Personalizzato)',
      description: defaultPrompt.description,
      system_prompt: defaultPrompt.system_prompt,
      user_prompt_template: defaultPrompt.user_prompt_template,
      is_active: true
    })
    setEditing('new')
    setError(null)
    setSuccess(null)
  }

  const savePrompt = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validazione
      if (!formData.template_key || !formData.template_name || !formData.system_prompt || !formData.user_prompt_template) {
        throw new Error('Compila tutti i campi obbligatori')
      }

      const response = await fetch(`${API_URL}/api/admin/qualitative-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          password: ADMIN_PASSWORD
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Errore salvataggio prompt')
      }

      setSuccess('Prompt salvato con successo!')
      setEditing(null)
      await loadPrompts()
    } catch (err) {
      console.error('Errore:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deletePrompt = async (promptId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prompt?')) return

    try {
      setError(null)
      const response = await fetch(`${API_URL}/api/admin/qualitative-prompts/${promptId}?password=${ADMIN_PASSWORD}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Errore eliminazione prompt')
      }

      setSuccess('Prompt eliminato con successo!')
      await loadPrompts()
    } catch (err) {
      console.error('Errore:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Caricamento...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icons.Settings className="w-6 h-6" />
          Amministrazione Prompt Analisi Qualitativa
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
          Gestisci i prompt per l'analisi qualitativa con LLM
        </p>
      </div>

      {/* Messaggi */}
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

      {success && (
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <strong>Successo:</strong> {success}
        </div>
      )}

      {/* Form Modifica/Creazione */}
      {editing && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
              {editing === 'new' ? 'Nuovo Prompt' : 'Modifica Prompt'}
            </h3>
            <button
              onClick={() => setEditing(null)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                Chiave Template * (es: sentiment_custom, thematic_v2)
              </label>
              <input
                type="text"
                value={formData.template_key}
                onChange={(e) => setFormData({ ...formData, template_key: e.target.value })}
                disabled={editing !== 'new'}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
                placeholder="sentiment_custom"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                Nome Template *
              </label>
              <input
                type="text"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
                placeholder="Analisi del Sentiment Personalizzata"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
                placeholder="Descrizione del tipo di analisi"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                System Prompt * (istruzioni generali per LLM)
              </label>
              <textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                placeholder="Sei un esperto di analisi qualitativa..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>
                User Prompt Template * (usa {"{n_responses}"}, {"{responses_text}"}, {"{max_categories}"})
              </label>
              <textarea
                value={formData.user_prompt_template}
                onChange={(e) => setFormData({ ...formData, user_prompt_template: e.target.value })}
                rows={10}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                placeholder="Analizza queste {n_responses} risposte..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>Attivo</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={savePrompt}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: saving ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                {saving ? 'Salvataggio...' : 'Salva Prompt'}
              </button>
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Personalizzati */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1e293b', margin: 0 }}>
            Prompt Personalizzati ({customPrompts.length})
          </h3>
          <button
            onClick={() => startEdit(null)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            + Nuovo Prompt
          </button>
        </div>

        {customPrompts.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            Nessun prompt personalizzato. Crea il tuo o copia da un template di default.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {customPrompts.map((prompt) => (
              <div key={prompt.id} style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: `2px solid ${prompt.is_active ? '#10b981' : '#cbd5e1'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                      {prompt.template_name}
                      {!prompt.is_active && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>(Disattivato)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
                      Key: {prompt.template_key}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEdit(prompt)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title="Modifica"
                    >
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#991b1b'
                      }}
                      title="Elimina"
                    >
                      <Icons.Close className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {prompt.description && (
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
                    {prompt.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt di Default (per copiare) */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>
          Template di Default ({defaultPrompts.length})
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
          Puoi copiare e personalizzare questi template
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {defaultPrompts.map((prompt, idx) => (
            <div key={idx} style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                    {prompt.template_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                    Key: {prompt.template_key}
                  </div>
                  {prompt.description && (
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                      {prompt.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => copyFromDefault(prompt)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Copia e Modifica
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromptAdminPanel
