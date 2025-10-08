import { useState, useEffect } from 'react'
import { Icons } from './Icons'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8118'

function LLMAdminPanel() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState(null)
  
  // Form state
  const [provider, setProvider] = useState('ollama')
  const [endpoint, setEndpoint] = useState('http://192.168.129.14:11434')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('llama3.2')
  
  const [message, setMessage] = useState(null)
  const [ollamaModels, setOllamaModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)

  const checkAuth = async (pwd) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/llm-config?password=${encodeURIComponent(pwd)}`)
      
      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Password non valida' })
        return false
      }
      
      if (!response.ok) throw new Error('Errore verifica configurazione')
      
      const data = await response.json()
      
      if (data.configured) {
        setCurrentConfig(data)
        setProvider(data.provider)
        setModelName(data.model_name)
        if (data.endpoint) setEndpoint(data.endpoint)
      }
      
      return true
    } catch (error) {
      console.error('Errore auth:', error)
      setMessage({ type: 'error', text: 'Errore connessione al server' })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const success = await checkAuth(password)
    if (success) {
      setAuthenticated(true)
      setMessage({ type: 'success', text: 'Accesso amministrazione consentito' })
    }
  }

  const loadOllamaModels = async () => {
    if (!endpoint) return
    
    try {
      setLoadingModels(true)
      const response = await fetch(
        `${API_URL}/api/admin/ollama-models?endpoint=${encodeURIComponent(endpoint)}&password=${encodeURIComponent(password)}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setOllamaModels(data.models || [])
        if (data.models && data.models.length > 0 && !modelName) {
          setModelName(data.models[0].name)
        }
      } else {
        console.error('Errore caricamento modelli Ollama')
      }
    } catch (error) {
      console.error('Errore connessione Ollama:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    if (authenticated && provider === 'ollama' && endpoint) {
      loadOllamaModels()
    }
  }, [authenticated, provider, endpoint])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage(null)
      
      const configData = {
        password,
        provider,
        endpoint: provider === 'ollama' ? endpoint : '',
        api_key: provider !== 'ollama' ? apiKey : '',
        model_name: modelName
      }
      
      const response = await fetch(`${API_URL}/api/admin/llm-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })
      
      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Password non valida' })
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore salvataggio configurazione')
      }
      
      const result = await response.json()
      
      setMessage({ type: 'success', text: result.message })
      
      // Ricarica config
      await checkAuth(password)
    } catch (error) {
      console.error('Errore save config:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '4rem auto',
        padding: '2rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Icons.Settings className="w-8 h-8" style={{ margin: '0 auto', color: '#8b5cf6' }} />
          <h2 style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#1e293b' }}>
            Amministrazione LLM
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
            Inserisci la password per accedere alla configurazione
          </p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
              Password Amministratore
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="Inserisci password"
              required
            />
          </div>
          
          {message && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
              color: message.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#94a3b8' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verifica...' : 'Accedi'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>
          <Icons.Settings className="w-6 h-6" style={{ display: 'inline', marginRight: '0.5rem' }} />
          Configurazione LLM per Analisi Qualitativa
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b' }}>
          Configura il Large Language Model per l'analisi semantica delle risposte aperte
        </p>
      </div>

      {/* Stato attuale */}
      {currentConfig && currentConfig.configured && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#dcfce7',
          border: '2px solid #16a34a',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.75rem', fontSize: '1rem' }}>
            ✅ Configurazione Attiva
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem', fontSize: '0.9rem', color: '#166534' }}>
            <div><strong>Provider:</strong></div>
            <div>{currentConfig.provider}</div>
            <div><strong>Modello:</strong></div>
            <div>{currentConfig.model_name}</div>
            {currentConfig.endpoint && (
              <>
                <div><strong>Endpoint:</strong></div>
                <div>{currentConfig.endpoint}</div>
              </>
            )}
            <div><strong>API Key:</strong></div>
            <div>{currentConfig.has_api_key ? '••••••••' : 'Non configurata'}</div>
          </div>
        </div>
      )}

      {/* Form configurazione */}
      <form onSubmit={handleSaveConfig} style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1.5rem' }}>
          Configura nuovo LLM
        </h3>

        {/* Provider */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
            Provider LLM
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: '#ffffff',
              color: '#1e293b'
            }}
          >
            <option value="ollama">Ollama (locale)</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI ChatGPT</option>
          </select>
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
            {provider === 'ollama' && 'Ollama locale su tua macchina'}
            {provider === 'gemini' && 'API Gemini (richiede API key)'}
            {provider === 'openai' && 'API OpenAI (richiede API key)'}
          </small>
        </div>

        {/* Endpoint (solo Ollama) */}
        {provider === 'ollama' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
              Endpoint Ollama
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder="http://192.168.129.14:11434"
              required
            />
            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
              URL del server Ollama (default: http://192.168.129.14:11434)
            </small>
          </div>
        )}

        {/* API Key (Gemini/OpenAI) */}
        {provider !== 'ollama' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
              required
            />
            <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
              {provider === 'gemini' && 'Ottieni su: https://makersuite.google.com/app/apikey'}
              {provider === 'openai' && 'Ottieni su: https://platform.openai.com/api-keys'}
            </small>
          </div>
        )}

        {/* Nome modello */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
            Nome Modello
            {provider === 'ollama' && ollamaModels.length > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#10b981' }}>
                ({ollamaModels.length} modelli disponibili)
              </span>
            )}
          </label>
          
          {provider === 'ollama' && ollamaModels.length > 0 ? (
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
              required
            >
              {ollamaModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#1e293b'
              }}
              placeholder={
                provider === 'ollama' ? 'llama3.2' :
                provider === 'gemini' ? 'gemini-pro' :
                'gpt-4o-mini'
              }
              required
            />
          )}
          
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b', fontSize: '0.85rem' }}>
            {provider === 'ollama' && loadingModels && '⏳ Caricamento modelli...'}
            {provider === 'ollama' && !loadingModels && ollamaModels.length === 0 && 'Es: llama3.2, mistral, qwen2.5'}
            {provider === 'gemini' && 'Es: gemini-pro, gemini-1.5-flash'}
            {provider === 'openai' && 'Es: gpt-4o-mini, gpt-4o, gpt-3.5-turbo'}
          </small>
        </div>

        {/* Messaggio */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
            border: `2px solid ${message.type === 'error' ? '#ef4444' : '#16a34a'}`,
            color: message.type === 'error' ? '#991b1b' : '#166534',
            fontSize: '0.9rem'
          }}>
            {message.text}
          </div>
        )}

        {/* Bottoni */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: loading ? '#94a3b8' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>
        </div>
      </form>

      {/* Info box */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f0f9ff',
        border: '2px solid #3b82f6',
        borderRadius: '8px'
      }}>
        <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.75rem' }}>
          ℹ️ Note sulla Configurazione
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#1e40af', lineHeight: '1.6' }}>
          <li><strong>Ollama:</strong> Gratuito, locale, privacy-first. Richiede Ollama installato sulla tua macchina.</li>
          <li><strong>Gemini:</strong> API Google, ottima qualità, 60 richieste/minuto gratis.</li>
          <li><strong>OpenAI:</strong> API GPT-4/GPT-3.5, massima qualità, a pagamento (circa $0.50 per 1000 risposte analizzate).</li>
        </ul>
      </div>
    </div>
  )
}

export default LLMAdminPanel
